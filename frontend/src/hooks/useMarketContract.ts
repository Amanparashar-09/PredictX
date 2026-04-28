import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '@/contexts/WalletContext';
import {
  getMarketContract,
  getUSDCContract,
  parseUSDC,
  formatUSDC,
  ADDRESSES,
} from '@/lib/contracts';

export type TxStatus = 'idle' | 'approving' | 'pending' | 'confirmed' | 'error';

export interface MarketState {
  question: string;
  expiry: number;
  resolved: boolean;
  outcomeYes: boolean;
  totalYes: string; // human-readable USDC
  totalNo: string;
  pool: string;
}

export interface UserPosition {
  yesStake: string; // human-readable USDC
  noStake: string;
  claimed: boolean;
  potentialPayout: string;
}

export function useMarketContract() {
  const { signer, provider, address: userAddress } = useWallet();
  const [txStatus, setTxStatus] = useState<TxStatus>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txError, setTxError] = useState<string | null>(null);

  function resetTx() {
    setTxStatus('idle');
    setTxHash(null);
    setTxError(null);
  }

  /** Approve USDC spend for a market, then call buyYes */
  const buyYes = useCallback(
    async (marketAddress: string, displayAmount: string) => {
      if (!signer) throw new Error('Wallet not connected');
      resetTx();
      try {
        const amount = parseUSDC(displayAmount);
        const usdc = getUSDCContract(signer);
        const market = getMarketContract(marketAddress, signer);

        // Step 1 — approve
        setTxStatus('approving');
        const allowance: bigint = await usdc.allowance(
          await signer.getAddress(),
          marketAddress
        );
        if (allowance < amount) {
          const approveTx = await usdc.approve(marketAddress, amount);
          await approveTx.wait();
        }

        // Step 2 — buy
        setTxStatus('pending');
        const tx = await market.buyYes(amount);
        setTxHash(tx.hash);
        await tx.wait();
        setTxStatus('confirmed');
        return tx.hash as string;
      } catch (err: any) {
        setTxStatus('error');
        setTxError(err?.reason || err?.message || 'Transaction failed');
        throw err;
      }
    },
    [signer]
  );

  /** Approve USDC spend for a market, then call buyNo */
  const buyNo = useCallback(
    async (marketAddress: string, displayAmount: string) => {
      if (!signer) throw new Error('Wallet not connected');
      resetTx();
      try {
        const amount = parseUSDC(displayAmount);
        const usdc = getUSDCContract(signer);
        const market = getMarketContract(marketAddress, signer);

        setTxStatus('approving');
        const allowance: bigint = await usdc.allowance(
          await signer.getAddress(),
          marketAddress
        );
        if (allowance < amount) {
          const approveTx = await usdc.approve(marketAddress, amount);
          await approveTx.wait();
        }

        setTxStatus('pending');
        const tx = await market.buyNo(amount);
        setTxHash(tx.hash);
        await tx.wait();
        setTxStatus('confirmed');
        return tx.hash as string;
      } catch (err: any) {
        setTxStatus('error');
        setTxError(err?.reason || err?.message || 'Transaction failed');
        throw err;
      }
    },
    [signer]
  );

  /** Claim winnings from a resolved market */
  const claimWinnings = useCallback(
    async (marketAddress: string) => {
      if (!signer) throw new Error('Wallet not connected');
      resetTx();
      try {
        const market = getMarketContract(marketAddress, signer);
        setTxStatus('pending');
        const tx = await market.claim();
        setTxHash(tx.hash);
        await tx.wait();
        setTxStatus('confirmed');
        return tx.hash as string;
      } catch (err: any) {
        setTxStatus('error');
        setTxError(err?.reason || err?.message || 'Transaction failed');
        throw err;
      }
    },
    [signer]
  );

  /** Read on-chain market state (no wallet required) */
  const getMarketState = useCallback(
    async (marketAddress: string): Promise<MarketState> => {
      const p = provider || (signer ? await signer.provider : null);
      if (!p) throw new Error('No provider');
      const market = getMarketContract(marketAddress, p);
      const [question, expiry, resolved, outcomeYes, totalYes, totalNo] =
        await Promise.all([
          market.question(),
          market.expiry(),
          market.resolved(),
          market.outcomeYes(),
          market.totalYes(),
          market.totalNo(),
        ]);
      return {
        question,
        expiry: Number(expiry),
        resolved,
        outcomeYes,
        totalYes: formatUSDC(totalYes),
        totalNo: formatUSDC(totalNo),
        pool: formatUSDC(BigInt(totalYes) + BigInt(totalNo)),
      };
    },
    [provider, signer]
  );

  /** Read user's position in a market */
  const getUserPosition = useCallback(
    async (marketAddress: string, walletAddress?: string): Promise<UserPosition> => {
      const addr = walletAddress || userAddress;
      if (!addr) throw new Error('No address');
      const p = provider || (signer ? await signer.provider : null);
      if (!p) throw new Error('No provider');
      const market = getMarketContract(marketAddress, p);
      const [[yesStake, noStake], claimed, potentialPayout] = await Promise.all([
        market.getUserStake(addr),
        market.claimed(addr),
        market.getPotentialPayout(addr),
      ]);
      return {
        yesStake: formatUSDC(yesStake),
        noStake: formatUSDC(noStake),
        claimed,
        potentialPayout: formatUSDC(potentialPayout),
      };
    },
    [provider, signer, userAddress]
  );

  return {
    buyYes,
    buyNo,
    claimWinnings,
    getMarketState,
    getUserPosition,
    txStatus,
    txHash,
    txError,
    resetTx,
  };
}
