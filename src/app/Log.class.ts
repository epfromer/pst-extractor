var winston = require('winston');

export class Log {

    static logLevels = {
        error: 0,
        info: 1,
        debug1: 2,
        debug2: 3
    }
    
    static logColors = {
        error: 'red',
        info: 'yellow',
        debug1: 'blue',
        debug2: 'green'
    }
    
    static logger = new winston.Logger({
        levels: Log.logLevels,
        colors: Log.logColors,
        level: 'debug1',
        transports: [
            // colorize the output to the console
            new winston.transports.Console({colorize: true}),
            new winston.transports.File({
                filename: 'errors.log',
                level: 'error'
              })
        ]
    });

    static error(s: string) {
        Log.logger.error(s);
    }

    static info(s: string) {
        Log.logger.info(s);
    }

    static debug1(s: string) {
        Log.logger.debug1(s);
    }

    static debug2(s: string) {
        Log.logger.debug2(s);
    }
}