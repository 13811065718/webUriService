const ServiceFramework = require("../../framework/ServiceFramework");
const BlockFrostAPI = require('@blockfrost/blockfrost-js').BlockFrostAPI;
const { sleep, convMeta2EvmFormat } = require("../utilService/commonUtils");

class BlockFrostHandler {

    constructor(serviceCfg) {
        this.blockFrostCfg = serviceCfg;
        this.mapDataFetchLocker = new Map();
        this.mapChainNftRecord = new Map();
    }

    async init() {
        this.logUtilSrv = ServiceFramework.getService("UtilServiceInterface", "Log4UtilService");
        this.configService = ServiceFramework.getService("ConfigServiceInterface", "ConfigServiceJson");
        // this.globalConstant = ServiceFramework.getService("GlobalConstantService", "GlobalConstant");

        this.dataValidLatestTs = await this.configService.getGlobalConfig("dataValidLatestTs");

        this.blockFrostApi = new BlockFrostAPI({ projectId: this.blockFrostCfg.apiKey });
    }

    async handleGetNFTMetaData(reqOption, mapChainID2Type) {
        if (undefined === reqOption) {
            this.logUtilSrv.logInfo('BlockFrostHandler', 'getNftUrlById...invalid params');
            return undefined;
        }

        let ancestorChain = reqOption.ancestorChain;
        let targetChainType = reqOption.targetChainType;
        let contractId = reqOption.contractId;
        let tokenIds = reqOption.tokenIds;

        let nftId2MetaData = {};
        //
        for (let i = 0; i < tokenIds.length; i++) {
            //  in this case, tokenId is just name
            let name = tokenIds[i];
            let nftId = contractId + name;

            // Step 1: to check record data in memory
            let currentTs = Date.now();
            let nftMetaData = undefined;
            let mapNftRecord = this.mapChainNftRecord.get(ancestorChain);// chainType-> nftId -> metaData
            if (undefined === mapNftRecord) {
                mapNftRecord = new Map();
            }
            
            let lastRecord = mapNftRecord.get(nftId);
            if ((undefined !== lastRecord)
                && ((lastRecord.updatedTs + this.dataValidLatestTs) > currentTs)) {

                nftMetaData = lastRecord.nftMetaData;
                this.logUtilSrv.logInfo('BlockFrostHandler', 'retrieveMetaData in Memory...nftInfo: ', nftMetaData);

            } else {
                nftMetaData = await this.retrieveNftMetaDataOnChain(nftId);
                // this.logUtilSrv.logInfo('BlockFrostHandler', 'retrieveMetaData On Chain...nftInfo: ', nftMetaData);
                if (undefined === nftMetaData) {
                    return undefined;
                }

                let latestRecord = {
                    "updatedTs": Date.now(),
                    "nftMetaData": nftMetaData
                }
                mapNftRecord.set(nftId, latestRecord);
                this.mapChainNftRecord.set(ancestorChain, mapNftRecord);
                // this.mapDataFetchLocker.set("metaData", false);
            }
            
            nftId2MetaData[name] = nftMetaData;
        }

        return nftId2MetaData;
    }

    async retrieveNftMetaDataOnChain(nftId) {
        // // to get data fetch locker
        // while(this.mapDataFetchLocker.get("metaData")){
        //     await sleep(1000);
        // }
        // this.mapDataFetchLocker.set("metaData", true); 

        // Step 2: to fetch nft metadata from chain
        let curTsBeforeCheck = Date.now();
        let nftInfo = undefined;
        try {

            nftInfo = await this.blockFrostApi.assetsById(nftId);
            // this.logUtilSrv.logInfo('BlockFrostHandler', 'getNftUrlById...nftMetaData: ', nftId, nftInfo);
            // "metadata": {
            //     "name": "nutcoin",
            //     "description": "The Nut Coin",
            //     "ticker": "nutc",
            //     "url": "https://www.stakenuts.com/",
            //     "logo": "iVBORw0K........GgoAAAA",
            //     "decimals": 6
            // }
            if ((undefined === nftInfo) || (undefined === nftInfo.metadata)) {
                this.logUtilSrv.logInfo('BlockFrostHandler', 'getNftUrlById...failed to get nft metaData', nftInfo);
                // this.mapDataFetchLocker.set("metaData", false);
                return undefined;
            }

        } catch (e) {
            this.logUtilSrv.logInfo('BlockFrostHandler', 'getNftUrlById...get nft data error', nftId, e);
            // this.mapDataFetchLocker.set("metaData", false);
            return undefined;
        }


        // Step 2: to update nft data in memory
        let curTsAfterCheck = Date.now();
        console.log("\n\n...getNftUrlById from: ", curTsBeforeCheck, " to: ", curTsAfterCheck,
            "...cost: ", curTsAfterCheck - curTsBeforeCheck);

        let nftMetaData = nftInfo.metadata;

        return nftMetaData;
    }

}

module.exports = BlockFrostHandler;
