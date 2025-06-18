```typescript
import { Connection, PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';
import { WalletAdapter, WalletError, WalletNotConnectedError } from '@solana/wallet-adapter-base';
import { toast } from 'sonner';

export interface WalletContextState {
  autoConnect: boolean;
  wallets: WalletAdapter[];
  wallet: WalletAdapter | null;
  publicKey: PublicKey | null;
  connecting: boolean;
  connected: boolean;
  disconnecting: boolean;
  select(walletName: string | null): void;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  sendTransaction(
    transaction: Transaction | VersionedTransaction,
    connection: Connection,
    options?: any
  ): Promise<string>;
  signTransaction: ((transaction: Transaction) => Promise<Transaction>) | undefined;
  signAllTransactions: ((transactions: Transaction[]) => Promise<Transaction[]>) | undefined;
  signMessage: ((message: Uint8Array) => Promise<Uint8Array>) | undefined;
}

export class WalletConnectionError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'WalletConnectionError';
  }
}

export class WalletTransactionError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'WalletTransactionError';
  }
}

export const WALLET_STORAGE_KEY = 'solana-predict-wallet';

export function getStoredWalletName(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(WALLET_STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to get stored wallet name:', error);
    return null;
  }
}

export function setStoredWalletName(walletName: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (walletName) {
      localStorage.setItem(WALLET_STORAGE_KEY, walletName);
    } else {
      localStorage.removeItem(WALLET_STORAGE_KEY);
    }
  } catch (error) {
    console.warn('Failed to store wallet name:', error);
  }
}

export function formatWalletAddress(address: string | PublicKey, length: number = 8): string {
  const addressStr = typeof address === 'string' ? address : address.toString();
  if (addressStr.length <= length * 2) return addressStr;
  return `${addressStr.slice(0, length)}...${addressStr.slice(-length)}`;
}

export function isValidPublicKey(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

export async function confirmTransaction(
  connection: Connection,
  signature: string,
  commitment: 'processed' | 'confirmed' | 'finalized' = 'confirmed'
): Promise<boolean> {
  try {
    const confirmation = await connection.confirmTransaction(signature, commitment);
    return !confirmation.value.err;
  } catch (error) {
    console.error('Transaction confirmation failed:', error);
    return false;
  }
}

export function handleWalletError(error: Error): void {
  console.error('Wallet error:', error);
  
  if (error instanceof WalletNotConnectedError) {
    toast.error('Wallet not connected. Please connect your wallet first.');
    return;
  }
  
  if (error instanceof WalletError) {
    toast.error(`Wallet error: ${error.message}`);
    return;
  }
  
  if (error instanceof WalletConnectionError) {
    toast.error(`Connection failed: ${error.message}`);
    return;
  }
  
  if (error instanceof WalletTransactionError) {
    toast.error(`Transaction failed: ${error.message}`);
    return;
  }
  
  // Handle specific error messages
  const errorMessage = error.message.toLowerCase();
  
  if (errorMessage.includes('user rejected')) {
    toast.error('Transaction was rejected by user');
    return;
  }
  
  if (errorMessage.includes('insufficient funds')) {
    toast.error('Insufficient funds for this transaction');
    return;
  }
  
  if (errorMessage.includes('blockhash not found')) {
    toast.error('Transaction expired. Please try again.');
    return;
  }
  
  if (errorMessage.includes('simulation failed')) {
    toast.error('Transaction simulation failed. Please check your inputs.');
    return;
  }
  
  // Generic error fallback
  toast.error('An unexpected error occurred. Please try again.');
}

export async function getWalletBalance(
  connection: Connection,
  publicKey: PublicKey
): Promise<number> {
  try {
    const balance = await connection.getBalance(publicKey);
    return balance / 1e9; // Convert lamports to SOL
  } catch (error) {
    console.error('Failed to get wallet balance:', error);
    throw new Error('Failed to fetch wallet balance');
  }
}

export function createTransactionInstruction(
  programId: PublicKey,
  accounts: Array<{ pubkey: PublicKey; isSigner: boolean; isWritable: boolean }>,
  data: Buffer
) {
  return {
    programId,
    keys: accounts,
    data,
  };
}

export async function sendAndConfirmTransaction(
  connection: Connection,
  transaction: Transaction | VersionedTransaction,
  wallet: WalletContextState,
  options?: {
    skipPreflight?: boolean;
    preflightCommitment?: 'processed' | 'confirmed' | 'finalized';
    maxRetries?: number;
  }
): Promise<string> {
  if (!wallet.connected || !wallet.publicKey) {
    throw new WalletNotConnectedError();
  }

  try {
    const signature = await wallet.sendTransaction(transaction, connection, options);
    
    // Wait for confirmation
    const confirmed = await confirmTransaction(connection, signature, 'confirmed');
    
    if (!confirmed) {
      throw new WalletTransactionError('Transaction failed to confirm');
    }
    
    return signature;
  } catch (error) {
    if (error instanceof Error) {
      throw new WalletTransactionError(error.message, error);
    }
    throw new WalletTransactionError('Unknown transaction error');
  }
}

export const SUPPORTED_WALLETS = [
  'Phantom',
  'Solflare',
  'Backpack',
  'Glow',
  'Slope',
  'Sollet',
  'Torus',
  'Ledger',
  'Solong',
  'MathWallet',
  'TokenPocket',
  'Coin98',
] as const;

export type SupportedWallet = typeof SUPPORTED_WALLETS[number];

export function isSupportedWallet(walletName: string): walletName is SupportedWallet {
  return SUPPORTED_WALLETS.includes(walletName as SupportedWallet);
}

export interface WalletInfo {
  name: string;
  icon: string;
  url: string;
  adapter: string;
}

export const WALLET_INFO: Record<SupportedWallet, WalletInfo> = {
  Phantom: {
    name: 'Phantom',
    icon: '/wallets/phantom.svg',
    url: 'https://phantom.app/',
    adapter: '@solana/wallet-adapter-phantom',
  },
  Solflare: {
    name: 'Solflare',
    icon: '/wallets/solflare.svg',
    url: 'https://solflare.com/',
    adapter: '@solana/wallet-adapter-solflare',
  },
  Backpack: {
    name: 'Backpack',
    icon: '/wallets/backpack.svg',
    url: 'https://backpack.app/',
    adapter: '@solana/wallet-adapter-backpack',
  },
  Glow: {
    name: 'Glow',
    icon: '/wallets/glow.svg',
    url: 'https://glow.app/',
    adapter: '@solana/wallet-adapter-glow',
  },
  Slope: {
    name: 'Slope',
    icon: '/wallets/slope.svg',
    url: 'https://slope.finance/',
    adapter: '@solana/wallet-adapter-slope',
  },
  Sollet: {
    name: 'Sollet',
    icon: '/wallets/sollet.svg',
    url: 'https://www.sollet.io/',
    adapter: '@solana/wallet-adapter-sollet',
  },
  Torus: {
    name: 'Torus',
    icon: '/wallets/torus.svg',
    url: 'https://tor.us/',
    adapter: '@solana/wallet-adapter-torus',
  },
  Ledger: {
    name: 'Ledger',
    icon: '/wallets/ledger.svg',
    url: 'https://www.ledger.com/',
    adapter: '@solana/wallet-adapter-ledger',
  },
  Solong: {
    name: 'Solong',
    icon: '/wallets/solong.svg',
    url: 'https://solongwallet.com/',
    adapter: '@solana/wallet-adapter-solong',
  },
  MathWallet: {
    name: 'MathWallet',
    icon: '/wallets/mathwallet.svg',
    url: 'https://mathwallet.org/',
    adapter: '@solana/wallet-adapter-mathwallet',
  },
  TokenPocket: {
    name: 'TokenPocket',
    icon: '/wallets/tokenpocket.svg',
    url: 'https://www.tokenpocket.pro/',
    adapter: '@solana/wallet-adapter-tokenpocket',
  },
  Coin98: {
    name: 'Coin98',
    icon: '/wallets/coin98.svg',
    url: 'https://coin98.com/',
    adapter: '@solana/wallet-adapter-coin98',
  },
};

export function getWalletInfo(walletName: string): WalletInfo | null {
  if (isSupportedWallet(walletName)) {
    return WALLET_INFO[walletName];
  }
  return null;
}

export async function requestAirdrop(
  connection: Connection,
  publicKey: PublicKey,
  amount: number = 1
): Promise<string> {
  try {
    const signature = await connection.requestAirdrop(
      publicKey,
      amount * 1e9 // Convert SOL to lamports
    );
    
    const confirmed = await confirmTransaction(connection, signature);
    
    if (!confirmed) {
      throw new Error('Airdrop transaction failed to confirm');
    }
    
    return signature;
  } catch (error) {
    console.error('Airdrop failed:', error);
    throw new Error('Failed to request airdrop');
  }
}

export function createWalletAdapter(walletName: SupportedWallet): WalletAdapter | null {
  // This would typically import and instantiate the specific wallet adapter
  // For now, we return null as the actual implementation depends on the specific adapters
  console.warn(`Wallet adapter creation for ${walletName} not implemented`);
  return null;
}
```