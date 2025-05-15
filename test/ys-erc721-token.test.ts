import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers';
import { expect } from 'chai';
import hre, { ethers } from 'hardhat';

describe('YSERC721token contract', function () {
  async function deployYSERC721tokenFixture() {
    const name = 'YSERC721token';
    const symbol = 'YSERC721';

    const [owner, otherAccount] = await hre.ethers.getSigners();

    const YSERC721tokenFactory = await hre.ethers.getContractFactory(
      'YSERC721token',
    );
    const YSERC721token = await YSERC721tokenFactory.deploy(name, symbol);

    return {
      YSERC721token,
      name,
      symbol,
      owner,
      otherAccount,
    };
  }

  describe('Deployment', function () {
    it('Should set the right name', async function () {
      const { YSERC721token, name } = await loadFixture(
        deployYSERC721tokenFixture,
      );

      expect(await YSERC721token.name()).to.equal(name);
    });

    it('Should set the right symbol', async function () {
      const { YSERC721token, symbol } = await loadFixture(
        deployYSERC721tokenFixture,
      );

      expect(await YSERC721token.symbol()).to.equal(symbol);
    });

    it('Should correctly change the balance', async function () {
      const { YSERC721token, owner } = await loadFixture(
        deployYSERC721tokenFixture,
      );

      expect(await YSERC721token.balanceOf(owner.address)).to.equal(1);
    });

    it('Should emit Transfer event on deployment', async function () {
      const { YSERC721token, owner } = await loadFixture(
        deployYSERC721tokenFixture,
      );

      await expect(YSERC721token.deploymentTransaction())
        .to.emit(YSERC721token, 'Transfer')
        .withArgs(ethers.ZeroAddress, owner.address, 1);
    });
  });

  describe('Returning token URI', function () {
    it('Should return the right token URI', async function () {
      const { YSERC721token } = await loadFixture(deployYSERC721tokenFixture);

      const BASE_TOKEN_URI =
        'ipfs://QmPMc4tcBsMqLRuCQtPmPe84bpSjrC3Ky7t3JWuHXYB4aS/';
      const ID = 1;

      expect(await YSERC721token.tokenURI(ID)).to.equal(BASE_TOKEN_URI + ID);
    });

    it('Should revert with the right error if trying to get token URI with non existent token ID', async function () {
      const { YSERC721token } = await loadFixture(deployYSERC721tokenFixture);

      const nonExistentTokenID = 2;

      await expect(YSERC721token.tokenURI(nonExistentTokenID))
        .to.be.revertedWithCustomError(YSERC721token, 'ERC721NonexistentToken')
        .withArgs(nonExistentTokenID);
    });
  });

  describe('supportsInterface function', function () {
    it('Should return true for IERC721 id', async function () {
      const { YSERC721token } = await loadFixture(deployYSERC721tokenFixture);

      const IERC721_ID = '0x80ac58cd';

      expect(await YSERC721token.supportsInterface(IERC721_ID)).to.be.true;
    });

    it('Should return false for id 0xffffffff', async function () {
      const { YSERC721token } = await loadFixture(deployYSERC721tokenFixture);

      const FALSY_ID = '0xffffffff';

      expect(await YSERC721token.supportsInterface(FALSY_ID)).to.be.false;
    });
  });

  describe('Transfers', function () {
    describe('Ownership changing', function () {
      it('Should correctly change the ownership of the token after transfer, function transferFrom', async function () {
        const { YSERC721token, owner, otherAccount } = await loadFixture(
          deployYSERC721tokenFixture,
        );

        const tokenId = 1;
        await YSERC721token.transferFrom(
          owner.address,
          otherAccount.address,
          tokenId,
        );

        expect(await YSERC721token.ownerOf(tokenId)).to.equal(
          otherAccount.address,
        );
      });

      it('Should correctly change the ownership of the token after transfer, function safeTransferFrom with data', async function () {
        const { YSERC721token, owner, otherAccount } = await loadFixture(
          deployYSERC721tokenFixture,
        );

        const tokenId = 1;
        await YSERC721token['safeTransferFrom(address,address,uint256,bytes)'](
          owner.address,
          otherAccount.address,
          tokenId,
          Buffer.from('Hello world!', 'utf8'),
        );

        expect(await YSERC721token.ownerOf(tokenId)).to.equal(
          otherAccount.address,
        );
      });

      it('Should correctly change the ownership of the token after transfer, function safeTransferFrom without data', async function () {
        const { YSERC721token, owner, otherAccount } = await loadFixture(
          deployYSERC721tokenFixture,
        );

        const tokenId = 1;
        await YSERC721token['safeTransferFrom(address,address,uint256)'](
          owner.address,
          otherAccount.address,
          tokenId,
        );

        expect(await YSERC721token.ownerOf(tokenId)).to.equal(
          otherAccount.address,
        );
      });
    });

    describe('Events', function () {
      it('Should emit Transfer event after transfer, function transferFrom', async function () {
        const { YSERC721token, owner, otherAccount } = await loadFixture(
          deployYSERC721tokenFixture,
        );

        const tokenId = 1;

        await expect(
          YSERC721token.transferFrom(
            owner.address,
            otherAccount.address,
            tokenId,
          ),
        )
          .to.emit(YSERC721token, 'Transfer')
          .withArgs(owner.address, otherAccount.address, tokenId);
      });
    });

    describe('Errors', function () {
      it('Should revert with the right error if trying transfer to zero address, function transferFrom', async function () {
        const { YSERC721token, owner } = await loadFixture(
          deployYSERC721tokenFixture,
        );

        await expect(
          YSERC721token.transferFrom(owner.address, ethers.ZeroAddress, 1),
        )
          .to.be.revertedWithCustomError(YSERC721token, 'ERC721InvalidReceiver')
          .withArgs(ethers.ZeroAddress);
      });

      it('Should revert with the right error if trying transfer from zero address, function transferFrom', async function () {
        const { YSERC721token, otherAccount } = await loadFixture(
          deployYSERC721tokenFixture,
        );

        await expect(
          YSERC721token.transferFrom(
            ethers.ZeroAddress,
            otherAccount.address,
            1,
          ),
        )
          .to.be.revertedWithCustomError(YSERC721token, 'ERC721InvalidSender')
          .withArgs(ethers.ZeroAddress);
      });
    });
  });

  describe('Approval', function () {
    describe('Function approve', function () {
      it('Should set approve for operator', async function () {
        const { YSERC721token, otherAccount } = await loadFixture(
          deployYSERC721tokenFixture,
        );

        const tokenId = 1;
        await YSERC721token.approve(otherAccount.address, tokenId);

        expect(await YSERC721token.getApproved(tokenId)).to.equal(
          otherAccount.address,
        );
      });

      it('Should emit Approval event after approve', async function () {
        const { YSERC721token, owner, otherAccount } = await loadFixture(
          deployYSERC721tokenFixture,
        );

        const tokenId = 1;

        await expect(YSERC721token.approve(otherAccount.address, tokenId))
          .to.emit(YSERC721token, 'Approval')
          .withArgs(owner.address, otherAccount.address, tokenId);
      });

      it('Should revert with the right error if the non-owner is trying to approve', async function () {
        const { YSERC721token, otherAccount } = await loadFixture(
          deployYSERC721tokenFixture,
        );

        await expect(
          YSERC721token.connect(otherAccount).approve(otherAccount.address, 1),
        )
          .to.be.revertedWithCustomError(YSERC721token, 'ERC721InvalidApprover')
          .withArgs(otherAccount.address);
      });
    });

    describe('Function setApprovalForAll', function () {
      it('Should set approve for operator', async function () {
        const { YSERC721token, owner, otherAccount } = await loadFixture(
          deployYSERC721tokenFixture,
        );

        await YSERC721token.setApprovalForAll(otherAccount.address, true);

        expect(
          await YSERC721token.isApprovedForAll(
            owner.address,
            otherAccount.address,
          ),
        ).to.be.true;
      });

      it('Should emit ApprovalForAll event after approve', async function () {
        const { YSERC721token, owner, otherAccount } = await loadFixture(
          deployYSERC721tokenFixture,
        );

        const approveType = true;

        await expect(
          YSERC721token.setApprovalForAll(otherAccount.address, approveType),
        )
          .to.emit(YSERC721token, 'ApprovalForAll')
          .withArgs(owner.address, otherAccount.address, approveType);
      });

      it('Should revert with the right error if trying to set approve for zero address', async function () {
        const { YSERC721token } = await loadFixture(deployYSERC721tokenFixture);

        await expect(YSERC721token.setApprovalForAll(ethers.ZeroAddress, true))
          .to.be.revertedWithCustomError(YSERC721token, 'ERC721InvalidOperator')
          .withArgs(ethers.ZeroAddress);
      });
    });
  });
});
