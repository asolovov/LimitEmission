const {ethers} = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();

    console.log("Deploying contracts with the account:", deployer.address);

    console.log("Account balance:", (await deployer.getBalance()).toString());

    const LimitEmission = await ethers.getContractFactory("LimitEmission");
    const limitEmission = await LimitEmission.deploy(
        "LET coin",
        "LET"
    );

    console.log("LET coin contract address:", limitEmission.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });