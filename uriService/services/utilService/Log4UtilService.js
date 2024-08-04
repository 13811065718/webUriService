const log4js = require('log4js');


class Log4UtilService {

    constructor() {
    }

	init(){
		log4js.configure({
			appenders: {
				webUrlServiceLog: {
					type: "dateFile",
					filename: './logs/webUrlServiceLog',
					alwaysIncludePattern: true,
					compress: true,
					pattern: "-yyyy-MM-dd.log",
					encoding: 'utf-8',
					daysToKeep: 7
				},
			},
			categories: {
				default: {
					appenders: ['webUrlServiceLog'],
					level: 'info'
				},
			},  
			disableClustering: true
		});

		this.logInstance = log4js.getLogger('webUrlServiceLog');
	}

	logDebug(serviceName, preInfo, logData){

		let strPreName = "\n ...[" + serviceName + "]";
		let preLogInfo = strPreName + preInfo + ": ";

		this.logInstance.debug(preLogInfo, logData);
	}

	logError(serviceName, preInfo, logData){

		let strPreName = "\n ...[" + serviceName + "]";
		let preLogInfo = strPreName + preInfo + ": ";

		this.logInstance.error(preLogInfo, logData);
	}

	logInfo(serviceName, preInfo, logData){

		let strPreName = "\n ...[" + serviceName + "]";
		let preLogInfo = strPreName + preInfo + ": ";

		this.logInstance.info(preLogInfo, logData);
	}
}


module.exports = Log4UtilService;


