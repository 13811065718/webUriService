const iWanClient = require('iwan-sdk');

class IWanInstance {

	constructor(apiKey, secretKey){
		//let apiClient = new iWanClient(YourApiKey, YourSecretKey);

		//Subject to https://iwan.wanchain.org
		let option = {
		    url:"apitest.wanchain.org", // for mainnet use --> api.wanchain.org
		    port:8443,
		    flag:"ws",
		    version:"v3",
		    timeout:300000
		};
		this.apiClient = new iWanClient(apiKey, secretKey, option);	
	}
	
	async retrieveTokenPairs(){

		let options = this.bMainnet ? {tags: ["bridge", "bridgeBeta"]} : {isAllTokenPairs: true}
		console.log("options: ", options);
	
		try {
		  let tokenPairs = await this.apiClient.getTokenPairs(options);//getTokenPairs();
		  console.log("tokenPairs info: ", tokenPairs);
		  
		} catch (err) {
		  console.log(err);
		}
	}
	
	async retrieveTokenPairById(id){
	
		try {
		  let tokenPairs = await this.apiClient.getTokenPairInfo(id);//getTokenPairs();
		  console.log("tokenPairs info: ", tokenPairs);


		//   let ancestorInfo = await this.apiClient.getTokenPairAncestorInfo(id);
		//   console.log("ancestor info: ", ancestorInfo);

		  return tokenPairs;
		  
		} catch (err) {
		  console.log(err);
		}
	}	
	
	async retrieveChainInfo(chainID){
		let reqOption = {
			"chainId": chainID
		}
	
		try {
		  let chainConstantInfo = await this.apiClient.getChainConstantInfo(reqOption);
		//   getSupportedChainInfo();//getTokenPairs();
		  console.log("chain constant info: ", chainConstantInfo);

		  return chainConstantInfo;
		  
		} catch (err) {
		  console.log(err);
		}
	}

	async retrieveSupportedChainInfo(){
	
		try {
			let supportedChainInfoArys = await this.apiClient.getSupportedChainInfo();
			console.log("supported ChainI nfo: ", supportedChainInfoArys);

			for(let i=0; i<supportedChainInfoArys.length; i++){
				let tmpChainID = supportedChainInfoArys[i].chainID;
				let tmpChainSymbol = supportedChainInfoArys[i].chainSymbol;

				let chainAddressPrex = "0x";
				let crossScAddr = supportedChainInfoArys[i].crossScAddr;
				let multicallAddr = supportedChainInfoArys[i].multicallAddr;
				if((undefined === multicallAddr) || (undefined === crossScAddr)){
					chainAddressPrex = "";
					console.log("chain ", tmpChainSymbol, "is not evm chain type, address is not takes 0x prefix");
				}else{
					let prexIndex = multicallAddr.indexOf("0x");
					if(-1 === prexIndex){
						chainAddressPrex = "";
						console.log("chain ", tmpChainSymbol, "is not evm chain type, address is not takes 0x prefix");
					}
				}
			}

		  	return supportedChainInfoArys;
		  
		} catch (err) {
		  console.log(err);
		}
	}


}


async function main(){
	let apiKey = "47f0102e75a41dccd836c849b0d16291e33522358ab8ba146cb17709161614b1";
	let secretKey = "b803eed271c927719a72e9e729bb016c8de2770896abbc84278549a2385c0572";



	let currentTs = Date.now();
	console.log("\n\n...currentTs: ", currentTs);
	
	let iWanObj = new IWanInstance(apiKey, secretKey);


	let tokenPairId = 726;
	let ret = await iWanObj.retrieveTokenPairById(tokenPairId);	

	// let toChainID = ret.toChainID;
	// await iWanObj.retrieveChainInfo(toChainID);

	// let fromChainID = ret.fromChainID;
	// await iWanObj.retrieveChainInfo(fromChainID);

	// await iWanObj.retrieveSupportedChainInfo();

}


main();
