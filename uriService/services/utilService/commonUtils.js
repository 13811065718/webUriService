
const CardanoWasm = require('@emurgo/cardano-serialization-lib-nodejs');
const abiDecoder = require('abi-decoder');


function encodeUtxo(utxoObj){
	let txInData = utxoObj.txIn;
	let txOutData = utxoObj.txOut;

	let transaction_id = CardanoWasm.TransactionHash.from_bytes(Buffer.from(txInData.txId, 'hex'));
	let txInput = CardanoWasm.TransactionInput.new(transaction_id, txInData.index);
	let address = CardanoWasm.Address.from_bech32(txOutData.address);

	let bnQuatity = CardanoWasm.BigNum.from_str(this.number2String(txOutData.value[0].quantity));
	let amount = CardanoWasm.Value.new(bnQuatity);
	if (1 < txOutData.value.length) {
		let multiAssetObj = CardanoWasm.MultiAsset.new();
		for (let i = 1; i < txOutData.value.length; i++) {

			let strScriptHash = txOutData.value[i].unit.slice(0, 56);
			let strName = txOutData.value[i].unit.slice(56);

			let tokenAsset = this.buildTokenAsset(strName, txOutData.value[i].quantity);
			let tokenSriptHash = CardanoWasm.ScriptHash.from_bytes(Buffer.from(strScriptHash, "hex"));
			multiAssetObj.insert(tokenSriptHash, tokenAsset);
		}
		amount.set_multiasset(multiAssetObj);
	}

	let txOutput = CardanoWasm.TransactionOutput.new(address, amount);
	let strUtxoId = CardanoWasm.TransactionUnspentOutput.new(txInput, txOutput).to_bytes().toString();

	return strUtxoId;
}

function parseMetadata(metadata) {
	// we must check the type first to know how to handle it
	for(let key in metadata ){

		if("map" === key){
			const mapRet = {};
			const mapData = metadata[key];
			for (let i=0; i<mapData.length; i++) {
				let mapItem = mapData[i];
				const key = parseMetadata(mapItem["k"]);
				const value = parseMetadata(mapItem["v"]);
				// console.log("parseMetadata map: ", key, value); 
				mapRet[key]= value;
			}
			return mapRet;
		}else if("list" === key){
			let arrRet = [];
			const arr = metadata[key];
			for (var i = 0; i < arr.length; i++) {
				const elem = parseMetadata(arr[i]);
				arrRet.push(elem);
			}
			// console.log("parseMetadata list: ", arrRet); 
			return arrRet;
		}else if("int" === key){
			let strValue = metadata[key];
			if(0 > parseInt(metadata[key])){
				if (typeof strValue !== 'String') {
					strValue = metadata[key].toString();
				} 
				return strValue;
			} 
			
			if (typeof strValue !== 'String') {
				strValue = metadata[key].toString();
			} 
			let bigValue = CardanoWasm.BigNum.from_str(strValue);
			// console.log("parseMetadata int: ", bigValue.to_str()); 
			return bigValue.to_str();
			
		}else if("bytes" === key){
			return metadata[key];
		}else if("string" === key){
			// console.log("parseMetadata text: ",metadata[key]); 
			let invalidString = "\u0000";
			if(-1 !== metadata[key].indexOf(invalidString)){
				let subStr = metadata[key].replace(invalidString, "");
				console.log("decodeMetadata2Json replaced text: ", subStr);

				return subStr;
			}			
			return metadata[key];
		}
	}	
}

function sleep(time) {
	return new Promise(function(resolve, reject) {
		setTimeout(function() {
			resolve();
		}, time);
	})
}

// "cardanoNFTMetadata": {
//     "name": "nutcoin",
//     "description": "The Nut Coin",
//     "ticker": "nutc",
//     "url": "https://www.stakenuts.com/",
//     "logo": "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",
//     "decimals": 6
// }
function convMeta2EvmFormat(cardanoNFTMetadata) {

	for(let key in cardanoNFTMetadata){
		let itemMeta = cardanoNFTMetadata[key];
		let evmFormatMetaData = {
			"name": itemMeta.name,
			"description": itemMeta.description, 
			"url": itemMeta.url, 
			"image": itemMeta.logo
		}
		// console.log("\n update key: ", key, evmFormatMetaData);

		cardanoNFTMetadata[key] = evmFormatMetaData;
	}	

	console.log("\n cardanoNFTMetadata: ", cardanoNFTMetadata);
	return cardanoNFTMetadata;
}

function convMeta2CardanoFormat(evmNFTMetaData) {

	for(let key in evmNFTMetaData){
		let itemMeta = evmNFTMetaData[key];
		let cardanoFormatMetaData = {
			"name": itemMeta.name,
			"description": itemMeta.description, 
			"url": itemMeta.tokenURI,
			"logo": itemMeta.image, 
		}
		
		evmNFTMetaData[key] = cardanoFormatMetaData;
	}	

	console.log("\n evmNFTMetaData: ", evmNFTMetaData);	
	return evmNFTMetaData;
}

exports.sleep = sleep;

exports.parseMetadata = parseMetadata;

exports.encodeUtxo = encodeUtxo;

exports.convMeta2EvmFormat = convMeta2EvmFormat;

exports.convMeta2CardanoFormat = convMeta2CardanoFormat;

// module.exports = UtilTools;

