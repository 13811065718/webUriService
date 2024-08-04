

class NFTHelper {

  constructor(){

  }

  async init(){

  }

  async retrieveNFTDataByURL(ipfsURL){

    const ipfsReq = new Request(ipfsURL);
    const ipfsResp = await fetch(ipfsReq);
    const ipfsMetaData = await ipfsResp.json();

    // const ipfsResp = await this.fetch(ipfsURL);
    // const ipfsMetaData = await ipfsResp.test();
    

    console.log("\n\n...retrieveNFTDataByURL: ", ipfsMetaData);
  }





}


async function testRetrieveNFTMetaData(){
  let nftHelperInst = new NFTHelper();

  let nftUrl = "https://openzoo.mypinata.cloud/ipfs/QmVdmiper8PXR8h8pzbzDbkmWTUnXGtanDZc74tjfQGE5X";
  
  await nftHelperInst.retrieveNFTDataByURL(nftUrl); 
    
}


testRetrieveNFTMetaData();



