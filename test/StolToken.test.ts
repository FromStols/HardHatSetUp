import "mocha";
import { expect } from "chai";
import { ethers } from "hardhat";
import { StolToken__factory } from "../typechain-types";
import {BigNumber, Signer, Contract} from "ethers";
//import {SignerWithAddress} from "@nomicfoundation/hardhat-toolbox";



describe("Testing StolToken Contract", function () {
    let Token: StolToken__factory;
    // Should declare as type Contract? (but i dont get auto-completion that way...)
    let token: any;
    //Shoud declare them as type Signer 
    let owner: any;
    let addr1: any;
    let addr2: any;

    //Constructor arguments
    let _initialSupply = 10_000_000;
    let _capedSupply = 50_000_000;
    let _decimals = 18;

    this.beforeEach(async function () {
        [owner, addr1, addr2, ] = await ethers.getSigners();
        Token = await ethers.getContractFactory("StolToken", owner);
        token = await Token.deploy(_initialSupply, _capedSupply, "FromStols", "FST", _decimals, {value: ethers.utils.parseEther("100")});
    })

    describe("Testing Deployment/Constructor", function () {

        it("Should Set the right owner", async function () {
            expect(await token.owner()).to.equal(owner.address);
        });

        it("Should set the totalSupply of Tokens", async function () {
            let totSup: BigNumber = await token.totalSupply();
            expect(totSup).to.equal(ethers.utils.parseEther(_initialSupply.toString()));
            expect(ethers.utils.formatEther(totSup)).to.equal(_initialSupply + ".0");
        });

        it("Should set the Supply Cap of Tokens", async function () {
            let cap: BigNumber = await token.supplyCap();
            expect(cap).to.equal(ethers.utils.parseEther(_capedSupply.toString()));
            expect(ethers.utils.formatEther(cap)).to.equal(_capedSupply + ".0");
        });

        it("Should set the isPaused variable", async function () {
            expect(await token.isPaused()).to.equal(false);
        });

        it("Should set the right amount of decimals", async function () {
            expect(await token.decimals()).to.equal(18);
            expect(await token.decimals()).to.equal(_decimals);
        });

        it("Should set the name of the Token", async function () {
            expect(await token.name()).to.equal("FromStols");
        });

        it("Should set the symbol of the Token", async function () {
            expect(await token.symbol()).to.equal("FST");
        });

        it("Owner should possesses all Tokens", async function () {
            let totalSup: Promise<BigNumber> = await token.totalSupply();
            let ownerBal: BigNumber = await token.balanceOf(owner.address);
            expect(await token.balanceOf(owner.address)).to.equal(totalSup);
            expect(ownerBal).to.equal(ethers.utils.parseEther(_initialSupply.toString()))
        });
    })

    describe("Testing Simple Transactions #(transfer)", function () {

        it("Should NOT modify/alter the totalSupply of Tokens", async function () {
            let amount: bigint = 100n * 10n**18n;
            let initialTotalSup: BigNumber = await token.totalSupply();
            
            await token.transfer(addr1.address, amount);
            expect(await token.totalSupply()).to.equal(initialTotalSup);
        });

        it("Should NOT modify/alter the Caped Supply of Tokens", async function () {
            let amount: bigint = 500n * 10n ** 18n ;
            let initialCap: BigNumber = await token.supplyCap();
            
            await token.transfer(addr1.address, amount);
            expect(await token.supplyCap()).to.equal(initialCap);
        });

        it("Should Transfer Tokens between accounts & update balances", async function () {
            let amount: bigint = 300n * 10n ** 18n;
            let initialBalance: BigNumber = await token.balanceOf(owner.address);

            await token.transfer(addr1.address, amount);
            expect(await token.balanceOf(addr1.address)).to.equal(amount);
            expect(await token.balanceOf(owner.address)).to.equal(initialBalance.toBigInt() - amount)

            await token.connect(addr1).transfer(addr2.address, amount);
            expect(await token.balanceOf(addr2.address)).to.equal(amount);
            expect(await token.balanceOf(addr1.address)).to.equal(0);
        });

        it("Should Transfer fractions of tokens", async function () {
            let amount: BigNumber = ethers.BigNumber.from(15n * 10n ** 17n);    //1.5 * 10 ** 18
            token.transfer(addr1.address, amount);
            let balance: BigNumber = await token.balanceOf(addr1.address);
            expect(ethers.utils.formatEther(balance)).to.equal('1.5');
        });
        
        it("Should Revert when sender does not own tokens", async function () {
            let amount: number = 1;
            await expect(token.connect(addr1).transfer(addr2.address, amount)).to.be.revertedWith("Not enough tokens");
        });

        it("Should Revert when sender does not have enough tokens", async function () {
            let amount: number = 5;
            await token.transfer(addr1.address, amount);
            await expect(token.connect(addr1).transfer(addr2.address, amount+1)).to.be.revertedWith("Not enough tokens");
        });

        it("Should Revert if receiver is the zero address", async function () {
            let zeroAddr = ethers.constants.AddressZero;
            await expect(token.transfer(zeroAddr, 1)).to.be.revertedWith("Zero address is invalid");
        });

        it("Should emit the Transfer event", async function () {
            let amount: number = 5;
            await expect(await token.transfer(addr1.address, amount)).to.emit(token, "Transfer");
        });

        it("Should emit the Transfer event by passing correct input args", async function () {
            let amount: bigint = 369n * 10n ** 18n;
            await expect(
                await token.transfer(addr2.address, amount)
                ).to.emit(token, "Transfer").withArgs(owner.address, addr2.address, amount);
        });
    })

    describe("Testing allowances #(approve)", function () {

        it("Should Revert if Zero address is selected as delegatee/spender", async function () {
            let zeroAddr = ethers.constants.AddressZero;
            await expect(token.approve(zeroAddr, 100)).to.be.revertedWith("Cannot approve Zero address");
        });

        it("Should Revert if delegator delegates himself", async function () {
            await expect(token.approve(owner.address, 7)).to.be.revertedWith("Self delegation is disallowed");
        });

        it("Should Revert if delegator does not own tokens", async function () {
            await expect(token.connect(addr1).approve(addr2.address, 1)).to.be.revertedWith("Not enough tokens");
        });

        it("Should Revert if delegator does not have enough tokens", async function () {
            let totalSup: BigNumber = await token.totalSupply();
            await expect(token.approve(addr2.address, totalSup.toBigInt() + BigInt(1))).to.be.revertedWith("Not enough tokens");
        });

        it("Should NOT modify/alter the total supply of tokens", async function () {
            let initialTotalSup: BigNumber = await token.totalSupply();
            let amount: number = 10;
            await token.approve(addr1.address, amount);
            expect(await token.totalSupply()).to.equal(initialTotalSup);
            expect(initialTotalSup).to.equal(ethers.utils.parseEther(_initialSupply.toString()));
        });

        it("Should NOT modify/alter the capped token amount", async function () {
            let initialCap: BigNumber = await token.supplyCap();
            let amount: number = 10;
            await token.approve(addr1.address, amount);
            expect(await token.supplyCap()).to.equal(initialCap);
            expect(initialCap).to.equal(ethers.utils.parseEther(_capedSupply.toString()));
        });

        it("Should delegate the right amount of tokens", async function () {
            let amount: number = 666;
            await token.approve(addr1.address, amount);
            expect(await token.allowance(owner.address, addr1.address)).to.equal(amount);
        });

        it("Should be able to delegate all tokens to spender", async function () {
            let amount: number = 365;
            await token.transfer(addr1.address, amount);
            expect(await token.balanceOf(addr1.address)).to.equal(amount);
            expect(await token.connect(addr1).approve(addr2.address, amount)).to.not.be.reverted;
            expect(await token.allowance(addr1.address, addr2.address)).to.equal(amount);
        });

        it("Should emit the Approval event", async function () {
            let amount: number = 333;
            await expect(await token.approve(addr2.address, amount)).to.emit(token, "Approval");
        });

        it("Should emit Approval event by passing the right input args", async function () {
            let amount: number = 101;
            await token.transfer(addr1.address, amount);
            await expect(
                await token.connect(addr1).approve(addr2.address, amount - 1))
                .to.emit(token, "Approval").withArgs(addr1.address, addr2.address, amount-1);
        });
    })

    describe("Testing Delegated Transactions #(transferFrom)", function() {

        it("Should Revert if spender is not delegated", async function () {
            let amount: number = 77;
            expect(await token.allowance(owner.address, addr1.address)).to.equal(0);
            await expect(
                token.connect(addr1).transferFrom(owner.address, addr2.address, amount))
                .to.be.revertedWith("Not enough allowance");
        });

        it("Should Revert if receiver is the zero address", async function () {
            let amount: number = 36;
            let zeroAddr = ethers.constants.AddressZero;
            await token.approve(addr1.address, amount);

            expect(await token.allowance(owner.address, addr1.address)).to.equal(amount);
            await expect(
                token.connect(addr1).transferFrom(owner.address, zeroAddr, amount))
                .to.be.revertedWith("Invalid zero address");
        });

        it("Should Revert if approved amount is less than transferred amount", async function () {
            let amount: number = 66;
            await token.approve(addr1.address, amount);

            expect(await token.allowance(owner.address, addr1.address)).to.equal(amount);
            await expect(
                token.connect(addr1).transferFrom(owner.address, addr2.address, amount+1))
                .to.be.revertedWith("Not enough allowance");
        });

        it("Should Revert if owner has less balance than transferred amount", async function () {
            let amount: number = 10;

            await token.transfer(addr1.address, amount);
            expect(await token.balanceOf(addr1.address)).to.equal(amount);

            await token.connect(addr1).approve(addr2.address, amount);
            expect(await token.allowance(addr1.address, addr2.address)).to.equal(amount);

            await token.connect(addr1).transfer(owner.address, amount-5);
            expect(await token.balanceOf(addr1.address)).to.equal(amount-5);

            await expect(
                token.connect(addr2).transferFrom(addr1.address, owner.address, amount-4))
                .to.be.revertedWith("Insufficient token balance");
        });

        it("Should transfer tokens & update balances & allowances", async function () {
            let amount: bigint = 45n * 10n ** 18n;
            let totalSup: BigNumber = await token.totalSupply();
            await token.transfer(addr1.address, amount);
            expect(await token.balanceOf(addr1.address)).to.equal(amount);
            expect(await token.balanceOf(owner.address)).to.equal(totalSup.toBigInt() - amount);

            await token.connect(addr1).approve(addr2.address, amount-10n);
            expect(await token.allowance(addr1.address, addr2.address)).to.equal(amount-10n);

            await token.connect(addr2).transferFrom(addr1.address, owner.address, amount-15n);
            expect(await token.allowance(addr1.address, addr2.address)).to.equal(5n);
            expect (await token.balanceOf(addr1.address)).to.equal(amount - (amount-15n));
            expect(await token.balanceOf(owner.address)).to.equal(totalSup.toBigInt() - amount + (amount -15n));
        });

        it("Spender should be able to transfer allowance to himself", async function () {
            let amount: number = 10;
            await token.transfer(addr1.address, amount);
            expect(await token.balanceOf(addr1.address)).to.equal(amount);

            await token.connect(addr1).approve(addr2.address, amount);
            expect(await token.balanceOf(addr2.address)).to.equal(0);
            expect(await token.allowance(addr1.address, addr2.address)).to.equal(amount);

            await token.connect(addr2).transferFrom(addr1.address, addr2.address, amount);
            expect(await token.allowance(addr1.address, addr2.address)).to.equal(0);
            expect(await token.balanceOf(addr1.address)).to.equal(0);
            expect(await token.balanceOf(addr2.address)).to.equal(amount);
        });

        it("Spender should be able to transfer allowance to Owner without increasing Owner's balance", async function () {
            let amount: bigint = 60n * 10n ** 18n;
            let initialBal: BigNumber = await token.balanceOf(owner.address)
            await token.approve(addr1.address, amount);
            expect(await token.allowance(owner.address, addr1.address)).to.equal(amount);
            expect(await token.balanceOf(owner.address)).to.equal(initialBal);
            expect(await token.balanceOf(addr1.address)).to.equal(0);

            await token.connect(addr1).transferFrom(owner.address, owner.address, amount-10n);
            expect(await token.allowance(owner.address, addr1.address)).to.equal(amount - (amount-10n));
            expect(await token.balanceOf(owner.address)).to.equal(initialBal);
        });

        it("Should not modify/alter the Total Supply of tokens", async function () {
            let initialTotalSup: BigNumber = await token.totalSupply();
            let amount: number = 999;

            await token.approve(addr1.address, amount);
            expect(await token.totalSupply()).to.equal(initialTotalSup);

            await token.connect(addr1).transferFrom(owner.address, addr2.address, amount);
            expect(await token.totalSupply()).to.equal(initialTotalSup);
        });

        it("Should not modify/alter the capped amount of tokens", async function () {
            let initialCap: BigNumber = await token.supplyCap();
            let amount: number = 666;

            await token.approve(addr1.address, amount);
            expect(await token.supplyCap()).to.equal(initialCap);

            await token.connect(addr1).transferFrom(owner.address, addr2.address, amount);
            expect(await token.supplyCap()).to.equal(initialCap);
        });

        it("Should emit the Transfer event", async function () {
            let amount: number = 10;
            await token.approve(addr2.address, amount);
            await expect(await token.connect(addr2).transferFrom(owner.address, addr1.address, amount))
                        .to.emit(token, "Transfer");
        });

        it("Should emit the Transfer event with correct input args", async function () {
            let amount: number = 10;
            await token.approve(addr2.address, amount);
            await expect(await token.connect(addr2).transferFrom(owner.address, addr1.address, amount))
                        .to.emit(token, "Transfer").withArgs(owner.address, addr1.address, amount);
        });
    })

    describe("Testing Token Minting #(mint)", function () {

        it("Should Revert if caller/minter is not the owner", async function () {
            await expect(token.connect(addr1).mint(0)).to.be.revertedWith("Only Owner");
            await expect(token.connect(addr2).mint(1)).to.be.revertedWith("Only Owner");
            await expect(token.connect(addr2).mint(100n * 10n ** 18n)).to.be.revertedWith("Only Owner");
        });

        it("Should Revert if owner mints more than capped supply amount", async function () {
            let supCap: BigNumber = await token.supplyCap();
            expect(supCap).to.equal(ethers.utils.parseEther(_capedSupply.toString()));
            await expect(token.mint(supCap.toBigInt() + 1n)).to.be.revertedWith("Exceeds supply cap");
        });

        it("Should Revert if minted amount & current total supply > Capped Supply", async function () {
            let initialTotalSup: BigNumber = await token.totalSupply();
            let cappedSup: BigNumber = await token.supplyCap();
            let maxAmountRange: bigint = cappedSup.toBigInt() - initialTotalSup.toBigInt();
          
            await expect(token.mint(maxAmountRange + 1n)).to.be.revertedWith("Exceeds supply cap");
        });

        it("Should Not modify/alter the capped supply state variable", async function () {
            let amount: number = 34214;
            let initialCap: BigNumber = await token.supplyCap();
            await token.mint(amount);
            let finalCap: BigNumber = await token.supplyCap();
            expect(initialCap).to.equal(finalCap);
        });

        it("Should increase total supply by the minted amount v.1", async function () {
            await token.mint(100);
            expect(await token.totalSupply()).to.equal(ethers.utils.parseEther(_initialSupply.toString()).toBigInt() + 100n);
        });

        it("Should increase total supply by the minted amount v.2", async function () {
            let amount: bigint = 8760n
            let currentTotalSup: BigNumber = await token.totalSupply();
            await token.mint(amount);
            expect(await token.totalSupply()).to.equal(currentTotalSup.toBigInt() + amount);
        });

        it("Should increase total supply by the minted amount v.3", async function () {
            let amount: BigNumber = ethers.BigNumber.from(4510n * 10n ** 18n)
            const initSup: BigNumber = await token.totalSupply();
            await token.mint(amount);
            const finalSup: BigNumber = await token.totalSupply();
            expect(finalSup.toBigInt() - initSup.toBigInt()).to.equal(amount.toBigInt());
        });

         it("Should increase total supply by the minted amount v.4", async function () {
            let initSup: BigNumber  = await token.totalSupply();
            let amount: bigint = 39745n;
            await token.mint(amount);
            let expectedFinalSup: BigNumber = await token.totalSupply();
            expect(expectedFinalSup.toBigInt()).to.equal(initSup.toBigInt() + amount);
        });

        it("Should Transfer All minted tokens to Owner", async function () {
            let amount: bigint = 876510n * 10n ** 18n;
            let initBal: BigNumber = await token.balanceOf(owner.address);
            await token.mint(amount);
            let finalBal: BigNumber = await token.balanceOf(owner.address);
            expect(finalBal.toBigInt()).to.equal(initBal.toBigInt() + amount);
        });

        it("Should emit the Transfer event", async function () {
            await expect(await token.mint(369)).to.emit(token, "Transfer");
        })

        it("Should emit the Transfer event by passing the correct input args", async function () {
            let amount: number = 10555;
            let zeroAddr = ethers.constants.AddressZero;
            await expect(await token.mint(amount)).to.emit(token, "Transfer").withArgs(zeroAddr, owner.address, amount);
        });
    })


    describe("Testing Token Burning #(burn)", function () {

        it("Should Revert when EOA does not hold tokens", async function () {
            let bal: BigNumber = await token.balanceOf(addr1.address);
            expect(bal).to.equal(0);
            let amount: number = 1;
            await expect(token.connect(addr1).burn(amount)).to.be.revertedWith("Token amount exceeds balance");
        });

        it("Should Revert when EOA requests to burn more than its balance", async function () {
            let bal: BigNumber = await token.balanceOf(owner.address);
            expect(bal).to.not.equal(0);
            await expect(token.burn(bal.toBigInt() + 1n)).to.be.revertedWith("Token amount exceeds balance");
        });

        it("Should be able to burn tokens", async function () {
            let bal: BigNumber = await token.balanceOf(owner.address);
            let amount: number = 324;
            expect(bal).to.not.equal(0);
            expect(bal).to.be.at.least(amount);
            await expect(token.burn(amount)).to.not.be.reverted;
        });

        it("Should decrease balance by the burnt token amount v.1", async function () {
            let initBal: BigNumber = await token.balanceOf(owner.address);
            let amount: bigint = 600n;
            await token.burn(amount)
            let finalBal: BigNumber = await token.balanceOf(owner.address);

            expect(finalBal).to.equal(initBal.toBigInt() - amount);
        });

        it("Should decrease balance by the burnt token amount v.2", async function () {
            let amount: bigint = 300n;
            await token.transfer(addr1.address, amount);
            let initBal: BigNumber = await token.balanceOf(addr1.address);
            expect(initBal).to.equal(amount);

            await token.connect(addr1).burn(amount - 100n);
            let finalBal: BigNumber = await token.balanceOf(addr1.address);
            expect(finalBal.toBigInt()).to.equal(100n);
        });

        it("Should decrease Total Supply by the burnt token amount", async function () {
            let initTotalSup: BigNumber = await token.totalSupply();
            let amount: bigint = 945n * 10n ** 18n;
            await token.burn(amount);
            let finalTotalSup: BigNumber = await  token.totalSupply();

            expect(finalTotalSup).to.equal(initTotalSup.toBigInt() - amount);
        });

        it("Should emit the Transfer event", async function () {
            let amount: number = 1;
            await expect(await token.burn(amount)).to.emit(token, "Transfer");
        });

        it("Should emit the Transfer event by passing the right input args", async function () {
            let amount: bigint = 666n * 10n ** 18n;
            let zeroAddr = ethers.constants.AddressZero;
            await expect(await token.burn(amount))
                        .to.emit(token, "Transfer")
                        .withArgs(owner.address, zeroAddr, amount);
        });
    })

    describe("Testing Pausing Transfers #(pauseTransfers)", function () {

        it("Should set the isPaused state var to true", async function () {
            await token.pauseTransfers();
            let statePause: boolean = await token.isPaused();
            expect(statePause).to.equal(true);
        });

        it("Should Revert if caller is not the Owner ", async function() {
            expect(token.connect(addr1).pauseTransfers()).to.be.revertedWith("Only owner");
        });

        it("Should Revert if already paused ", async function() {
            await token.pauseTransfers();
            expect(token.pauseTransfers()).to.be.revertedWith("Token transfers are paused");
        });

        it("Should emit the Paused event", async function () {
            await expect(await token.pauseTransfers()).to.emit(token, "Paused");
        });

        it("Should emit the Paused event by passing the right input arg", async function () {
            await expect(await token.pauseTransfers()).to.emit(token, "Paused").withArgs(owner.address);
        });

        it("Should not allow simple transfers", async function () {
            let amount: bigint = 999n * 10n ** 18n;
            await token.pauseTransfers();
            await expect(token.transfer(addr1.address, amount)).to.be.revertedWith("Token transfers are paused");
        })

        it("Should not allow delegated transactions", async function() {
            let amount: bigint = 101n * 10n **18n;
            await token.approve(addr1.address, amount);
            expect(await token.allowance(owner.address, addr1.address)).to.equal(amount);

            await token.pauseTransfers();
            await expect(token.connect(addr1).transferFrom(owner.address, addr2.address, amount))
                        .to.be.revertedWith("Token transfers are paused");
        });

        it("Should not allow Minintg Tokens", async function () {
            let amount: number = 306;
            await token.pauseTransfers();
            await expect(token.mint(amount)).to.be.revertedWith("Token transfers are paused");
        });

        it("Should not allow Burning Tokens", async function () {
            let amount: number = 306;
            await token.pauseTransfers();
            await expect(token.burn(amount)).to.be.revertedWith("Token transfers are paused");
        });

        it("Should allow reading account balances", async function () {
            await token.pauseTransfers();
            await expect(token.balanceOf(owner.address)).to.not.be.reverted;
            let bal: BigNumber = await token.balanceOf(owner.address);
            expect(await token.totalSupply()).to.equal(bal);
        });

        it("Should allow delegating/approvals", async function () {
            let amount: number = 1023;
            await token.pauseTransfers();
            await expect(token.approve(addr1.address, amount)).to.not.be.reverted;
        });

        it("Should allow reading allowances", async function () {
            let amount: number = 234;
            await token.pauseTransfers();
            await token.approve(addr1.address, amount);
            await expect(token.allowance(owner.address, addr1.address)).to.not.be.reverted;
            let approvedAmount: BigNumber = await token.allowance(owner.address, addr1.address);
            expect(approvedAmount).to.equal(amount);
        });
    })

    describe("Testing UnPausing Transfers #(unPauseTransfers)", function () {

        it("Should initially be unpaused", async function () {
            let statePause: boolean = await token.isPaused();
            expect(statePause).to.equal(false);
        });

        it("Should Revert if already unpaused", async function () {
            expect(await token.isPaused()).to.equal(false);
            await expect(token.unPauseTransfers()).to.be.revertedWith("Token transfers are not paused");
        });

        it("Should Revert if caller is not the Onwer", async function () {
            await expect(token.connect(addr2).unPauseTransfers()).to.be.revertedWith("Only Owner");
        });

        it("Should set the isPaused state var to false", async function (){
            expect(await token.isPaused()).to.equal(false);
            await token.pauseTransfers();
            expect(await token.isPaused()).to.equal(true);
            await token.unPauseTransfers();
            expect(await token.isPaused()).to.equal(false);
        });

        it("Should emit the Unpaused event", async function () {
            await token.pauseTransfers();
            expect(await token.isPaused()).to.equal(true);
            await expect(await token.unPauseTransfers()).to.emit(token, "Unpaused");
        });

        it("Should emit the Unpaused event by passing the right input arg", async function () {
            await token.pauseTransfers();
            expect(await token.isPaused()).to.equal(true);
            await expect(await token.unPauseTransfers())
                        .to.emit(token, "Unpaused").withArgs(owner.address);
        });
    })

    describe("Testing Contract Destruction #(destory)", function () {

        it("Should Revert if caller is not the owner", async function () {
            await expect(token.connect(addr1).destroy()).to.be.revertedWith("Only Owner");
        });

        it("Should destory the contract", async function () {
            await token.destroy();
            await expect(token.balanceOf(addr1.address)).to.be.reverted;
            await expect(token.totalSupply()).to.be.reverted;
            await expect(token.owner()).to.be.reverted;
        });

        it("Should send all funds to owner", async function () {
            let initBalance: BigNumber = await owner.getBalance();
            let contractBalance: BigNumber = await ethers.provider.getBalance(token.address);
            expect(contractBalance).to.equal(ethers.utils.parseEther("100"));
            await token.destroy();
            let finalBalance: BigNumber = await owner.getBalance();
            expect(finalBalance).to.be.greaterThan(initBalance);
            //This is not recommended...
            expect(finalBalance).to.be.closeTo(initBalance.toBigInt() + contractBalance.toBigInt(), ethers.utils.parseUnits("100000", 9));
        });

    })
    
});

