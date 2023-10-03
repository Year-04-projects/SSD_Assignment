const pino = require("pino");

const logger=pino({
    redact: ['req.headers.authorization', 'user.password'],
    transport:{
        target:"pino-pretty",
        options:{
            colorize: true,
            translateTime:'SYS:yyyy-mm-dd HH:mm:ss',
            // ignore: "pid,hostname",

        }
    }
});

module.exports = logger; 
