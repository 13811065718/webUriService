const Web3Lib = require("web3");
const Web3Utils = require("web3-utils");

// import Web3 from 'web3';
// set a provider in the sepolia testnet using node rpc url
const {
    sleep, 
    convMeta2CardanoFormat
} = require("../urlService/services/utilService/commonUtils");

const Erc1155ABI = require("../config/abi/erc1155.json");
const Erc721ABI = require("../config/abi/erc721.json");
const { slice } = require("lodash");

const web3Config = {
  "RPC": "https://gwan-ssl.wandevs.org:46891", // wanchain testnet rpc
  "NFTHelplerAddress": "0xd7049766f83c614e07c8fa2ad0b35a9ed8abf61d"
}


class Web3Instance {

  constructor(config){

    this.web3 = new Web3Lib.Web3(config.RPC);
    // let web3 = new Web3Moudle(config.RPC);

    this.mapNftAbiMgr = new Map();
    this.mapNftAbiMgr.set("Erc721", Erc721ABI);
    this.mapNftAbiMgr.set("Erc1155", Erc1155ABI);    
  }

  async retrieveNFTUrl(tokenType, tokenAddr, tokenId){

    let jsonScAbi = this.mapNftAbiMgr.get(tokenType);

    let scInst = new this.web3.eth.Contract(jsonScAbi, tokenAddr);

    let nftUrl = await scInst.methods.tokenURI(tokenId).call();
    console.log('retrieveNFTMetaData...nftUrl: ', nftUrl);
  }

  fetchSectionDataByRouteUrl(routeUrl){
    // router url: /{ancestor chain}/{target chain type}/{contract id}/{token id}
    let arySections = new Array();

    let sliceIndex = 0;
    do{
      let curUrl = routeUrl.slice(sliceIndex+1);

      let curIndex = curUrl.indexOf("/");
      if(-1 === curIndex){
        if("" !== curUrl){
          arySections.push(curUrl);
        }
        break;
      }

      let section = curUrl.slice(0, curIndex);
      console.log("sliced section: ", section);
      arySections.push(section);

      sliceIndex = curIndex;
      routeUrl = curUrl;
      // console.log("routeUrl: ", routeUrl);

    }while(true);

    console.log("fetchSectionDataByRouteUrl: ", arySections);
  }


}


async function testRetrieveNFTUrl(){
  let web3Inst = new Web3Instance(web3Config);

  let tokenAddr = "0x35b0b5c350b62ddee9be102b7567c4dabe52cf4f";
  let tokenId = "0x0000000000000000000000000000000000000000000000000000000000000003";

  // await web3Inst.retrieveNFTUrl("Erc721", tokenAddr, tokenId);

  let routeUrl = "/Ada/Wan/0x35b0b5c350b62ddee9be102b7567c4dabe52cf4f/0x1200000000000000000000000000000000000000000000000000000000000034"
  web3Inst.fetchSectionDataByRouteUrl(routeUrl);
}


testRetrieveNFTUrl();



