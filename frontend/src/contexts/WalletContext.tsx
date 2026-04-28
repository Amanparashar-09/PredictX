import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { BrowserProvider, JsonRpcSigner, formatEther, formatUnits } from 'ethers';
import { getUSDCContract, isDeployed, ZERO_ADDRESS } from '@/lib/contracts';

interface WalletContextType {
  isConnected: boolean;
  address: string | null;
  balance: string;      // ETH balance (human-readable)
  usdcBalance: string;  // USDC balance (human-readable, 6 decimals)
  provider: BrowserProvider | null;
  signer: JsonRpcSigner | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  isConnecting: boolean;
  chainId: number | null;
  refreshUsdcBalance: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>('0');
  const [usdcBalance, setUsdcBalance] = useState<string>('0');
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [chainId, setChainId] = useState<number | null>(null);

  const refreshUsdcBalance = useCallback(async (addr?: string, prov?: BrowserProvider) => {
    const targetAddr = addr || address;
    const targetProv = prov || provider;
    if (!targetAddr || !targetProv || !isDeployed()) return;
    try {
      const usdc = getUSDCContract(targetProv);
      const raw: bigint = await usdc.balanceOf(targetAddr);
      setUsdcBalance(formatUnits(raw, 6));
    } catch {
      // USDC contract may not be deployed yet — silently ignore
    }
  }, [address, provider]);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    try {
      if (!window.ethereum) {
        alert('MetaMask is not installed. Please install MetaMask to use this application.');
        setIsConnecting(false);
        return;
      }

      // Request MetaMask account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      }) as string[];

      if (accounts.length > 0) {
        const browserProvider = new BrowserProvider(window.ethereum);
        const userSigner = await browserProvider.getSigner();
        const userAddress = accounts[0];
        const [userBalance, network] = await Promise.all([
          browserProvider.getBalance(userAddress),
          browserProvider.getNetwork(),
        ]);

        setProvider(browserProvider);
        setSigner(userSigner);
        setAddress(userAddress);
        setBalance(formatEther(userBalance));
        setChainId(Number(network.chainId));
        setIsConnected(true);

        // Fetch USDC balance after connecting
        await refreshUsdcBalance(userAddress, browserProvider);
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      alert('Failed to connect wallet. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  }, [refreshUsdcBalance]);

  const disconnect = useCallback(() => {
    setProvider(null);
    setSigner(null);
    setAddress(null);
    setBalance('0');
    setUsdcBalance('0');
    setIsConnected(false);
    setChainId(null);
  }, []);

  // Listen for account changes
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else if (accounts[0] !== address) {
        connect();
      }
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [address, connect, disconnect]);

  return (
    <WalletContext.Provider
      value={{
        isConnected,
        address,
        balance,
        usdcBalance,
        provider,
        signer,
        connect,
        disconnect,
        isConnecting,
        chainId,
        refreshUsdcBalance,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}

// Type declaration for window.ethereum (MetaMask / EIP-1193)
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, callback: (...args: unknown[]) => void) => void;
      removeListener: (event: string, callback: (...args: unknown[]) => void) => void;
      isMetaMask?: boolean;
      chainId?: string;
    };
  }
}
