
const {
    createInteractionContext,
    createStateQueryClient,
    createTxSubmissionClient,
    TxSubmission
} = require('@cardano-ogmios/client');

const BigNumber = require('bignumber.js');

const CardanoWasm = require('@emurgo/cardano-serialization-lib-nodejs');



class OriginOgmios {

    // "https://nodes-testnet.wandevs.org
    constructor(){

        this.ogmiosServerConfig = {
            host: "44.229.225.45", //"nodes-testnet.wandevs.org",
            port: 1337
        };

    }

    async init() {
        await this.connectOgmiosNode();
    }

    async reconnectOgmiosNode(){
        setTimeout(async () => {
            try {
                await this.connectOgmiosNode();
            } catch (error) {
                console.log("CardanoServiceHandler...reconnectOgmiosNode...error...", error);
                this.reconnectOgmiosNode();
            }
        }, 10000);
    }

    async connectOgmiosNode(){
        let connectionOption = (undefined === this.ogmiosServerConfig.apiKey) ? {
            host: this.ogmiosServerConfig.host,
            port: this.ogmiosServerConfig.port,
        } : {
            host: this.ogmiosServerConfig.host,
            port: this.ogmiosServerConfig.port,
            tls: true,
            apiKey: this.ogmiosServerConfig.apiKey
        }

        this.context = await createInteractionContext(this.errorHandler.bind(this),
            this.closeHandler.bind(this),
            {
                connection: connectionOption,
                interactionType: 'LongRunning'
            });

        //query client
        this.queryClient = await createStateQueryClient(this.context);
        (await this.queryClient.chainTip()).slot;

        // tx submit client
        this.txSubmitClient = await createTxSubmissionClient(this.context);
    }

    byteArray2Hexstring(byteArray) {
        return Array.from(byteArray, function (byte) {
            return ('0' + (byte & 0xFF).toString(16)).slice(-2);
        }).join('')
    }


    async errorHandler(error) {
        console.error(error);
        // await client.shutdown();
    }

    async closeHandler(code, reason) {
        // console.log('WS close: code =', code, 'reason =', reason);
        // await client.shutdown();
        await this.reconnectOgmiosNode();
    }

    async getUtxosByAddress(address) {
        // console.log("\n\n .....getBlockByNo: ");
        console.log("CardanoServiceHandler...getUtxosByAddress...:", address);

        try {

            let filter = new Array();
            filter.push(address);
            let utxoObjs = await this.queryClient.utxo(filter);
            console.log("\n\n .....utxoObjs: ", utxoObjs);
            
            return utxoObjs;

        } catch (e) {
            console.log("query utxo by address exception: ", e);
            return undefined;
        }
    }

    async getBalanceByAddress(address) {
        // console.log("\n\n .....getBalanceByAddress: ");

        try {
            let filter = new Array();
            filter.push(address);
            let utxoObjs = await this.queryClient.utxo(filter);
            // console.log("\n\n .....utxoObjs: ", utxoObjs);

            let assetBalanceArray = new Array();
            for (let i = 0; i < utxoObjs.length; i++) {
                let utxoItem = utxoObjs[i];
                let txIn = utxoItem[0];
                let txOut = utxoItem[1];

                let utxoValue = txOut.value;
                let bTokenAsset = false;

                for (let key in utxoValue.assets) {
                    bTokenAsset = true;

                    let matchedId = undefined;
                    for (let index = 0; index < assetBalanceArray.length; index++) {
                        let assetItem = assetBalanceArray[index];
                        if (key === assetItem.unit) {
                            matchedId = index;
                            break;
                        }
                    }

                    let curAssetAmount = utxoValue.assets[key];
                    if (undefined === matchedId) {
                        let adaAmountObj = {
                            "unit": key,
                            "quantity": curAssetAmount.toString()
                        }
                        assetBalanceArray.push(adaAmountObj);

                    } else {
                        let curAmount = new BigNumber(curAssetAmount.toString());
                        let preAmount = new BigNumber(assetBalanceArray[matchedId].quantity);
                        let totalAmount = preAmount.plus(curAmount);

                        assetBalanceArray[matchedId].quantity = totalAmount.toString();
                    }
                }
                // console.log("\n\n .....assetBalanceArray: ", assetBalanceArray);

                if(!bTokenAsset){
                    let matchedIndex = undefined;
                    for (let index = 0; index < assetBalanceArray.length; index++) {
                        let assetItem = assetBalanceArray[index];
                        if ("lovelace" === assetItem.unit) {
                            matchedIndex = index;
                            break;
                        }
                    }
    
                    if (undefined === matchedIndex) {
                        let adaAmountObj = {
                            "unit": "lovelace",
                            "quantity": utxoValue.coins.toString()
                        }
                        assetBalanceArray.push(adaAmountObj);
    
                    } else {
                        let curAmount = new BigNumber(utxoValue.coins.toString());
                        let preAmount = new BigNumber(assetBalanceArray[matchedIndex].quantity);
                        let totalAmount = preAmount.plus(curAmount);
    
                        assetBalanceArray[matchedIndex].quantity = totalAmount.toString();
                    }                    
                }

            }

            console.log("\n\n .....assetBalanceArray: ", assetBalanceArray);
            return assetBalanceArray;

        } catch (e) {
            console.log("query utxo exception: ", e);
            return undefined;
        }
    }

    async getUtxosByTxInfo(txId, txIndex){
        console.log("CardanoServiceHandler...getUtxosByTxInfo...:", txId, txIndex);    

        try {
            let txInAry = new Array();
            let txInItem = {
                "txId": txId,
                "index": txIndex
            };
            txInAry.push(txInItem);
            console.log("\n\n .....getUtxosByTxInfo txInAry: ", txInAry);
    
            // TODO: to check get utxo by txId 
            // to query utxo on-chain 
            let utxoObjs = await this.queryClient.utxo(txInAry);
            console.log("\n\n .....getUtxosByTxInfo...utxoObjs: ", utxoObjs);
            
            return utxoObjs;

        } catch (e) {
            console.log("query utxos by txInfo exception: ", e);
            return undefined;
        }

    }

    async getGenesisConfiguration(){
        console.log("CardanoServiceHandler...getGenesisConfiguration...begin:");    

        try {
            // TODO: to check get utxo by txId 
            // to query utxo on-chain 
            let genesisConfig = await this.queryClient.genesisConfig(); //'alonzo'
            console.log("\n\n .....getGenesisConfiguration: ", genesisConfig);
            
            return genesisConfig;

        } catch (e) {
            console.log("query genesisConfiguration exception: ", e);
            return undefined;
        }
    }

    async getEraSummariesInfo(){
        console.log("CardanoServiceHandler...getEraSummariesInfo...begin:");    

        try {
            // TODO: to check get utxo by txId 
            // to query utxo on-chain 
            let eraSummaries = await this.queryClient.eraSummaries();
            console.log("\n\n .....get eraSummaries: ", eraSummaries);
            
            return eraSummaries;

        } catch (e) {
            console.log("query eraSummaries exception: ", e);
            return undefined;
        }
    }
    
    async getCurProtocolParams(){
        console.log("CardanoServiceHandler...getCurProtocolParams...begin:");    

        try {
            // TODO: to check get utxo by txId 
            // to query utxo on-chain 
            let protocolParams = await this.queryClient.currentProtocolParameters();
            console.log("\n\n .....get protocolParameters: ", protocolParams);
            
            return protocolParams;

        } catch (e) {
            console.log("query protocolParameters exception: ", e);
            return undefined;
        }
    }



    async evaluateTx(signedRawTx){
        try {
            // TODO: to check get utxo by txId 
            // to query utxo on-chain 
            let evaluatedRet = await this.txSubmitClient.evaluateTx(signedRawTx);
            console.log("\n\n .....evaluateTransaction ret: ", evaluatedRet);
            
            return evaluatedRet;

        } catch (e) {
            console.log("evaluate transaction exception: ", e);
            return undefined;
        }
    }

}

async function main(){

    let ogmiosObj = new OriginOgmios();
    await ogmiosObj.init();

    
    await ogmiosObj.getCurProtocolParams();
    await ogmiosObj.getEraSummariesInfo();
    await ogmiosObj.getGenesisConfiguration();

    // let strAddr = "addr_test1xqweycval58x8ryku838tjqypgjzfs3t4qjj0pwju6prgmjwsw5k2ttkze7e9zd3jr00x5nkhmpx97cv6xx25jsgxh2swlkfgp";   
    // await ogmiosObj.getBalanceByAddress(strAddr);
    let signedRawTx = "84ab008382582085c9d2997f8826716aecc6b080b3738b2370174e109a28d51c7cd30d0d2c22db00825820ae44d9011eb204eae2c310ffbbc01ff91173f069e56e9bd634d93326511e478c00825820be3aa9d5af916bbc1f11685d15c207c9624dd93b7491f60babe51b2ffbdb49f201018182583901d573c314651c8ae50fcce794198100d6d34ee6fb51d243b666ef459aa40432f8d8c527d60345d582183c2a33f51dc9558b47e4fef539c741821a00fca773a1581c25c5de5f5b286073c593edfd77b48abc7a48e5a4f3d4cd9d428ff935a14357414e1a3a699d00021a0004c371031a070413a6075820b421f6b15729c8e4d0040e338958dbc77460bdb1f47180d58a3cbd2c0682c14c09a1581c25c5de5f5b286073c593edfd77b48abc7a48e5a4f3d4cd9d428ff935a14357414e3a0098967f0b5820c4ee621e8b6886e3231be51f1d61a7c221bc9e8d3ddd5712075d0aceacd548fc0d8282582085c9d2997f8826716aecc6b080b3738b2370174e109a28d51c7cd30d0d2c22db00825820be3aa9d5af916bbc1f11685d15c207c9624dd93b7491f60babe51b2ffbdb49f2011082583901d573c314651c8ae50fcce794198100d6d34ee6fb51d243b666ef459aa40432f8d8c527d60345d582183c2a33f51dc9558b47e4fef539c7411a00e69468111a0009474a1281825820fffb1b66bd78837ea0136587c354ee6a0991b6d0a2954e48d46a476b3ce683df00a20081825820f86e30c08857030d1fcadfcb2e750c5f1f817deed4747be1a7a5fc9a5167678b5840ef5cffb0a068ceaedd98583ac3ad4166921dd5272cd85164af6a5300353e0b11b4562d9d81ac00510635f9d66acfb4c102c7493d505ba50efd215add537c6e0c0581840100d87980821a00171fe01a198a993cf5a101a56b66726f6d4163636f756e74827840616464723171383268387363357635776734656730656e6e656778767071727464786e68786c6467617973616b766d68357478347971736530336b7839796c7478277178337734736776726332336e373577756a347674676c6a30616166656361717370776a6c617765736d6749445820000000000000000000000000000000000000000000000041726965735f30333969746f4163636f756e74549d54fb4a5e5467cf3dbc904bcabd5efc38b763446b746f6b656e50616972494419020a647479706508";
    await ogmiosObj.evaluateTx(signedRawTx);

    // let txInfo = {
    //     txId: "a34322c7d3aae2c8503ec0b1fee726651a6e9a7ddba11e04f0e76bdadcb3fe42",
    //     index: 0
    // };
    // await ogmiosObj.getUtxosByTxInfo(txInfo.txId, txInfo.index);


    // let networkId = CardanoWasm.NetworkInfo.mainnet().network_id();
    // console.log("mainnet netId: ", networkId);
    // networkId = CardanoWasm.NetworkInfo.testnet().network_id();
    // console.log("testnet netId: ", networkId);
    // networkId = CardanoWasm.NetworkInfo.testnet_preview().network_id();
    // console.log("testnet_preview netId: ", networkId);

}


main();



