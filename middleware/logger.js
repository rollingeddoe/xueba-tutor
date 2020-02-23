// Simple logger middleware
const moment = require('moment-timezone');
const requestIp = require('request-ip');


function log(req, res, next) {

    const now = moment().tz("America/New_York").format(' DD/MM/YYYY HH:mm:ss');
    const clientIp = requestIp.getClientIp(req);
  
    console.log(`${now}:    ${req.method}    URL- ${req.originalUrl}     from- ${clientIp}`);
   
    next();
}

// Export the log function
module.exports.log = log;