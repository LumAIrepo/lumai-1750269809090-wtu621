```typescript
import { useWallet as useSolanaWallet, useConnection } from '@solana/wallet-adapter-react'
import { PublicKey, Connection, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { toast } from 'sonner'

export interface WalletState {
  connected: boolean
  connecting: boolean
  disconnecting: boolean
  publicKey: PublicKey | null
  balance: number | null
  balanceLoading: boolean
  signTransaction: ((transaction: any) => Promise<any>) | undefined
  signAllTransactions: ((transactions: any[]) => Promise<any[]>) | undefined
  signMessage: ((message: Uint8Array) => Promise<Uint8Array>) | undefined
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  sendTransaction: ((transaction: any, connection: Connection, options?: any) => Promise<string>) | undefined
}

export interface UseWalletReturn extends WalletState {
  refreshBalance: () => Promise<void>
  formatBalance: (balance: number | null) => string
  isValidAddress: (address: string) => boolean
  shortenAddress: (address: string | PublicKey | null) => string
}

export const useWallet = (): UseWalletReturn => {
  const {
    wallet,
    publicKey,
    connected,
    connecting,
    disconnecting,
    connect: connectWallet,
    disconnect: disconnectWallet,
    signTransaction,
    signAllTransactions,
    signMessage,
    sendTransaction
  } = useSolanaWallet()
  
  const { connection } = useConnection()
  const [balance, setBalance] = useState<number | null>(null)
  const [balanceLoading, setBalanceLoading] = useState(false)

  const refreshBalance = useCallback(async () => {
    if (!publicKey || !connection) {
      setBalance(null)
      return
    }

    setBalanceLoading(true)
    try {
      const lamports = await connection.getBalance(publicKey)
      setBalance(lamports / LAMPORTS_PER_SOL)
    } catch (error) {
      console.error('Failed to fetch balance:', error)
      toast.error('Failed to fetch wallet balance')
      setBalance(null)
    } finally {
      setBalanceLoading(false)
    }
  }, [publicKey, connection])

  const connect = useCallback(async () => {
    try {
      await connectWallet()
      toast.success('Wallet connected successfully')
    } catch (error: any) {
      console.error('Failed to connect wallet:', error)
      toast.error(error?.message || 'Failed to connect wallet')
      throw error
    }
  }, [connectWallet])

  const disconnect = useCallback(async () => {
    try {
      await disconnectWallet()
      setBalance(null)
      toast.success('Wallet disconnected')
    } catch (error: any) {
      console.error('Failed to disconnect wallet:', error)
      toast.error(error?.message || 'Failed to disconnect wallet')
      throw error
    }
  }, [disconnectWallet])

  const formatBalance = useCallback((balance: number | null): string => {
    if (balance === null) return '--'
    if (balance === 0) return '0 SOL'
    if (balance < 0.001) return '<0.001 SOL'
    return `${balance.toFixed(3)} SOL`
  }, [])

  const isValidAddress = useCallback((address: string): boolean => {
    try {
      new PublicKey(address)
      return true
    } catch {
      return false
    }
  }, [])

  const shortenAddress = useCallback((address: string | PublicKey | null): string => {
    if (!address) return ''
    const addressStr = typeof address === 'string' ? address : address.toString()
    if (addressStr.length <= 8) return addressStr
    return `${addressStr.slice(0, 4)}...${addressStr.slice(-4)}`
  }, [])

  // Auto-refresh balance when wallet connects or publicKey changes
  useEffect(() => {
    if (connected && publicKey) {
      refreshBalance()
    } else {
      setBalance(null)
    }
  }, [connected, publicKey, refreshBalance])

  // Set up balance refresh interval when connected
  useEffect(() => {
    if (!connected || !publicKey) return

    const interval = setInterval(() => {
      refreshBalance()
    }, 30000) // Refresh every 30 seconds

    return () => clearInterval(interval)
  }, [connected, publicKey, refreshBalance])

  // Listen for account changes
  useEffect(() => {
    if (!connection || !publicKey) return

    const subscriptionId = connection.onAccountChange(
      publicKey,
      (accountInfo) => {
        const newBalance = accountInfo.lamports / LAMPORTS_PER_SOL
        setBalance(newBalance)
      },
      'confirmed'
    )

    return () => {
      connection.removeAccountChangeListener(subscriptionId)
    }
  }, [connection, publicKey])

  const walletState: WalletState = useMemo(() => ({
    connected,
    connecting,
    disconnecting,
    publicKey,
    balance,
    balanceLoading,
    signTransaction,
    signAllTransactions,
    signMessage,
    connect,
    disconnect,
    sendTransaction
  }), [
    connected,
    connecting,
    disconnecting,
    publicKey,
    balance,
    balanceLoading,
    signTransaction,
    signAllTransactions,
    signMessage,
    connect,
    disconnect,
    sendTransaction
  ])

  return {
    ...walletState,
    refreshBalance,
    formatBalance,
    isValidAddress,
    shortenAddress
  }
}

export default useWallet
```