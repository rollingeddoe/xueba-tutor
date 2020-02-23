const express = require('express');
// const exphbs = require('express-handlebars')
// const log = require('./middleware/log.js')
const app = express();


/*****************************************
* REGULAR (non-middleware) DEPENDENCIES  *
*****************************************/
const moment = require('moment'); // Date parsing library
const bcrypt = require('bcryptjs');


    // database connection //
// const mysql = require('mysql')
// const db_config ={
//     host: process.env.DB_HOST,
//     port: 3306,
//     user: process.env.DB_USER,  // Environment variable. Start app like: 'DB_USER=app DB_PASS=test nodemond index.js' OR use .env
//     password: process.env.DB_PASS,
//     database: process.env.DB_NAME
// };

// const db = mysql.createConnection(db_config);

// function handleDisconnect(conn) {
//     conn.on('error', function(err) {
//         if (!err.fatal) {
//             return;
//         }

//         if (err.code !== 'PROTOCOL_CONNECTION_LOST') {
//             throw err;
//         }
//         // setTimeout(handleDisconnect, 2000)
//         console.log('Re-connecting lost connection: ' + err.stack);
//         db = mysqlDriver.createConnection(config.CLEARDB_DATABASE_URL);
//         handleDisconnect(db);
//         db.connect();
//     });
// }

// handleDisconnect(db);



//  method 2
const database = require('./middleware/database');
const db = database.pool;




/*******************************************
*   IMPORT MIDDLEWARE AND EXPRESS HELPERS  *
*******************************************/
const session = require('express-session'); // Used to create, set, and update cookies to maintain user sessions
const bodyParser = require('body-parser'); // Used to parse incoming POSTed data
const exphbs = require('express-handlebars');  // Templating engine
// Set up handlebars with a custom simple date formatting helper
const hbs = exphbs.create({
    helpers: {
        formatDate: function (date) {
            return moment(date).format('MMM DD, YYYY');
        }
    }
})

const logger = require('./middleware/logger');
const passport = require('passport'); // Authentication middleware
const LocalStrategy = require('passport-local').Strategy;
const flash = require('express-flash');


/************************
*  REGISTER MIDDLEWARE  *
*************************/

app.use(logger.log); // Log all the things
// Initialize and configure Express sessions
// These settings are OK for us
app.use(session({ 
    secret: 'ha8hWp,yoZF',  // random characters for secret
    cookie: { maxAge: 600000 }, // cookie expires after some time
    saveUninitialized: true,
    resave: true
}));
app.use(flash());
app.use(bodyParser.urlencoded({ extended: false })); // Parse form submissions
app.use(bodyParser.json()); // parse application/json
app.use(express.static('public')); // Static files will use the 'public' folder as their root
app.engine('handlebars', hbs.engine); // Register the handlebars templating engine
app.set('view engine', 'handlebars'); // Set handlebars as our default template engine


/************************
*    PASSPORT CONFIG    *
*************************/
app.use(passport.initialize()); // Needed to use Passport at all
app.use(passport.session()); // Needed to allow for persistent sessions with passport

passport.use(new LocalStrategy({
        passReqToCallback: true // Passes req to the callback function, so we can put messages there if needed
    },
    function (req, username, password, done) {
        // Find the user based off their username
        const q = `SELECT * FROM users WHERE username = ?;`
        db.query(q, [username], function (err, results, fields) {
            if (err) return done(err);

            // User, if it exists, will be the first row returned
            // There should also only _be_ one row, provided usernames are unique in the app (and they should be!)
            const user = results[0]

            // 'done' here is looking for the following arguments: error, user, and a message or callback
            if (!user) {
                return done(null, false, req.flash('loginMessage', 'User not found')); // req.flash stores a temporary key/value
            };

            // User exists, check password against hash
            const userHash = user.hash; // Grab the hash of the user
            // Hash and compare the provided password with the stored hash.
            // This is an async function, so we have to use a callback to receive the results and continue
            bcrypt.compare(password, userHash, function(err, matches) {
                if (!matches) {
                    return done(null, false, req.flash('loginMessage', 'Incorrect username and/or password'));
                };
                // Otherwise, they match -- success! -- send passport the user (see: serializeUser)
                if (user.status !== 'Verified') {
                    return done(null, false, req.flash('loginMessage', 'Your account is awaiting for verification, please be patient!'));
                };     
                return done(null, user);
               
            });
        })
    }
))

passport.serializeUser(function(user, done) {
    done(null, user.UserID);
});

// Tells passport how to get user from information in session
// This will run on every request for which session data exists in a cookie.
passport.deserializeUser(function(UserID, done) {
    const q = `SELECT * FROM users WHERE UserID = ?;`
    db.query(q, [UserID], function (err, results, fields) {
        done(err, results[0]) // results[0] will be stored _in req.user_ for use in later middleware
    });
})


// homepage
app.get('/', function (req, res) {


    const qt = `SELECT section.SectionID,section.StartTime,section.EndTime,section.TuitionFee,section.Intro,section.Status,users.firstname,courses.CourseName FROM section,users,courses WHERE section.UserID = users.UserID AND section.CourseID = courses.CourseID ORDER BY section.StartTime `;
    db.query(qt,function(err,results,fields){
        if (err) {
        return console.error(err);
        };
    
        if (!results[0]) {
            return res.render("homepage",{NOTutor:"There are no tutors yet!", bookMessage:req.flash('bookMessage')
            });
        };  
        res.render("homepage",{sections : results,bookMessage:req.flash('bookMessage')
        });
    }) 

});



// become a tutor
app.get('/apply', requireLoggedIn,function (req, res) {
    res.redirect("https://goo.gl/forms/QxwVwbbTa9Lv0hKh2")
});




//
// ACCOUNT MANAGEMENT
//

function requireLoggedIn(req, res, next) {
    const user = req.user;
    if (!user) {
        return res.status(401).redirect('/login')
    }
    next();
}


app.get('/profile', requireLoggedIn, function (req, res) {
    const user = req.user;
    // console.log("users",user)
    
    if(user.IS_TUTOR !== 'N' ){
        // const qt = `SELECT section.SectionID,section.StartTime,section.EndTime,section.Status,courses.CourseName FROM section,users,courses WHERE users.UserID=?  AND section.UserID = users.UserID AND section.CourseID = courses.CourseID `;
        // db.query(qt,[req.user.UserID],function(err,results3,fields){
        //     if (err) {
        //     return console.error(err);
        //     };
     
            return res.render('profilepage', { user: user, tutor:user.username,postMessage : req.flash('postMessage') });
        // })
    };
    res.render('profilepage', { user: user});
})



app.get('/login', function (req, res) {
    const user = req.user;
    if (user) {
        // If we already have a user, don't let them see the login page, just send them to the admin!
        res.redirect('/profile');
    } else {
        res.render('login', { loginMessage: req.flash('loginMessage') })
    }
});


app.post('/login',passport.authenticate('local', {
            successRedirect: '/', 
            failureRedirect: '/login',
            failureFlash: true
        })
      
);

app.get('/register', function (req, res) {
    const user = req.user;
    if (user) {
        res.redirect('/profile');
    } else {
        res.render('register', { registerMessage: req.flash('registerMessage') })
    }
});

app.post('/register', function (req, res) {
    const username = req.body.username;
    const pass = req.body.password;
    const firstname = req.body.firstname;
    const lastname = req.body.lastname;
    
    if (!firstname || !lastname || !username || !pass) {
        req.flash('registerMessage', 'Information are required.')
        return res.redirect('/register');
    }   
    if (username.indexOf('@') === -1){
            req.flash('registerMessage', 'That username must be an email.');
            return res.redirect('/register');
    }else{
        var status = "Unverified"
        if(username.substring(username.lastIndexOf('@')) === "@rutgers.edu" || username.substring(username.lastIndexOf('@')) === "@scarletmail.rutgers.edu"){
            status  = "Verified"
        } 
    }
       
    // Check if user exists, first
    const checkExists = `SELECT * FROM users WHERE username = ?`
    db.query(checkExists, [username], function (err, results, fields) {

        if (err) {
            console.error(err);
            return res.status(500).send('Something bad happened...'); // Important: Don't execute other code
        }
        if (results[0]) {
            req.flash('registerMessage', 'That username is already taken.');
            return res.redirect('/register');
        }
        // Otherwise, user doesn't exist yet, let's create them!
        // Generate salt and pass for the user
        bcrypt.genSalt(10, function (err, salt) {
            if (err) throw err;
            bcrypt.hash(pass, salt, function (err, hash) {
                if (err) throw err;
                // Add user to database with username and hash
                const q = `INSERT INTO users(UserID, username, hash, firstname, lastname,status) VALUES (null, ?, ?, ?, ?,?)`;
                db.query(q, [username, hash,firstname, lastname,status], function (err, results, fields) {
                    if (err) console.error(err,results);
                   
                    req.flash('registerMessage', 'Account created successfully.');
                    return res.redirect('/register');
                })
            })
        });
    })
});

// log out of the account
app.get('/logout', function (req, res) {
//check if the user is logged in
const user = req.user;
    if (user) {
        req.logout();
        res.render('login', { logoutMessage: req.flash('logoutMessage')})
    } else {
        res.redirect('/login')
    }
});


//  post a section 
app.post('/profile',function (req, res) {
    const user = req.user;
    const CourseID = req.body.CourseID
    const StartTime = req.body.StartTime;
    const EndTime = req.body.EndTime;
    const TuitionFee = req.body.TuitionFee;
    const Intro =req.body.Intro;

    console.log("dfddfsdfsd",req.user)
 
    const checkCourseExists = `SELECT * FROM courses WHERE CourseID = ?`;
    db.query(checkCourseExists, [CourseID], function (err, results, fields){
        if (err) {
            console.error(err);
            return res.status(500).send('Something bad happened when querying database'); 
        };
        if (!results[0]) {
            req.flash('postMessage', "That course doesn't exist, Please check !"); 
            return res.redirect('/profile');  
            
        }else{  

            const q = `INSERT INTO section(SectionID, UserID,CourseID,StartTime,EndTime,TuitionFee,Intro,Status) VALUES (null, ?, ?, ?, ?, ?, ?,?)`;
            db.query(q,[req.user.UserID,CourseID,StartTime,EndTime,TuitionFee,Intro,'O'],function (err, results, fields){
                if (err) {
                    console.error(err);
                    return res.status(500).send('Failed. Oops.');
                }else{
                    req.flash('postMessage', 'Section added successfully!');
                    return res.redirect('/profile');
                }
            })

        };
    });   
    
});


//book a section and create a transaction
app.post(['/','/search/section'],requireLoggedIn,function(req,res){

    const SectionID = req.body.sectionID;
    const SectionStatus = req.body.sectionStatus;
    console.error(req.originalUrl,SectionID,"body ",req.body )
  

    const qt = `INSERT INTO transactions(TransactionID,UserID,SectionID,BookTime) VALUES (null,?,?,NOW())`;
    if(SectionStatus === "O"){
        console.error("opennnnnnn")
        db.query(qt,[req.user.UserID,SectionID],function (err, results, fields){
            if (err) {
                console.error(err);
                return res.status(500).send('Failed. Oops.');
            };
            console.error("insert ccccc")
            const secUp = `UPDATE section SET Status = '' WHERE SectionID = ?`;
            db.query(secUp,[SectionID],function(err, results, fields){
                console.error("succcccc")
                if (err) {
                    console.error(err);
                    return res.status(500).send('Failed. Oops.');
                };
                req.flash('bookMessage', 'Booked successfully!');
                return res.redirect(req.originalUrl);
            })
            
        });

    }else{
        console.error("closssss")
        req.flash('bookMessage', 'Section is alrady booked by others!! Go to Find a Tutor for open sections');
        return res.redirect(req.originalUrl);

    }
   
})







// search 
app.get(['/search','/search/section'],function(req,res){
    const depID = req.query.department;
    const courseID = req.query.course;
    // console.log("query",depID)
    const q = `SELECT * FROM departments ORDER BY DepartmentID`;
    db.query(q, function (err, results,fields) {
        if (err) {
            console.error(err);
        };
        const qc = `SELECT CourseID,CourseName FROM courses WHERE DepartmentID = ? ORDER BY CourseID`;
        if(depID && depID !== '000'){         
            db.query(qc,[depID],function(err,results2,fields){
                if (err) {
                    console.error(err);
                }
                res.render("search",{
                departments:results,
                courses:results2,
                searchTutor: req.flash('searchTutor')
                }); 
            })
        }else{
            db.query(`SELECT CourseID,CourseName FROM courses ORDER BY CourseID`,function(err,results2,fields){
                if (err) {
                    return console.error(err);
                };
                
                if(req.path === "/search/section"){
                    const qt = `SELECT section.SectionID,section.StartTime,section.EndTime,section.TuitionFee,section.Intro,section.Status,users.firstname,courses.CourseName FROM section,users,courses WHERE section.CourseID =?  AND section.status = 'O' AND section.UserID = users.UserID AND section.CourseID = courses.CourseID `;
                    db.query(qt,[courseID],function(err,results3,fields){
                        if (err) {
                        return console.error(err);
                        };
                 
                        if (!results3[0]) {
                            return res.render("search",{departments:results,courses:results2,searchTutor:"That course doesn't have any tutors yet!",bookMessage:req.flash('bookMessage')
                            });
                        };  
                        res.render("search",{departments:results,courses:results2,sections : results3, bookMessage:req.flash('bookMessage')
                        });
                    }) 
                }else{
                    return res.render("search",{departments:results,courses:results2
                    });
                }
               
            });
        }
    });
})




// error handler


app.use(function (req, res) {
    res.status(404).render('errort',{errorcode:"404",action:"could not",url: req.url}) 
})

app.use(function (req, res) {
    res.status(500).render('errort',{errorcode:"500",action:"server or database error when getting:", url: req.url}) 
})



app.listen(process.env.PORT, function ()  {
    console.log('XueBa Tutor is  running on server!')
})


