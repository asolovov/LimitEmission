const { expect } = require("chai");
const {loadFixture} = require("@nomicfoundation/hardhat-network-helpers");
const {ethers} = require("hardhat");

// Can add tests for standard ERC-20 functions such as `transfer`, `approve` etc.

describe("Staking unit tests", function () {

    const name = 'LET Coin';
    const symbol = 'LET';
    const zeroAddress = '0x0000000000000000000000000000000000000000';

    async function deployLimitEmissionFixture() {
        const [owner, address1, address2] = await ethers.getSigners();

        const LimitEmission = await ethers.getContractFactory("LimitEmission");
        const limitEmission = await LimitEmission.deploy(
            name,
            symbol
        );

        return {limitEmission, owner, address1, address2};
    }

    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            const { limitEmission, owner } = await loadFixture(deployLimitEmissionFixture);

            expect(await limitEmission.owner()).to.equal(owner.address);
        });

        it("Should deploy with proper address", async function () {
            const { limitEmission } = await loadFixture(deployLimitEmissionFixture);

            expect(limitEmission.address).to.be.properAddress;
        });

        it("Total Supply should be 0", async function () {
            const { limitEmission } = await loadFixture(deployLimitEmissionFixture);

            expect(await limitEmission.totalSupply()).to.equal(0);
        });

        it("Should have right name", async function () {
            const { limitEmission } = await loadFixture(deployLimitEmissionFixture);

            expect(await limitEmission.name()).to.equal(name);
        });

        it("Should have right symbol", async function () {
            const { limitEmission } = await loadFixture(deployLimitEmissionFixture);

            expect(await limitEmission.symbol()).to.equal(symbol);
        });

        it("Should have 0 max emission", async function () {
            const { limitEmission } = await loadFixture(deployLimitEmissionFixture);

            expect(await limitEmission.maxEmission()).to.equal(0);
        });

        it("Should have 18 decimals", async function () {
            const { limitEmission } = await loadFixture(deployLimitEmissionFixture);

            expect(await limitEmission.decimals()).to.equal(18);
        })
    })

    describe("Minter role" ,function () {
        describe("Set minter role", function () {
            it("Should set minter role for owner", async function () {
                const { limitEmission, address1 } = await loadFixture(deployLimitEmissionFixture);
                const minterRole = await limitEmission.MINTER_ROLE();

                await limitEmission.setMinterRole(address1.address);

                expect(await limitEmission.hasRole(minterRole, address1.address)).to.equal(true);
            });

            it("Should not allow to set minter role for not owner", async function () {
                const { limitEmission, address1, address2 } = await loadFixture(deployLimitEmissionFixture);

                const tx = limitEmission.connect(address1).setMinterRole(address2.address);

                await expect(tx).to.be.revertedWith("Ownable: caller is not the owner");
            });

            it("Should not allow to set minter role for zero address", async function () {
                const { limitEmission } = await loadFixture(deployLimitEmissionFixture);

                const tx = limitEmission.setMinterRole(zeroAddress);

                await expect(tx).to.be.revertedWith("LimitEmission: minter address can not be zero address!");
            });
        })

        describe("Revoke minter role", function () {
            it("Should revoke minter role for owner", async function () {
                const { limitEmission, address1 } = await loadFixture(deployLimitEmissionFixture);
                const minterRole = await limitEmission.MINTER_ROLE();

                await limitEmission.setMinterRole(address1.address);
                await limitEmission.revokeMinterRole(address1.address);

                expect(await limitEmission.hasRole(minterRole, address1.address)).to.equal(false);
            });

            it("Should not revoke minter role for not owner", async function () {
                const { limitEmission, address1, address2 } = await loadFixture(deployLimitEmissionFixture);

                await limitEmission.setMinterRole(address1.address);
                const tx = limitEmission.connect(address2).revokeMinterRole(address1.address);

                await expect(tx).to.be.revertedWith("Ownable: caller is not the owner");
            });

            it("Should not revoke minter role if given address has no minter role", async function () {
                const { limitEmission, address1 } = await loadFixture(deployLimitEmissionFixture);

                const tx = limitEmission.revokeMinterRole(address1.address);

                await expect(tx).to.be.revertedWith("LimitEmission: given address is not a minter!");
            });
        })
    })

    describe("Max emission", function () {
        it("Should allow to set max emission for owner", async function () {
            const { limitEmission } = await loadFixture(deployLimitEmissionFixture);
            const newMaxEmission = 10;

            await limitEmission.setMaxEmission(newMaxEmission);

            expect(await limitEmission.maxEmission()).to.equal(newMaxEmission);
        });

        it("Should allow to set 0 max emission for owner, when supply is more then 0", async function () {
            const { limitEmission, owner } = await loadFixture(deployLimitEmissionFixture);
            const emission = 10;

            const tx = await limitEmission.mint(owner.address, emission);
            await tx.wait();

            expect(await limitEmission.totalSupply()).to.equal(emission);

            const newMaxEmission = 0;
            await limitEmission.setMaxEmission(newMaxEmission);

            expect(await limitEmission.maxEmission()).to.equal(newMaxEmission);
        });

        it("Should not allow to set max emission for owner, when max emission more then current supply", async function () {
            const { limitEmission, owner } = await loadFixture(deployLimitEmissionFixture);
            const emission = 10;

            const tx = await limitEmission.mint(owner.address, emission);
            await tx.wait();

            expect(await limitEmission.totalSupply()).to.equal(emission);

            const newMaxEmission = 5;
            const setMaxEmission = limitEmission.setMaxEmission(newMaxEmission);

            await expect(setMaxEmission).to.be.revertedWith("LimitEmission: Max emission must be 0 or more then total supply!");
        });

        it("Should not allow to set max emission for not owner", async function () {
            const { limitEmission, address1 } = await loadFixture(deployLimitEmissionFixture);
            const newMaxEmission = 10;

            const tx = limitEmission.connect(address1).setMaxEmission(newMaxEmission);

            await expect(tx).to.be.revertedWith("Ownable: caller is not the owner");
        });
    })

    describe("Mint", function () {
        it("Should mint by owner to owner", async function () {
            const { limitEmission, owner } = await loadFixture(deployLimitEmissionFixture);
            const emission = 1;

            await limitEmission.mint(owner.address, emission);

            expect(await limitEmission.balanceOf(owner.address)).to.equal(emission);
            expect(await limitEmission.totalSupply()).to.equal(emission);
        });

        it("Should mint by owner to address1", async function () {
            const { limitEmission, address1 } = await loadFixture(deployLimitEmissionFixture);
            const emission = 1;

            await limitEmission.mint(address1.address, emission);

            expect(await limitEmission.balanceOf(address1.address)).to.equal(emission);
            expect(await limitEmission.totalSupply()).to.equal(emission);
        });

        it("Should mint by minter to address1", async function () {
            const { limitEmission, address1, address2 } = await loadFixture(deployLimitEmissionFixture);
            const emission = 1;

            await limitEmission.setMinterRole(address2.address);
            await limitEmission.connect(address2).mint(address1.address, emission);

            expect(await limitEmission.balanceOf(address1.address)).to.equal(emission);
            expect(await limitEmission.totalSupply()).to.equal(emission);
        });

        it("Should mint when max emission limit is set but not reached", async function () {
            const { limitEmission, owner } = await loadFixture(deployLimitEmissionFixture);
            const emission = 10;

            await limitEmission.mint(owner.address, emission);

            await limitEmission.setMaxEmission(11);

            const emission2 = 1;

            await limitEmission.mint(owner.address, emission2);

            expect(await limitEmission.balanceOf(owner.address)).to.equal(emission + emission2);
            expect(await limitEmission.totalSupply()).to.equal(emission + emission2);
        });

        it("Should not mint when max emission limit is reached", async function () {
            const { limitEmission, owner } = await loadFixture(deployLimitEmissionFixture);
            const emission = 10;

            await limitEmission.mint(owner.address, emission);

            await limitEmission.setMaxEmission(11);

            const emission2 = 2;

            const tx2 = limitEmission.mint(owner.address, emission2);

            await expect(tx2).to.be.revertedWith("LimitEmission: Emission limit reached!");
        });

        it("Should not mint by not owner and not minter", async function () {
            const { limitEmission, address1 } = await loadFixture(deployLimitEmissionFixture);
            const emission = 10;

            const tx = limitEmission.connect(address1).mint(address1.address, emission);

            await expect(tx).to.be.revertedWith("LimitEmission: Caller is not a minter or owner!");
        });

        it("Should not mint when minter role was revoked", async function () {
            const { limitEmission, address1, address2 } = await loadFixture(deployLimitEmissionFixture);
            const emission = 10;

            await limitEmission.setMinterRole(address2.address);
            await limitEmission.revokeMinterRole(address2.address);

            const tx = limitEmission.connect(address2).mint(address1.address, emission);

            await expect(tx).to.be.revertedWith("LimitEmission: Caller is not a minter or owner!");
        });

        it("Should not mint when amount is 0", async function () {
            const { limitEmission, address1 } = await loadFixture(deployLimitEmissionFixture);
            const emission = 0;

            const tx = limitEmission.mint(address1.address, emission);

            await expect(tx).to.be.revertedWith("LimitEmission: Amount must be more then 0!");
        });
    })

})