```tsx
'use client'

import { useState, useEffect } from 'react'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { WalletMultiButton, WalletDisconnectButton } from '@solana/wallet-adapter-react-ui'
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Wallet, Copy, Check, ExternalLink, TrendingUp, DollarSign } from 'lucide-react'
import { cn } from '@/lib/utils'

interface WalletConnectProps {
  className?: string
}

export default function WalletConnect({ className }: WalletConnectProps) {
  const { publicKey, connected, connecting, disconnect } = useWallet()
  const { connection } = useConnection()
  const [balance, setBalance] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (connected && publicKey) {
      fetchBalance()
    } else {
      setBalance(null)
    }
  }, [connected, publicKey, connection])

  const fetchBalance = async () => {
    if (!publicKey) return
    
    try {
      setLoading(true)
      const balance = await connection.getBalance(publicKey)
      setBalance(balance / LAMPORTS_PER_SOL)
    } catch (error) {
      console.error('Error fetching balance:', error)
      setBalance(null)
    } finally {
      setLoading(false)
    }
  }

  const copyAddress = async () => {
    if (!publicKey) return
    
    try {
      await navigator.clipboard.writeText(publicKey.toString())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy address:', error)
    }
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`
  }

  const openInExplorer = () => {
    if (!publicKey) return
    window.open(`https://explorer.solana.com/address/${publicKey.toString()}`, '_blank')
  }

  if (!connected) {
    return (
      <Card className={cn("w-full max-w-md mx-auto shadow-lg border-slate-200", className)}>
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
            <Wallet className="w-8 h-8 text-emerald-600" />
          </div>
          <CardTitle className="text-xl font-semibold text-slate-900">
            Connect Your Wallet
          </CardTitle>
          <CardDescription className="text-slate-600">
            Connect your Solana wallet to start trading on prediction markets
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-3 text-sm text-slate-600">
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              <span>Secure wallet connection</span>
            </div>
            <div className="flex items-center space-x-3 text-sm text-slate-600">
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              <span>Access prediction markets</span>
            </div>
            <div className="flex items-center space-x-3 text-sm text-slate-600">
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              <span>Track your positions</span>
            </div>
          </div>
          
          <Separator className="my-4" />
          
          <div className="wallet-adapter-button-trigger">
            <WalletMultiButton className="!bg-emerald-600 hover:!bg-emerald-700 !rounded-xl !font-medium !text-white !border-0 !h-12 !w-full !transition-colors" />
          </div>
          
          {connecting && (
            <div className="text-center text-sm text-slate-600">
              Connecting wallet...
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("w-full max-w-md mx-auto shadow-lg border-slate-200", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
              <Wallet className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900">
                Wallet Connected
              </CardTitle>
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                Active
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Wallet Address */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Wallet Address</label>
          <div className="flex items-center space-x-2 p-3 bg-slate-50 rounded-xl border">
            <code className="flex-1 text-sm font-mono text-slate-900">
              {publicKey ? formatAddress(publicKey.toString()) : ''}
            </code>
            <Button
              variant="ghost"
              size="sm"
              onClick={copyAddress}
              className="h-8 w-8 p-0 hover:bg-slate-200"
            >
              {copied ? (
                <Check className="w-4 h-4 text-emerald-600" />
              ) : (
                <Copy className="w-4 h-4 text-slate-600" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={openInExplorer}
              className="h-8 w-8 p-0 hover:bg-slate-200"
            >
              <ExternalLink className="w-4 h-4 text-slate-600" />
            </Button>
          </div>
        </div>

        {/* Balance */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">SOL Balance</label>
          <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl border">
            <DollarSign className="w-5 h-5 text-slate-600" />
            <div className="flex-1">
              {loading ? (
                <div className="h-6 bg-slate-200 rounded animate-pulse"></div>
              ) : balance !== null ? (
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-semibold text-slate-900">
                    {balance.toFixed(4)}
                  </span>
                  <span className="text-sm text-slate-600">SOL</span>
                </div>
              ) : (
                <span className="text-sm text-slate-500">Unable to fetch balance</span>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchBalance}
              disabled={loading}
              className="h-8 px-3 hover:bg-slate-200"
            >
              <TrendingUp className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <Separator className="my-4" />

        {/* Actions */}
        <div className="space-y-3">
          <Button
            onClick={() => window.location.href = '/markets'}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-11 font-medium"
          >
            Browse Markets
          </Button>
          
          <WalletDisconnectButton className="!bg-slate-100 hover:!bg-slate-200 !text-slate-700 !rounded-xl !font-medium !border-0 !h-11 !w-full !transition-colors" />
        </div>

        {/* Network Status */}
        <div className="pt-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Network</span>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              <span>Solana Mainnet</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
```