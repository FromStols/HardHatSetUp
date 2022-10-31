import {ethers} from "hardhat";
import dotenv from "dotenv";
import {BigNumber} from "ethers";
import hre from "hardhat";


dotenv.config({path: "~\\Documents\\Projects\\MyHardHatProj\\.env"});


//Constructor arguments
const _initSupply: number = 10_000_000;
const _cap: number = 50_000_000;
const _name: string = "FromStols";
const _symbol: string = "FST";
const _decimals: number = 18;

const _funding: BigNumber = ethers.BigNumber.from(21n * 10n ** 16n);   //0.21 ETH
console.log(ethers.utils.formatEther(_funding));



//Deploying the smart contract

async function main(): Promise<void> {

    
    const Token = await ethers.getContractFactory("StolToken");

    console.log('\n---------------------  ..... Deploying ..... --------------------------');

    const token = await Token.deploy(_initSupply, _cap, _name, _symbol, _decimals, {value: _funding});
    await token.deployed();  // ensure that our contract is properly deployed 

    console.log(`\nFST Token Smart Contract deployed at addresss --> ${token.address}`);
    
    
    if (hre.network.name != "hardhat"){

        // Wait for 5 confirmation blocks to ensure deployment before verifying
        // & also let EtherScan sync/ catch up to the block that includes our deployment Tx
        await token.deployTransaction.wait(5); 

        //Built in script 'verify' to get our Smart Contract verified in Etherscan
        await hre.run("verify:verify", {
            address: token.address,
            constructorArguments: [_initSupply, _cap, _name, _symbol, _decimals],
        });
    }
    
};




main().then( () => {process.exit(0);}).catch( (err) => {
    console.error(err);
    process.exit(1);
});

