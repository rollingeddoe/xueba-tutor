const mysql = require('mysql')
const pool = mysql.createPool({
    connectionLimit: 2000,
    host: process.env.DB_HOST,
    port: 3306,
    user: process.env.DB_USER,  // Environment variable. Start app like: 'DB_USER=app DB_PASS=test nodemond index.js' OR use .env
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

pool.getConnection((err, connection) => {
    if (err) {
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            console.error('Database connection was closed.')
        }
        if (err.code === 'ER_CON_COUNT_ERROR') {
            console.error('Database has too many connections.')
        }
        if (err.code === 'ECONNREFUSED') {
            console.error('Database connection was refused.')
        }
    }
    if (connection) connection.release()
    return
})

module.exports.pool = pool