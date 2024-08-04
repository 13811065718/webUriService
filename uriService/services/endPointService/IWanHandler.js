const ServiceFramework = require("../../framework/ServiceFramework");
const IWanClient = require('iwan-sdk');

class IWanHandler {

    constructor(serviceCfg) {
        this.iWanConfig = serviceCfg;

        this.mapChainContract2TokenType = new Map(); // chainId -> contractId -> tokenType
    }

    async init() {
        this.logUtilSrv = ServiceFramework.getService("UtilServiceInterface", "Log4UtilService");
        // this.configService = ServiceFramework.getService("ConfigServiceInterface", "ConfigServiceJson");
        // // this.globalConstant = ServiceFramework.getService("GlobalConstantService", "GlobalConstant");
        // this.iWanConfig = await this.configService.getGlobalConfig("iWanConfig");

        this.iWanClientInst = new IWanClient(this.iWanConfig.apiKey,
            this.iWanConfig.secretKey,
            this.iWanConfig.option);

        this.bMainnet = ("api.wanchain.org" === this.iWanConfig.option.url) ? true : false;

        // non-finished: need to config chainId -> chainSymbol  
        this.chainId2TypeInfo = {};
        let bRet = await this.getTokenTypeInfo();
        if (false === bRet) {
            return false;
        }
    }

    async getChainId2TypeRecord() {

        let currentTs = Date.now();

        if ((undefined === this.chainId2TypeInfo.record)
            || ((this.chainId2TypeInfo.updatedTs + this.iWanConfig.dataValidLatestTs) <= currentTs)) {

            let bRet = await this.getTokenTypeInfo();
            if (false === bRet) {
                return undefined;
            }
        }

        return this.chainId2TypeInfo.record;
    }

    async getTokenTypeInfo() {
        let options = this.bMainnet ? { tags: ["bridge", "bridgeBeta"] } : { isAllTokenPairs: true }
        console.log("options: ", options);

        // this.chainId2TypeInfo
        let tokenPairs = undefined;
        try {
            tokenPairs = await this.iWanClientInst.getTokenPairs(options);
            // console.log("tokenPairs info: ", tokenPairs);

            if (undefined === tokenPairs) {
                return undefined;
            }
        } catch (err) {
            console.log(err);
            return undefined;
        }

        for (let i = 0; i < tokenPairs.length; i++) {
            let ancestorChainID = tokenPairs[i].ancestorChainID;
            let mapContractId2TokenType = this.mapChainContract2TokenType.get(ancestorChainID);
            if (undefined === mapContractId2TokenType) {
                mapContractId2TokenType = new Map();
            }
            
            mapContractId2TokenType.set(tokenPairs[i].fromAccount, tokenPairs[i].fromAccountType);
            // if("2153201998" === ancestorChainID){
            //     console.log("wanchain mapContractId2TokenType: ", mapContractId2TokenType);
            //     console.log("wanchain add token type: ", tokenPairs[i].fromAccount, tokenPairs[i].fromAccountType);
            // }
            this.mapChainContract2TokenType.set(ancestorChainID, mapContractId2TokenType);
        }

        return this.mapChainContract2TokenType;
    }

    async getSupportedChainInfo() {
        let supportedChainInfoArys = undefined;

        try {
            supportedChainInfoArys = await this.iWanClientInst.getSupportedChainInfo();

        } catch (err) {
            console.log("getSupportedChainInfo error:", err);
            return undefined;
        }

        let mapChainID2Type = new Map();
        if (undefined !== supportedChainInfoArys) {
            console.log("Supported ChainInfo Number: ", supportedChainInfoArys);
            for (let i = 0; i < supportedChainInfoArys.length; i++) {
                let tmpChainID = supportedChainInfoArys[i].chainID;
                // let tmpChainSymbol = supportedChainInfoArys[i].chainSymbol;
                let tmpChainType = supportedChainInfoArys[i].chainType;
    
                console.log("takes Supported ChainInfo : ", tmpChainID, tmpChainType);
                mapChainID2Type.set(tmpChainID, tmpChainType);
            }
        }

        return mapChainID2Type;
    }

}

module.exports = IWanHandler;
