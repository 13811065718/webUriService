const ServiceFramework = require("../../framework/ServiceFramework");
const IWanClient = require('iwan-sdk');
const Web3Lib = require("web3");
const {
    convMeta2CardanoFormat
} = require("../utilService/commonUtils");
const Erc1155ABI = require("../../../config/abi/erc1155.json");
const Erc721ABI = require("../../../config/abi/erc721.json");

class Web3Handler {

    constructor(serviceCfg) {
        this.web3RpcConfig = serviceCfg;

        this.mapNftScAbiMgr = new Map();
        this.mapDataFetchLocker = new Map();
        this.mapChainNftRecord = new Map();   // chainType-> nftId -> metaData         
    }

    async init() {
        this.logUtilSrv = ServiceFramework.getService("UtilServiceInterface", "Log4UtilService");
        // this.iWanConnector = serviceFramework.getService("BCConnectorInterface", "IWanBCConnector");
        this.configService = ServiceFramework.getService("ConfigServiceInterface", "ConfigServiceJson");
        this.globalConstant = ServiceFramework.getService("GlobalConstantService", "GlobalConstant");

        this.dataValidLatestTs = await this.configService.getGlobalConfig("dataValidLatestTs");

        this.mapNftScAbiMgr.set("Erc721", Erc721ABI);
        this.mapNftScAbiMgr.set("Erc1155", Erc1155ABI);
    }

    async handleGetNFTMetaData(reqOption, mapChainID2Type, mapChainTokenId2Type) {
        if (undefined === reqOption) {
            this.logUtilSrv.logInfo('Web3Handler', 'handleGetNFTMetaData...invalid params');
            return undefined;
        }

        let ancestorChain = reqOption.ancestorChain;
        let targetChainType = reqOption.targetChainType;
        let contractId = reqOption.contractId;
        let tokenIds = reqOption.tokenIds;

        let currentTs = Date.now();

        let nftId2MetaData = new Map();
        for (let i = 0; i < tokenIds.length; i++) {

            let tokenId = tokenIds[i];
            let nftUniqueId = contractId + "-" + tokenId;

            // Step 1: to check record data in memory
            let mapNftRecord = this.mapChainNftRecord.get(ancestorChain);// chainType-> nftUniqueId -> metaData
            if (undefined === mapNftRecord) {
                mapNftRecord = new Map();
            }

            let lastRecord = mapNftRecord.get(nftUniqueId);
            let nftMetaData = undefined;
            if ((undefined !== lastRecord)
                && ((lastRecord.updatedTs + this.dataValidLatestTs) > currentTs)) {

                nftMetaData = lastRecord.nftMetaData;
                this.logUtilSrv.logInfo('Web3Handler', 'retrieveMetaData in Memory...nftInfo: ', nftMetaData);
                console.log('Web3Handler...retrieveMetaData in Memory...nftInfo: ', nftMetaData);

            } else {
                let mapTokenId2Type = mapChainTokenId2Type.get(ancestorChain);
                // console.log('Web3Handler...mapTokenId2Type : ', ancestorChain, contractId, mapTokenId2Type);
                if (undefined === mapTokenId2Type) {
                    return undefined;
                }

                let tokenType = mapTokenId2Type.get(contractId);
                console.log('Web3Handler...tokenType : ', tokenType, contractId);
                if (undefined === tokenType) {
                    return undefined;
                }

                let chainType = mapChainID2Type.get(ancestorChain);
                nftMetaData = await this.retrieveNftMetaDataOnChain(chainType, tokenType, contractId, tokenId);
                if (undefined === nftMetaData) {
                    return undefined;
                }
                this.logUtilSrv.logInfo('Web3Handler', 'retrieveMetaData On Chain...nftInfo: ', nftMetaData);
                console.log('Web3Handler...retrieveMetaData On Chain...nftInfo: ', nftMetaData);
            

                //Step 4: to update memory record
                let nftUniqueId = contractId + "-" + tokenId; 
                let latestRecord = {
                    "updatedTs": Date.now(),
                    "nftMetaData": nftMetaData
                }
                mapNftRecord.set(nftUniqueId, latestRecord);
                this.mapChainNftRecord.set(ancestorChain, mapNftRecord);
            }

            nftId2MetaData[tokenId] = nftMetaData;
        }

        return nftId2MetaData;
    }


    async retrieveNftMetaDataOnChain(chainType, nftType, contractId, tokenId) {
        // // to get data fetch locker
        // while(this.mapDataFetchLocker.get("metaData")){
        //     await sleep(1000);
        // }
        // this.mapDataFetchLocker.set("metaData", true); 

        // Step 2: to get meta data on chain
        let curTsBeforeCheck = Date.now();
        let nftURI = await this.retrieveNFTUri(chainType, nftType, contractId, tokenId);
        console.log('Web3Handler...retrieveNFTUri : ', nftURI);
        if (undefined === nftURI) {
            // this.mapDataFetchLocker.set("metaData", false);
            return undefined;
        }

        // Step 3: to retrieve nft metaData from IPFS;  -- wait to test !!!
        let nftMetaData = await this.retrieveNFTDataByUri(nftURI);
        console.log('Web3Handler...retrieveNFTDataByUri : ', nftMetaData);
        if (undefined === nftMetaData) {
            // this.mapDataFetchLocker.set("metaData", false);
            return undefined;
        }
        nftMetaData.tokenURI = nftURI;
        this.logUtilSrv.logInfo('Web3Handler', 'handleGetNFTMetaData...nftMetaData: ', nftMetaData);

        let curTsAfterCheck = Date.now();
        console.log("\n\n...handleGetNFTMetaData from: ", curTsBeforeCheck, " to: ", curTsAfterCheck,
            "...cost: ", curTsAfterCheck - curTsBeforeCheck);
        // this.mapDataFetchLocker.set("metaData", false); 
        return nftMetaData;
    }

    async retrieveNFTUri(chainType, nftType, contractId, tokenId) {

        let chainRpc = this.web3RpcConfig[chainType];
        // console.log("\n\n...chainRpc for ", chainType, " is: ", chainRpc);

        let web3Inst = new Web3Lib.Web3(chainRpc);
        let jsonScAbi = this.mapNftScAbiMgr.get(nftType);
        let scInst = new web3Inst.eth.Contract(jsonScAbi, contractId);

        // nftType is ERC721, tokenURI
        // if is ERC1155, then uri
        try {
            let nftURI = undefined;
            if("Erc721" === nftType){
                nftURI = await scInst.methods.tokenURI(tokenId).call();
                // console.log("\n\n...erc721 nftURI: ", nftURI);

            }else{
                nftURI = await scInst.methods.uri(tokenId).call();
                // console.log("\n\n...erc1155 nftURI: ", nftURI);
            }

            this.logUtilSrv.logInfo('Web3Handler', 'retrievenftURI...nftURI: ', nftURI);
            return nftURI;

        } catch (e) {
            this.logUtilSrv.logInfo('Web3Handler', 'retrieveNFTUrl...failed: ', e);
            return undefined;
        }
    }

    async retrieveNFTDataByUri(nftURI) {
        if (undefined === nftURI) {
            return undefined;
        }

        try {
            const ipfsReq = new Request(nftURI);
            const ipfsResp = await fetch(ipfsReq);
            const ipfsMetaData = await ipfsResp.json();

            console.log("\n\n...retrieveNFTDataByURL: ", ipfsMetaData);
            return ipfsMetaData;

        } catch (e) {
            console.log("\n\n...retrieveNFTDataByURL failed: ", e);
            return undefined;
        }
    }



}

module.exports = Web3Handler;
