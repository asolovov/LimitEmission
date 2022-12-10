# Simple ERC-20 contract with possibility to set max emission and provide minter role

Implementation of the ERC20 Open Zeppelin based contract with next possibilities:
* Set max emission of tokens. Owner can set and amount of tokens, when it will be reached, mint is not possible
* Set unlimited emission of tokens. `_maxEmission` 0 amount = no emission limit
* Change max emission, but not less than total token supply
* Set and revoke minter role for user or contract account. Can be used in staking contracts

Try running some followings:

```shell
npx hardhat test
npx hardhat run scripts/deploy.js
```