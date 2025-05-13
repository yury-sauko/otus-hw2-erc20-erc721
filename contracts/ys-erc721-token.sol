// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/utils/introspection/IERC165.sol";

import { IERC721Errors } from "@openzeppelin/contracts/interfaces/draft-IERC6093.sol";

import "@openzeppelin/contracts/utils/Strings.sol";

contract YSERC721token is IERC721, IERC721Metadata, IERC721Errors {
    using Strings for uint256;

    string public override name;
    string public override symbol;

    string private constant BASE_TOKEN_URI = "ipfs://QmPMc4tcBsMqLRuCQtPmPe84bpSjrC3Ky7t3JWuHXYB4aS/";

    mapping(address owner => uint256 balance) public override balanceOf;
    mapping(uint256 tokenId => address owner) public override ownerOf;
    mapping(uint256 tokenId => address operator) public override getApproved;
    mapping(address owner => 
            mapping(address operator => bool isApproved)) public override isApprovedForAll;

    modifier tokenIdExist(uint256 _tokenId) {
        if (ownerOf[_tokenId] == address(0)) {
            revert ERC721NonexistentToken(_tokenId);
        }
        _;
    }

    constructor(
        string memory _name, 
        string memory _symbol
    ) {
        name = _name;
        symbol = _symbol;

        ownerOf[1] = msg.sender;
        emit Transfer(address(0), msg.sender, 1);

        balanceOf[msg.sender] += 1;
    }

    function tokenURI(
        uint256 _tokenId
    ) external override view tokenIdExist(_tokenId) returns (string memory) {
        return string.concat(
            BASE_TOKEN_URI,
            _tokenId.toString()
        );
    }

    function transferFrom(
        address _from, 
        address _to, 
        uint256 _tokenId
    ) external override {
        _transfer(_from, _to, _tokenId);
    }

    function safeTransferFrom(
        address _from, 
        address _to, 
        uint256 _tokenId, 
        bytes memory _data
    ) external override {
        _saveTransfer(_from, _to, _tokenId, _data);
    }

    function safeTransferFrom(
        address _from, 
        address _to, 
        uint256 _tokenId
    ) external override {
        _saveTransfer(_from, _to, _tokenId, "");
    }

    function approve(
        address _operator, 
        uint256 _tokenId
    ) external override tokenIdExist(_tokenId) {
        if (ownerOf[_tokenId] != msg.sender) {
            revert ERC721InvalidApprover(msg.sender);
        }

        getApproved[_tokenId] = _operator;
        emit Approval(msg.sender, _operator, _tokenId);
    }

    function setApprovalForAll(
        address _operator, 
        bool _approved
    ) external override {
        if (_operator == address(0)) {
            revert ERC721InvalidOperator(_operator);
        }

        isApprovedForAll[msg.sender][_operator] = _approved;
        emit ApprovalForAll(msg.sender, _operator, _approved);
    }

    function supportsInterface(
        bytes4 _interfaceID
    ) external pure override returns (bool) {
        return 
            _interfaceID != 0xffffffff && 
            (_interfaceID == type(IERC721).interfaceId ||
            _interfaceID == type(IERC721Metadata).interfaceId ||
            _interfaceID == type(IERC165).interfaceId);
    }

    /*
     * @notice Below are the helper functions
     */

    function _isContract(
        address targetAccount
    ) private view returns (bool) {
        uint256 size;
        assembly {
            size := extcodesize(targetAccount)
        }

        return size > 0;
    }

    function _checkContractForERC721Received(
        address _from,
        address _to,
        uint256 _tokenId,
        bytes memory _data
    ) private {
        if (
            IERC721Receiver(_to).onERC721Received(msg.sender, _from, _tokenId, _data) != 
            IERC721Receiver(_to).onERC721Received.selector
        ) {
            revert ERC721InvalidReceiver(_to);
        }
    }

    function _transfer(
        address _from, 
        address _to, 
        uint256 _tokenId
    ) private tokenIdExist(_tokenId) {
        if (_from == address(0)) {
            revert ERC721InvalidSender(_from);
        }
        if (_to == address(0) || _from == _to) {
            revert ERC721InvalidReceiver(_to);
        }
        if (ownerOf[_tokenId] != msg.sender) {
            revert ERC721IncorrectOwner(msg.sender, _tokenId, ownerOf[_tokenId]);
        }
        if (_from != msg.sender) {
            revert ERC721InsufficientApproval(_from, _tokenId);
        }

        ownerOf[_tokenId] = _to;
        emit Transfer(_from, _to, _tokenId);
    }

    function _saveTransfer(
        address _from, 
        address _to, 
        uint256 _tokenId, 
        bytes memory _data
    ) private {
        if (_isContract(_to)) {
            _checkContractForERC721Received(_from, _to, _tokenId, _data);    
        }

        _transfer(_from, _to, _tokenId);
    }
}