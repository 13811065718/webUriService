const EndPointServiceInterface = require("../../interfaces/EndPointServiceInterface");
const ServiceFramework = require("../../framework/ServiceFramework");
const BlockFrostHandler = require("./BlockFrostHandler");
const Web3Handler = require("./Web3Handler");
const IWanHandler = require("./IWanHandler");
const { sleep, convMeta2EvmFormat, convMeta2CardanoFormat } = require("../utilService/commonUtils");

class EndPointService extends EndPointServiceInterface {

    /**
     *Creates an instance of EndPointService.
     * @memberof EndPointService
     */
    constructor() {
        super();
    }

    async init() {
        // to scan rp db records and to get the timeout rp
        this.logUtilSrv = ServiceFramework.getService("UtilServiceInterface", "Log4UtilService");
        this.configService = ServiceFramework.getService("ConfigServiceInterface", "ConfigServiceJson");
        this.globalConstant = ServiceFramework.getService("GlobalConstantService", "GlobalConstant");
        // this.storageSrvIns = ServiceFramework.getService("StorageServiceInterface", "StorageService");

        // to initial rest request handler 
        this.blockFrostConfig = await this.configService.getGlobalConfig("blockFrostConfig");
        this.blockFrostHandler = new BlockFrostHandler(this.blockFrostConfig);
        await this.blockFrostHandler.init();

        this.web3RpcConfig = await this.configService.getGlobalConfig("web3RpcConfig");
        this.web3Handler = new Web3Handler(this.web3RpcConfig);
        await this.web3Handler.init();

        this.iWanConfig = await this.configService.getGlobalConfig("iWanConfig");
        this.iWanHandler = new IWanHandler(this.iWanConfig);
        await this.iWanHandler.init();

        this.mapChainID2Type = await this.iWanHandler.getSupportedChainInfo();
        if(undefined === this.mapChainID2Type){
            return false;
        }

        this.mapChainTokenId2Type = await this.iWanHandler.getTokenTypeInfo();
        if(undefined === this.mapChainTokenId2Type){
            return false;
        }

        return true;
    }

    async handlerRequest(router, postData) {
        let that = this;
        // console.log("\n\n router:" + router);
        this.logUtilSrv.logInfo("EndPointService", "...router...", router);
        this.logUtilSrv.logInfo("EndPointService", "...postData...", postData);

        if ('/getNftMetaData' == router) {
            let ret = await that.handleGetNFTMetaData(postData);

            this.logUtilSrv.logInfo("OgmiosRouterService", "...handleGetNFTMetaData...", ret);
            console.log("....getNftMetaData:", ret);
            return ret;

        } else {
            this.logUtilSrv.logError("OgmiosRouterService", "...Invalid Request!...", router);
            return "Invalid Request!";
        }
    }

    async handleGetNFTMetaData(postData) {
        let that = this;
        let reqOption = JSON.parse(postData);
        console.log('\n\n ......handleGetNFTMetaData......', reqOption);
        
        //uri format: URI prefix + ancestor chain + target chain type + contract id + token id
        let ancestorChainID = reqOption.ancestorChain;
        let targetChainID = reqOption.targetChainType;
        let contractId = reqOption.contractId;
        let tokenIds = reqOption.tokenIds;

        // can change to read from iwan apr
        let ancestorChainType = this.mapChainID2Type.get(ancestorChainID);
        if (undefined === ancestorChainType) {
            this.mapChainID2Type = await this.iWanHandler.getSupportedChainInfo();
            if (undefined === this.mapChainID2Type) {
                console.log('\n\n...handleGetNFTMetaData...update chain info failed, try later again!');
                return undefined;
            }
            ancestorChainType = this.mapChainID2Type.get(ancestorChainID);
            if (undefined === ancestorChainType) {
                console.log('\n\n...handleGetNFTMetaData...invalid chain id, please check your params!');
                return undefined;
            }
        }     

        let nftMetaData = undefined;
        if ("ADA" === ancestorChainType) {
            nftMetaData = await that.blockFrostHandler.handleGetNFTMetaData(reqOption, this.mapChainID2Type);
            console.log('\n\n ......handleGetNFTMetaData......result by blockfrost: ', nftMetaData);

            let targetChainType = this.mapChainID2Type.get(targetChainID);
            console.log('\n\n ......handleGetNFTMetaData......targetChainType: ', targetChainType);
            if ("ADA" !== targetChainType) {
                // non-finished:  to convert to cardano meta format
                nftMetaData = convMeta2EvmFormat(nftMetaData);
            }

        } else {
            // in EVM case, need to pre-Check token type info
            let mapTokenId2Type = this.mapChainTokenId2Type.get(ancestorChainID);
            if ((undefined === mapTokenId2Type) || (undefined === mapTokenId2Type.get(contractId))) {
                console.log('\n\n ......handleGetNFTMetaData......mapTokenId2Type: ', mapTokenId2Type);
                this.mapChainTokenId2Type = await this.iWanHandler.getTokenTypeInfo();
                if (undefined === this.mapChainTokenId2Type) {
                    console.log('\n\n...handleGetNFTMetaData...update token info failed, try later again!');
                    return undefined;
                }
            }   

            nftMetaData = await that.web3Handler.handleGetNFTMetaData(reqOption, this.mapChainID2Type, this.mapChainTokenId2Type);
            console.log('\n\n ......handleGetNFTMetaData......result by iWan: ', nftMetaData);

            let targetChainType = this.mapChainID2Type.get(targetChainID);
            console.log('\n\n ......handleGetNFTMetaData......targetChainType: ', targetChainType);
            if ("ADA" === targetChainType) {
                // non-finished:  to convert to cardano meta format
                nftMetaData = convMeta2CardanoFormat(nftMetaData);
            }
        }
        
        /// to judge the target chain type and then to decide whether need to change the metaData format
        console.log("\n\n return nftMetaData: ", nftMetaData);
        return nftMetaData;
    }



}

module.exports = EndPointService;
