import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers';
import { expect } from 'chai';
import hre, { ethers } from 'hardhat';

describe('YSERC20token contract', function () {
  async function deployYSERC20tokenFixture() {
    const name = 'YSERC20token';
    const symbol = 'YSERC20';
    const decimals = 2;

    const [owner, otherAccount] = await hre.ethers.getSigners();

    const YSERC20tokenFactory = await hre.ethers.getContractFactory(
      'YSERC20token',
    );
    const YSERC20token = await YSERC20tokenFactory.deploy(
      name,
      symbol,
      decimals,
    );

    return {
      YSERC20token,
      name,
      symbol,
      decimals,
      owner,
      otherAccount,
    };
  }

  describe('Deployment', function () {
    it('Should set the right name', async function () {
      const { YSERC20token, name } = await loadFixture(
        deployYSERC20tokenFixture,
      );

      expect(await YSERC20token.name()).to.equal(name);
    });

    it('Should set the right symbol', async function () {
      const { YSERC20token, symbol } = await loadFixture(
        deployYSERC20tokenFixture,
      );

      expect(await YSERC20token.symbol()).to.equal(symbol);
    });

    it('Should set the right decimals', async function () {
      const { YSERC20token, decimals } = await loadFixture(
        deployYSERC20tokenFixture,
      );

      expect(await YSERC20token.decimals()).to.equal(decimals);
    });

    it('Should set the right totalSupply', async function () {
      const { YSERC20token, decimals } = await loadFixture(
        deployYSERC20tokenFixture,
      );

      expect(await YSERC20token.totalSupply()).to.equal(
        1_000_000 * 10 ** decimals,
      );
    });

    it('Should emit Transfer event on deployment', async function () {
      const { YSERC20token, decimals, owner } = await loadFixture(
        deployYSERC20tokenFixture,
      );

      await expect(YSERC20token.deploymentTransaction())
        .to.emit(YSERC20token, 'Transfer')
        .withArgs(
          ethers.ZeroAddress,
          owner.address,
          1_000_000 * 10 ** decimals,
        );
    });
  });

  describe('Transfers', function () {
    describe('Balance changing', function () {
      it('Should correctly change the balance of the otherAccount after transfer, function transfer', async function () {
        const { YSERC20token, otherAccount } = await loadFixture(
          deployYSERC20tokenFixture,
        );

        const balanceBefore = await YSERC20token.balanceOf(
          otherAccount.address,
        );
        await YSERC20token.transfer(otherAccount.address, 1);
        const balanceAfter = await YSERC20token.balanceOf(otherAccount.address);

        expect(balanceAfter - balanceBefore).to.equal(1);
      });

      it('Should correctly change the balance of the otherAccount after transfer, function transferFrom', async function () {
        const { YSERC20token, owner, otherAccount } = await loadFixture(
          deployYSERC20tokenFixture,
        );

        const balanceBefore = await YSERC20token.balanceOf(
          otherAccount.address,
        );
        await YSERC20token.transferFrom(owner.address, otherAccount.address, 1);
        const balanceAfter = await YSERC20token.balanceOf(otherAccount.address);

        expect(balanceAfter - balanceBefore).to.equal(1);
      });

      it('Should correctly change the balance of the otherAccount if trying transfer tokens from other account with sufficient allowance, function transferFrom', async function () {
        const { YSERC20token, owner, otherAccount } = await loadFixture(
          deployYSERC20tokenFixture,
        );

        await YSERC20token.transfer(otherAccount.address, 100);

        const otherAccountBalanceBefore = await YSERC20token.balanceOf(
          otherAccount.address,
        );
        const transferAmount = otherAccountBalanceBefore - 1n;

        await YSERC20token.connect(otherAccount).approve(
          owner.address,
          otherAccountBalanceBefore,
        );
        await YSERC20token.transferFrom(
          otherAccount.address,
          owner.address,
          transferAmount,
        );

        const otherAccountBalanceAfter = await YSERC20token.balanceOf(
          otherAccount.address,
        );

        expect(otherAccountBalanceBefore - otherAccountBalanceAfter).to.equal(
          99n,
        );
      });
    });

    describe('Events', function () {
      it('Should emit Transfer event after transfer, function transfer', async function () {
        const { YSERC20token, owner, otherAccount } = await loadFixture(
          deployYSERC20tokenFixture,
        );

        await expect(YSERC20token.transfer(otherAccount.address, 1))
          .to.emit(YSERC20token, 'Transfer')
          .withArgs(owner.address, otherAccount.address, 1);
      });

      it('Should emit Transfer event after transfer, function transferFrom', async function () {
        const { YSERC20token, owner, otherAccount } = await loadFixture(
          deployYSERC20tokenFixture,
        );

        await expect(
          YSERC20token.transferFrom(owner.address, otherAccount.address, 1),
        )
          .to.emit(YSERC20token, 'Transfer')
          .withArgs(owner.address, otherAccount.address, 1);
      });
    });

    describe('Errors', function () {
      it('Should revert with the right error if trying transfer to zero address, function transfer', async function () {
        const { YSERC20token } = await loadFixture(deployYSERC20tokenFixture);

        await expect(YSERC20token.transfer(ethers.ZeroAddress, 1))
          .to.be.revertedWithCustomError(YSERC20token, 'ERC20InvalidReceiver')
          .withArgs(ethers.ZeroAddress);
      });

      // added repeated condition to the function transferFrom in the contract for this test.
      // Otherwise, the test reverts with the error "ERC20InsufficientAllowance"
      it('Should revert with the right error if trying transfer from zero address, function transferFrom', async function () {
        const { YSERC20token, otherAccount } = await loadFixture(
          deployYSERC20tokenFixture,
        );

        await expect(
          YSERC20token.transferFrom(
            ethers.ZeroAddress,
            otherAccount.address,
            1,
          ),
        )
          .to.be.revertedWithCustomError(YSERC20token, 'ERC20InvalidSender')
          .withArgs(ethers.ZeroAddress);
      });

      it('Should revert with the right error if trying transfer to zero address, function transferFrom', async function () {
        const { YSERC20token, owner } = await loadFixture(
          deployYSERC20tokenFixture,
        );

        await expect(
          YSERC20token.transferFrom(owner.address, ethers.ZeroAddress, 1),
        )
          .to.be.revertedWithCustomError(YSERC20token, 'ERC20InvalidReceiver')
          .withArgs(ethers.ZeroAddress);
      });

      it('Should revert with the right error if trying transfer amount greater than balance, function transfer', async function () {
        const { YSERC20token, owner, otherAccount } = await loadFixture(
          deployYSERC20tokenFixture,
        );

        const ownerBalance = await YSERC20token.balanceOf(owner.address);
        const transferAmount = ownerBalance + 1n;

        await expect(
          YSERC20token.transfer(otherAccount.address, transferAmount),
        )
          .to.be.revertedWithCustomError(
            YSERC20token,
            'ERC20InsufficientBalance',
          )
          .withArgs(owner.address, ownerBalance, transferAmount);
      });

      it('Should revert with the right error if trying transfer amount greater than balance, function transferFrom', async function () {
        const { YSERC20token, owner, otherAccount } = await loadFixture(
          deployYSERC20tokenFixture,
        );

        const ownerBalance = await YSERC20token.balanceOf(owner.address);
        const transferAmount = ownerBalance + 1n;

        await expect(
          YSERC20token.transferFrom(
            owner.address,
            otherAccount.address,
            transferAmount,
          ),
        )
          .to.be.revertedWithCustomError(
            YSERC20token,
            'ERC20InsufficientBalance',
          )
          .withArgs(owner.address, ownerBalance, transferAmount);
      });

      it('Should revert with the right error if trying transfer tokens from other account with insufficient allowance, function transferFrom', async function () {
        const { YSERC20token, owner, otherAccount } = await loadFixture(
          deployYSERC20tokenFixture,
        );

        await YSERC20token.transfer(otherAccount.address, 100);

        const otherAccountBalance = await YSERC20token.balanceOf(
          otherAccount.address,
        );
        const transferAmount = otherAccountBalance;

        await YSERC20token.connect(otherAccount).approve(
          owner.address,
          transferAmount - 1n,
        );
        const allowedSum = await YSERC20token.allowance(
          otherAccount.address,
          owner.address,
        );

        await expect(
          YSERC20token.transferFrom(
            otherAccount.address,
            owner.address,
            transferAmount,
          ),
        )
          .to.be.revertedWithCustomError(
            YSERC20token,
            'ERC20InsufficientAllowance',
          )
          .withArgs(owner.address, allowedSum, transferAmount);
      });
    });
  });

  describe('Approval', function () {
    it('Should set the right allowance', async function () {
      const { YSERC20token, owner, otherAccount } = await loadFixture(
        deployYSERC20tokenFixture,
      );

      const allowedSum = 100n;
      await YSERC20token.approve(otherAccount.address, allowedSum);

      expect(
        await YSERC20token.allowance(owner.address, otherAccount.address),
      ).to.equal(allowedSum);
    });

    it('Should emit Approval event after approve', async function () {
      const { YSERC20token, owner, otherAccount } = await loadFixture(
        deployYSERC20tokenFixture,
      );

      await expect(YSERC20token.approve(otherAccount.address, 100))
        .to.emit(YSERC20token, 'Approval')
        .withArgs(owner.address, otherAccount.address, 100);
    });

    it('Should revert with the right error if trying to give approve to zero address', async function () {
      const { YSERC20token } = await loadFixture(deployYSERC20tokenFixture);

      await expect(YSERC20token.approve(ethers.ZeroAddress, 100))
        .to.be.revertedWithCustomError(YSERC20token, 'ERC20InvalidSpender')
        .withArgs(ethers.ZeroAddress);
    });
  });
});
