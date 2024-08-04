const axios = require('axios');

let testPath = "getNftMetaData";
let apiServer = "http://127.0.0.1:4337";
let reqUrl = `${apiServer}/${testPath}`

if ("getNftMetaData" === testPath) {
    let tokenIds = new Array();
    let data = {};
    let bEvmNft = true;

    if (bEvmNft) {
        tokenIds.push("0x0000000000000000000000000000000000000000000000000000000000000001");
        tokenIds.push("0x0000000000000000000000000000000000000000000000000000000000000002");
        tokenIds.push("0x0000000000000000000000000000000000000000000000000000000000000003");
        data = {
            "ancestorChain": "2153201998",  //WAN
            "targetChainType": "2147485463", //ADA
            "contractId": "0x992e4447f470ea47819d677b84d2459677bfdadf",
            "tokenIds": tokenIds
        };

    } else {
        tokenIds.push("6e7574636f696e");
        data = {
            "ancestorChain": "2147485463",  //ADA
            "targetChainType": "2153201998", //WAN
            "contractId": "00000002df633853f6a47465c9496721d2d5b1291b8398016c0e87ae",
            "tokenIds": tokenIds
        };
    }

    axios.post(reqUrl, data)
        .then((res) => {
            console.log('Body: ', res.data);
        }).catch((err) => {
            console.error(err);
        });
}