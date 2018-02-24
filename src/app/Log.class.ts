var winston = require('winston');

export class Log {

    static logLevels = {
        error: 0,
        info: 1,
        debug: 2,
        debug1: 3,
        debug2: 4
    }
    
    static logColors = {
        error: 'red',
        info: 'yellow',
        debug: 'blue',
        debug1: 'green',
        debug2: 'grey'
    }
    
    static logger = new winston.Logger({
        levels: Log.logLevels,
        colors: Log.logColors,
        level: 'debug1',
        transports: [
            // colorize the output to the console
            new winston.transports.Console({colorize: true})
        ]
    });

    static error(s: string) {
        Log.logger.error(s);
    }

    static info(s: string) {
        Log.logger.info(s);
    }

    static debug(s: string) {
        Log.logger.debug(s);
    }

    static debug1(s: string) {
        Log.logger.debug1(s);
    }

    static debug2(s: string) {
        Log.logger.debug2(s);
    }
}