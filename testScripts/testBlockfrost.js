

const fs = require('fs');
const cbor = require('cbor');
const BlockFrostAPI = require('@blockfrost/blockfrost-js').BlockFrostAPI;


class BlockFrostSDK{

  constructor(){

    this.blockFrostApi =  new BlockFrostAPI({projectId:'preprod2CkSg6ILU3vxDMRn2EOO6hwXtUAOceDF'});

    this.scanSteps = 10; // should record in config file
    this.retryTimeInterval = 60*1000;
  }



  async queryAgentUtxos(){
     
    // to query utxo of agent's account
    this.agentAddress = "addr_test1qq0rlnqmmmrl4wzy35nt0pzsuu88h78swk4wnjrpzy8yk62mqlt3z2733rdlarwrd0l9sgx5t99qgsejv52qrzwmm8hqfvmgam";
    let agentUtxos = await this.blockFrostApi.addressesUtxos(this.agentAddress);
    // this.chainTxHandler.syncUtxoRecord(agentUtxos);

    console.log("\n\n...queryAgentUtxos: ", agentUtxos);
    return;
  }

  async queryTx(){
    let txInfo = undefined;

    try{
      txInfo = await this.blockFrostApi.txs("35722906cb8b07aea66afa2e1478984c210a0ae0058cec2dbb97eb39128f56ae");
      console.log("\n\n...txInfo: ", txInfo);

    }catch(e){
      console.log("\n\n...get txInfo error: ", e);
    }

    console.log("\n\n...queryTx: ", txInfo);
    return txInfo;
  }
}


let blockFrostObj = new BlockFrostSDK();

blockFrostObj.queryTx();

