```tsx
'use client'

import { useState, useEffect } from 'react'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { TrendingUp, TrendingDown, Clock, DollarSign, Target, History, Trophy, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Position {
  id: string
  marketId: string
  marketTitle: string
  outcome: string
  shares: number
  avgPrice: number
  currentPrice: number
  value: number
  pnl: number
  pnlPercentage: number
  status: 'active' | 'resolved' | 'expired'
  createdAt: Date
  resolvedAt?: Date
  category: string
  volume: number
  liquidity: number
}

interface HistoryItem {
  id: string
  type: 'buy' | 'sell' | 'resolve'
  marketTitle: string
  outcome: string
  shares: number
  price: number
  amount: number
  timestamp: Date
  txHash: string
  status: 'success' | 'pending' | 'failed'
}

interface PortfolioStats {
  totalValue: number
  totalPnl: number
  totalPnlPercentage: number
  activePositions: number
  resolvedPositions: number
  winRate: number
  totalVolume: number
  bestTrade: number
  worstTrade: number
}

export default function Portfolio() {
  const { publicKey, connected } = useWallet()
  const { connection } = useConnection()
  const [positions, setPositions] = useState<Position[]>([])
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [stats, setStats] = useState<PortfolioStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('positions')

  useEffect(() => {
    if (connected && publicKey) {
      fetchPortfolioData()
    }
  }, [connected, publicKey])

  const fetchPortfolioData = async () => {
    try {
      setLoading(true)
      // Mock data - replace with actual Solana program calls
      const mockPositions: Position[] = [
        {
          id: '1',
          marketId: 'market_1',
          marketTitle: 'Will Bitcoin reach $100k by end of 2024?',
          outcome: 'Yes',
          shares: 150,
          avgPrice: 0.65,
          currentPrice: 0.72,
          value: 108,
          pnl: 10.5,
          pnlPercentage: 10.77,
          status: 'active',
          createdAt: new Date('2024-01-15'),
          category: 'Crypto',
          volume: 45000,
          liquidity: 12000
        },
        {
          id: '2',
          marketId: 'market_2',
          marketTitle: 'US Presidential Election 2024 Winner',
          outcome: 'Democratic Candidate',
          shares: 200,
          avgPrice: 0.48,
          currentPrice: 0.52,
          value: 104,
          pnl: 8,
          pnlPercentage: 8.33,
          status: 'active',
          createdAt: new Date('2024-02-01'),
          category: 'Politics',
          volume: 125000,
          liquidity: 35000
        },
        {
          id: '3',
          marketId: 'market_3',
          marketTitle: 'Will Tesla stock hit $300 in Q1 2024?',
          outcome: 'No',
          shares: 100,
          avgPrice: 0.75,
          currentPrice: 0.85,
          value: 85,
          pnl: 10,
          pnlPercentage: 13.33,
          status: 'resolved',
          createdAt: new Date('2024-01-10'),
          resolvedAt: new Date('2024-03-31'),
          category: 'Stocks',
          volume: 28000,
          liquidity: 8500
        }
      ]

      const mockHistory: HistoryItem[] = [
        {
          id: '1',
          type: 'buy',
          marketTitle: 'Will Bitcoin reach $100k by end of 2024?',
          outcome: 'Yes',
          shares: 150,
          price: 0.65,
          amount: 97.5,
          timestamp: new Date('2024-01-15'),
          txHash: '5KJp7z2X9vQ3mR8nF4tY6wE1sA9cB2dH3gL4kM7nP8qR',
          status: 'success'
        },
        {
          id: '2',
          type: 'buy',
          marketTitle: 'US Presidential Election 2024 Winner',
          outcome: 'Democratic Candidate',
          shares: 200,
          price: 0.48,
          amount: 96,
          timestamp: new Date('2024-02-01'),
          txHash: '7MNq9z4Y1vR5oS8pG6uZ8xF3tB0eD4hJ5kL6nM9qP2wT',
          status: 'success'
        },
        {
          id: '3',
          type: 'resolve',
          marketTitle: 'Will Tesla stock hit $300 in Q1 2024?',
          outcome: 'No',
          shares: 100,
          price: 0.85,
          amount: 85,
          timestamp: new Date('2024-03-31'),
          txHash: '3GHj5z8X3vQ7mR2nF9tY4wE6sA1cB8dH7gL2kM5nP4qR',
          status: 'success'
        }
      ]

      const mockStats: PortfolioStats = {
        totalValue: 297,
        totalPnl: 28.5,
        totalPnlPercentage: 10.6,
        activePositions: 2,
        resolvedPositions: 1,
        winRate: 100,
        totalVolume: 278.5,
        bestTrade: 10,
        worstTrade: 0
      }

      setPositions(mockPositions)
      setHistory(mockHistory)
      setStats(mockStats)
    } catch (error) {
      console.error('Error fetching portfolio data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const formatPercentage = (percentage: number) => {
    return `${percentage >= 0 ? '+' : ''}${percentage.toFixed(2)}%`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      case 'resolved':
        return 'bg-slate-100 text-slate-800 border-slate-200'
      case 'expired':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200'
    }
  }

  const getPnlColor = (pnl: number) => {
    return pnl >= 0 ? 'text-emerald-600' : 'text-red-600'
  }

  if (!connected) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg border-0 rounded-xl">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-amber-600" />
            </div>
            <CardTitle className="text-xl font-semibold text-slate-900">Connect Your Wallet</CardTitle>
            <CardDescription className="text-slate-600">
              Please connect your Solana wallet to view your portfolio
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading your portfolio...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Portfolio</h1>
            <p className="text-slate-600">Track your prediction market positions and performance</p>
          </div>
          <Button 
            onClick={fetchPortfolioData}
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-6 py-2 font-medium shadow-sm"
          >
            Refresh Data
          </Button>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="shadow-lg border-0 rounded-xl bg-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">Total Value</p>
                    <p className="text-2xl font-bold text-slate-900">{formatCurrency(stats.totalValue)}</p>
                  </div>
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0 rounded-xl bg-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">Total P&L</p>
                    <p className={cn("text-2xl font-bold", getPnlColor(stats.totalPnl))}>
                      {formatCurrency(stats.totalPnl)}
                    </p>
                    <p className={cn("text-sm", getPnlColor(stats.totalPnl))}>
                      {formatPercentage(stats.totalPnlPercentage)}
                    </p>
                  </div>
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    stats.totalPnl >= 0 ? "bg-emerald-100" : "bg-red-100"
                  )}>
                    {stats.totalPnl >= 0 ? (
                      <TrendingUp className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0 rounded-xl bg-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">Win Rate</p>
                    <p className="text-2xl font-bold text-slate-900">{stats.winRate}%</p>
                    <p className="text-sm text-slate-600">{stats.resolvedPositions} resolved</p>
                  </div>
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0 rounded-xl bg-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">Active Positions</p>
                    <p className="text-2xl font-bold text-slate-900">{stats.activePositions}</p>
                    <p className="text-sm text-slate-600">Total: {positions.length}</p>
                  </div>
                  <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                    <Target className="w-5 h-5 text-slate-700" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content */}
        <Card className="shadow-lg border-0 rounded-xl bg-white">
          <CardHeader className="pb-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-slate-100 rounded-xl p-1">
                <TabsTrigger 
                  value="positions" 
                  className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm font-medium"
                >
                  Positions
                </TabsTrigger>
                <TabsTrigger 
                  value="history" 
                  className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm font-medium"
                >