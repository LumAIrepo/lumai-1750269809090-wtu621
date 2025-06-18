```tsx
'use client'

import { useState, useEffect } from 'react'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { TrendingUp, TrendingDown, DollarSign, Activity, Clock, Target, BarChart3, PieChart, Calendar, Wallet } from 'lucide-react'

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
  category: string
  endDate: string
  volume: number
  liquidity: number
}

interface PortfolioStats {
  totalValue: number
  totalPnL: number
  totalPnLPercentage: number
  activePositions: number
  resolvedPositions: number
  winRate: number
  totalVolume: number
  bestPerformer: Position | null
  worstPerformer: Position | null
}

export default function PortfolioPage() {
  const { publicKey, connected } = useWallet()
  const { connection } = useConnection()
  const [positions, setPositions] = useState<Position[]>([])
  const [stats, setStats] = useState<PortfolioStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (connected && publicKey) {
      fetchPortfolioData()
    } else {
      setLoading(false)
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
          category: 'Crypto',
          endDate: '2024-12-31',
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
          category: 'Politics',
          endDate: '2024-11-05',
          volume: 125000,
          liquidity: 35000
        },
        {
          id: '3',
          marketId: 'market_3',
          marketTitle: 'Tesla Stock Price Above $300 by Q4 2024',
          outcome: 'No',
          shares: 100,
          avgPrice: 0.35,
          currentPrice: 0.28,
          value: 28,
          pnl: -7,
          pnlPercentage: -20,
          status: 'active',
          category: 'Stocks',
          endDate: '2024-12-31',
          volume: 28000,
          liquidity: 8500
        },
        {
          id: '4',
          marketId: 'market_4',
          marketTitle: 'World Cup 2024 Winner',
          outcome: 'Brazil',
          shares: 75,
          avgPrice: 0.25,
          currentPrice: 0,
          value: 0,
          pnl: -18.75,
          pnlPercentage: -100,
          status: 'resolved',
          category: 'Sports',
          endDate: '2024-07-14',
          volume: 89000,
          liquidity: 0
        }
      ]

      setPositions(mockPositions)

      // Calculate portfolio stats
      const totalValue = mockPositions.reduce((sum, pos) => sum + pos.value, 0)
      const totalPnL = mockPositions.reduce((sum, pos) => sum + pos.pnl, 0)
      const totalInvested = mockPositions.reduce((sum, pos) => sum + (pos.shares * pos.avgPrice), 0)
      const totalPnLPercentage = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0
      const activePositions = mockPositions.filter(pos => pos.status === 'active').length
      const resolvedPositions = mockPositions.filter(pos => pos.status === 'resolved').length
      const winningPositions = mockPositions.filter(pos => pos.pnl > 0).length
      const winRate = mockPositions.length > 0 ? (winningPositions / mockPositions.length) * 100 : 0
      const totalVolume = mockPositions.reduce((sum, pos) => sum + pos.volume, 0)

      const sortedByPnL = [...mockPositions].sort((a, b) => b.pnl - a.pnl)
      const bestPerformer = sortedByPnL[0] || null
      const worstPerformer = sortedByPnL[sortedByPnL.length - 1] || null

      setStats({
        totalValue,
        totalPnL,
        totalPnLPercentage,
        activePositions,
        resolvedPositions,
        winRate,
        totalVolume,
        bestPerformer,
        worstPerformer
      })

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

  if (!connected) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg rounded-xl">
          <CardHeader className="text-center">
            <Wallet className="h-12 w-12 text-emerald-600 mx-auto mb-4" />
            <CardTitle className="text-slate-900 font-inter">Connect Your Wallet</CardTitle>
            <CardDescription className="text-slate-700">
              Connect your Solana wallet to view your prediction market portfolio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">
              Connect Wallet
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-slate-700 font-inter">Loading your portfolio...</p>
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
            <h1 className="text-3xl font-bold text-slate-900 font-inter">Portfolio</h1>
            <p className="text-slate-700 mt-1">Track your prediction market positions and performance</p>
          </div>
          <Button 
            onClick={fetchPortfolioData}
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
          >
            <Activity className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Portfolio Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="shadow-lg rounded-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-700 flex items-center">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Total Value
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900 font-inter">
                  {formatCurrency(stats.totalValue)}
                </div>
                <div className={`text-sm flex items-center mt-1 ${
                  stats.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stats.totalPnL >= 0 ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  {formatPercentage(stats.totalPnLPercentage)}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg rounded-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-700 flex items-center">
                  <Target className="h-4 w-4 mr-2" />
                  Active Positions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900 font-inter">
                  {stats.activePositions}
                </div>
                <div className="text-sm text-slate-600 mt-1">
                  {stats.resolvedPositions} resolved
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg rounded-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-700 flex items-center">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Win Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900 font-inter">
                  {stats.winRate.toFixed(1)}%
                </div>
                <Progress 
                  value={stats.winRate} 
                  className="mt-2 h-2"
                />
              </CardContent>
            </Card>

            <Card className="shadow-lg rounded-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-700 flex items-center">
                  <Activity className="h-4 w-4 mr-2" />
                  Total Volume
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900 font-inter">
                  {formatCurrency(stats.totalVolume)}
                </div>
                <div className="text-sm text-slate-600 mt-1">
                  Across all positions
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white shadow-sm rounded-xl">
            <TabsTrigger value="overview" className="rounded-xl">Overview</TabsTrigger>
            <TabsTrigger value="active" className="rounded-xl">Active Positions</TabsTrigger>
            <TabsTrigger value="history" className="rounded-xl">History</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Performance Summary */}
            {stats && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="shadow-lg rounded-xl">
                  <CardHeader>
                    <CardTitle className="text-slate-900 font-inter flex items-center">
                      <TrendingUp className="h-5 w-5 mr-2 text-emerald-600" />
                      Best Performer
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {stats.bestPerformer ? (
                      <div className="space-y-3">
                        <h4 className="font-medium text-slate-900 line-clamp-2">
                          {stats.bestPerformer.marketTitle}
                        </h4>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-emerald-600 border-emerald-200">
                            {stats.bestPerformer.outcome}
                          </Badge>
                          <div className="text-right">
                            <div className="text-lg font-bold text-green-600">
                              {formatCurrency(stats.bestPerformer.pnl)}
                            </div>
                            <div className="text-sm text-green-600">
                              {formatPercentage(stats.bestPerformer.pnlPercentage)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-slate-600">No positions yet</p>
                    )}
                  </CardContent>
                </Card>

                <Card className="shadow-lg rounded-xl">
                  <CardHeader>
                    <CardTitle className="text-slate-900 font-inter flex items-center">
                      <TrendingDown className="h-5 w-5 mr-2 text-red-600" />
                      Worst Performer
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {stats.worstPerformer ? (
                      <div className="