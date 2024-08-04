const mongoose = require('mongoose'),
Schema = mongoose.Schema;

module.exports = {
    iWanConfig:  {
        "apiKey": "53f06245671d11530873cb3a1f2dc48df8d1e5302c416998a5fee49ce065db0f", //"2c67e694b29f92076a886ddc0ce730a5e7cd63820f8123c2dbd776bc6faf9980", // 
        "secretKey": "bdf38b4811fad832786b971d761d907aba124b62fb51e9db89fa157fcd540c11", //"2c563ede4d605f171f15620f5c07ab0dc1bfa796828eea017022be0f58f0d221", // 
        "option": {
          "url": "api.wanchain.org", // "apitest.wanchain.org", // 
          "port": 8443,
          "flag": "ws",
          "version": "v3"
        },
        "dataValidLatestTs": 1800000
    },
    blockFrostConfig: {
        "apiKey": "mainnetwyQcQkHH6HTr7eylR6hWwA2Rt5R9AVEY" // "preprod2CkSg6ILU3vxDMRn2EOO6hwXtUAOceDF"  // 
    },
    web3RpcConfig: {
        // "sepolia": "https://rpc.sepolia.org",
        "WAN": "https://gwan-ssl.wandevs.org:56891" // "https://gwan-ssl.wandevs.org:46891" //  
    },
    dataValidLatestTs: 90000
}
