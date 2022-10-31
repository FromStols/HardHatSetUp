import {ethers} from "hardhat";
import dotenv from "dotenv";
import {BigNumber} from "ethers";

dotenv.config({path: "~\\Documents\\Projects\\MyHardHatProj\\.env"});



//Constructor arguments
const _initSupply: number = 10_000_000;
const _cap: number = 50_000_000;
const _name: string = "FromStols";
const _symbol: string = "FST";
const _decimals: number = 18;

const _funding: number = 100;


//Deploying the smart contract in the Hardhat test network

async function main(): Promise<void> {

    const [deployer, _] = await ethers.getSigners();
    const balance: BigNumber = await deployer.getBalance();

    console.log(`\n\nDeploying Smart Contract from the deployer account --> ${deployer.address}`);
    console.log(`\nBalance of deployer account (before deployment) --> ${ethers.utils.formatEther(balance.toString())} ETH`);
    
    console.log('\n---------------------  ..... Deploying ..... --------------------------');
    
    const Token = await ethers.getContractFactory("StolToken", deployer);
    const token = await Token.deploy(_initSupply, _cap, _name, _symbol, _decimals, {value: ethers.utils.parseEther(_funding.toString())});

    const balanceAfterDeployment: BigNumber = await deployer.getBalance();

    console.log(`\nSmart Contract deployed at addresss --> ${token.address}`);
    console.log(`\nBalance of deployer account (after deployment) --> ${ethers.utils.formatEther(balanceAfterDeployment)} ETH`);

};




main()
.then( () => {
    process.exit(0);
})
.catch( (err) => {
    console.error(err);
    process.exit(1);
});