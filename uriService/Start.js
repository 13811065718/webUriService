const serviceFramework = require("./framework/ServiceFramework");
const ApiService = require("./services/apiService/ApiService");
const StorageService = require("./services/storageservice/StorageService");
const StorageMongoDB = require("./services/storageservice/StorageMongoDB");
const ConfigServiceJson = require('./services/configservice/ConfigServiceJson');
const EndPointService = require('./services/endPointService/EndPointService');
const Log4UtilService = require('./services/utilService/Log4UtilService');
const GlobalConstant = require("./services/globalConstantService/globalConstant");

const path = require('path');
const fs = require('fs');


class Start {
    constructor(options) {
    }

    async start() {
        try {
            console.log("Start.start()****************************")
            serviceFramework.registerService("GlobalConstantService", "GlobalConstant", GlobalConstant);

            // Config Service
            let cfgDir = path.join(__dirname, '../config');
            let configServiceJson = new ConfigServiceJson(cfgDir);
            await configServiceJson.init();
            serviceFramework.registerService("ConfigServiceInterface", "ConfigServiceJson", configServiceJson);
            console.log("Start.start()***************************1");

            // Log4UtilService Service
            let log4UtilService = new Log4UtilService();
            log4UtilService.init();
            serviceFramework.registerService("UtilServiceInterface", "Log4UtilService", log4UtilService);
            console.log("Start.start()****************************2");

            // // Storage Service
            // let mongoUrl = await configServiceJson.getGlobalConfig("mongo_url");
            // let storageService = new StorageService(mongoUrl, StorageMongoDB);
            // storageService.init();
            // serviceFramework.registerService("StorageServiceInterface", "StorageService", storageService);
            // console.log("Start.start()****************************3");

            // EndPointService
            let endPointService = new EndPointService();
            let ret = await endPointService.init();
            if(undefined === ret){
                console.log("err message: endPointService initial failed, try later again");
                return undefined;
            }
            serviceFramework.registerService("EndPointServiceInterface", "EndPointService", endPointService);
            console.log("Start.start()****************************6");

            // ApiService Service
            let apiService = new ApiService();
            await apiService.init();
            await apiService.startUp();
            serviceFramework.registerService("APIServiceInterface", "UrlService", apiService);
            console.log("Start.start()****************************7");

        } catch (err) {
            console.log("err message:", err.message);
            console.log("err stack:", err.stack);
        }
    }
}

let start = new Start();
start.start();
console.log("running...");

module.exports = start;
