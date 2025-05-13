// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

import { IERC20Errors } from "@openzeppelin/contracts/interfaces/draft-IERC6093.sol";

contract YSERC20token is IERC20, IERC20Metadata, IERC20Errors {
    string public override name;
    string public override symbol;
    uint8 public override decimals;

    uint256 public override totalSupply;
    mapping(address account => uint256 balance) public override balanceOf;
    mapping(address owner => 
            mapping(address spender => uint256 allowedSum)) public override allowance;

    constructor(
        string memory _name, 
        string memory _symbol, 
        uint8 _decimals
    ) {
        name = _name;
        symbol = _symbol;
        decimals = _decimals;

        uint256 amount = 1_000_000 * (10 ** decimals);

        balanceOf[msg.sender] = amount;
        totalSupply += amount;
        emit Transfer(address(0), msg.sender, amount);
    }

    function transfer(
        address _to, 
        uint256 _amount
    ) external override returns (bool) {
        _transfer(msg.sender, _to, _amount);

        return true;
    }

    function transferFrom(
        address _from, 
        address _to, 
        uint256 _amount
    ) external override returns (bool) {
        // repeated condition from private function _transfer
        if (_from == address(0)) {
            revert ERC20InvalidSender(_from);
        }
        if (_from != msg.sender) {
            uint256 _allowance = allowance[_from][msg.sender];
            
            if (_allowance < _amount) {
                revert ERC20InsufficientAllowance(msg.sender, _allowance, _amount);
            }
        }

        _transfer(_from, _to, _amount);

        return true;
    }

    function approve(
        address _spender, 
        uint256 _amount
    ) external override returns (bool) {
        if (_spender == address(0)) {
            revert ERC20InvalidSpender(_spender);
        }

        allowance[msg.sender][_spender] = _amount;

        emit Approval(msg.sender, _spender, _amount);

        return true;
    }

    function _transfer(
        address _from, 
        address _to, 
        uint256 _amount
    ) private {
        if (_from == address(0)) {
            revert ERC20InvalidSender(_from);
        }
        if (_to == address(0)) {
            revert ERC20InvalidReceiver(_to);
        }

        uint256 _balance = balanceOf[_from];
        if (_balance < _amount) {
            revert ERC20InsufficientBalance(_from, _balance, _amount);
        }

        unchecked {
            balanceOf[_from] = _balance - _amount;
        }
        balanceOf[_to] += _amount;

        emit Transfer(_from, _to, _amount);
    }
}