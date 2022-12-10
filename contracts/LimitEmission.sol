// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "hardhat/console.sol";


/*
* Implementation of the {ERC20} Open Zeppelin based contract with next possibilities:
* - Set max emission of tokens. Owner can set and amount of tokens, when it will be reached, mint is not possible
* - Set unlimited emission of tokens. `_maxEmission` 0 amount = no emission limit
* - Change max emission, but not less then total token supply
* - Set and revoke minter role for user or contract account. Can be used in staking contracts
*
*/
contract LimitEmission is ERC20, Ownable, AccessControl {

    // number of maximum token emission. If 0 - emission is not limited
    uint256 private _maxEmission;

    // minter role constant
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    constructor(string memory name_, string memory symbol_)
    ERC20(name_, symbol_)
    {}

    /*
     * @dev mints `_amount` `_to` given address
     *
     * Requirements:
     * - caller should be an owner or should have minter role
     * - `_amount` must be more then 0
     * - expected `totalSupply` see {ERC-20 totalSupply()} should be less or equal to `_maxEmission`
     *
     * @param _to       address where tokens will be minted
     * @param _amount   amount of tokens that will be minted
     */
    function mint(address _to, uint256 _amount) external {
        require(hasRole(MINTER_ROLE, msg.sender) || msg.sender == owner(), "LimitEmission: Caller is not a minter or owner!");
        require(_amount > 0, "LimitEmission: Amount must be more then 0!");
        require(_isEmissionAllowed(_amount), "LimitEmission: Emission limit reached!");

        _mint(_to, _amount);
    }

    /*
     * @dev set number of maximum token emission
     *
     * Requirements:
     * - `maxEmission` must be more then current total supply or 0
     * - caller should be an owner
     *
     * @param `maxEmission`- number of maximum token emission. If 0 - emission is not limited
     */
    function setMaxEmission(uint256 newMaxEmission) external onlyOwner {
        require(newMaxEmission > totalSupply() || newMaxEmission == 0, "LimitEmission: Max emission must be 0 or more then total supply!");
        _maxEmission = newMaxEmission;
    }

    /*
     * @dev returns number of maximum token emission allowed `_maxEmission`
     */
    function maxEmission() public view returns(uint256) {
        return _maxEmission;
    }

    /*
     * @dev sets minter role to given `minter` address. Can be user or contract
     *
     * Requirements:
     * - minter address can not be zero address
     * - caller should be an owner
     *
     */
    function setMinterRole(address minter) external onlyOwner {
        require(minter != address(0), "LimitEmission: minter address can not be zero address!");
        _setupRole(MINTER_ROLE, minter);
    }

    /*
     * @dev revokes minter role of given `minter` address
     *
     * Requirements:
     * - minter address should have minter role
     * - caller should be an owner
     *
     */
    function revokeMinterRole(address minter) external onlyOwner {
        require(hasRole(MINTER_ROLE, minter), "LimitEmission: given address is not a minter!");
        _revokeRole(MINTER_ROLE, minter);
    }

    /*
     * @dev checks if emission is possible
     *
     * @param `amount` - number of tokens to emit
     *
     * @return true if emission is possible and false if not
     */
    function _isEmissionAllowed(uint256 amount) internal view returns (bool) {
        if (_maxEmission == 0 || amount + totalSupply() <= _maxEmission) {
            return true;
        } else {
            return false;
        }
    }
}