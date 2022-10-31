import {HardhatUserConfig, task} from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-gas-reporter";
import dotenv from "dotenv";
//import { ethers } from "hardhat";

dotenv.config({path: '~\\Documents\\Projects\\MyHardHatProj\\.env' });

const INFURA_API_KEY = process.env.INFURA_API_KEY;
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY;
const GOERLI_RPC_URL = process.env.GOERLI_RPC_URL;
const EOA_PRIVATE_KEY = process.env.ACCOUNT1_PRIVATE_KEY
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY


// Hardhat Configuration Object

const config: HardhatUserConfig = {
  solidity: "0.8.16",

  networks: {
    hardhat: {},
    goerli: {
      url: `${GOERLI_RPC_URL}`,
      accounts: [`0x${EOA_PRIVATE_KEY}`],
    }
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },

  gasReporter: {
    enabled: true ,
    currency: "EUR",
    coinmarketcap: COINMARKETCAP_API_KEY,
  },
};




/*
//Expiriment here with some trivial custom task... 
task("sampleTask", "Testing stuff")
.addParam("val1", "Some random input parameter")
.setAction( async (args, hre) => {
  console.log(args.val1);
  console.log( await hre.ethers.provider.getBlockNumber());
});
*/

export default config;   //With default export we can have ONLY one (1) object exported per source file
                        