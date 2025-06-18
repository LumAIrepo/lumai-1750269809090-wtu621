```tsx
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TrendingUp, TrendingDown, Users, DollarSign, Clock, Search, Filter, BarChart3, Activity, Zap } from 'lucide-react'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { PublicKey } from '@solana/web3.js'

interface Market {
  id: string
  title: string
  description: string
  category: string
  endDate: string
  totalVolume: number
  yesPrice: number
  noPrice: number
  yesOdds: number
  noOdds: number
  participants: number
  liquidity: number
  status: 'active' | 'resolved' | 'upcoming'
  outcome?: 'yes' | 'no'
  trending: boolean
}

interface MarketStats {
  totalVolume: number
  activeMarkets: number
  totalUsers: number
  avgReturn: number
}

export default function HomePage() {
  const { connected, publicKey } = useWallet()
  const { connection } = useConnection()
  const [markets, setMarkets] = useState<Market[]>([])
  const [stats, setStats] = useState<MarketStats>({
    totalVolume: 0,
    activeMarkets: 0,
    totalUsers: 0,
    avgReturn: 0
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState('volume')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMarkets()
    fetchStats()
  }, [])

  const fetchMarkets = async () => {
    try {
      // Mock data - replace with actual Solana program calls
      const mockMarkets: Market[] = [
        {
          id: '1',
          title: 'Will Bitcoin reach $100,000 by end of 2024?',
          description: 'Bitcoin price prediction for end of year 2024',
          category: 'Crypto',
          endDate: '2024-12-31',
          totalVolume: 125000,
          yesPrice: 0.65,
          noPrice: 0.35,
          yesOdds: 65,
          noOdds: 35,
          participants: 1250,
          liquidity: 85000,
          status: 'active',
          trending: true
        },
        {
          id: '2',
          title: 'Will Ethereum 2.0 staking rewards exceed 5% APY?',
          description: 'Ethereum staking rewards prediction',
          category: 'Crypto',
          endDate: '2024-06-30',
          totalVolume: 89000,
          yesPrice: 0.72,
          noPrice: 0.28,
          yesOdds: 72,
          noOdds: 28,
          participants: 890,
          liquidity: 62000,
          status: 'active',
          trending: false
        },
        {
          id: '3',
          title: 'Will the Fed cut interest rates in Q2 2024?',
          description: 'Federal Reserve interest rate decision prediction',
          category: 'Economics',
          endDate: '2024-06-30',
          totalVolume: 156000,
          yesPrice: 0.58,
          noPrice: 0.42,
          yesOdds: 58,
          noOdds: 42,
          participants: 2100,
          liquidity: 120000,
          status: 'active',
          trending: true
        },
        {
          id: '4',
          title: 'Will Tesla stock price exceed $300 by Q3 2024?',
          description: 'Tesla stock price prediction',
          category: 'Stocks',
          endDate: '2024-09-30',
          totalVolume: 78000,
          yesPrice: 0.45,
          noPrice: 0.55,
          yesOdds: 45,
          noOdds: 55,
          participants: 650,
          liquidity: 45000,
          status: 'active',
          trending: false
        }
      ]
      setMarkets(mockMarkets)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching markets:', error)
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      // Mock stats - replace with actual program calls
      setStats({
        totalVolume: 2450000,
        activeMarkets: 156,
        totalUsers: 12500,
        avgReturn: 12.5
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const filteredMarkets = markets.filter(market => {
    const matchesSearch = market.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         market.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || market.category.toLowerCase() === selectedCategory.toLowerCase()
    return matchesSearch && matchesCategory
  })

  const sortedMarkets = [...filteredMarkets].sort((a, b) => {
    switch (sortBy) {
      case 'volume':
        return b.totalVolume - a.totalVolume
      case 'participants':
        return b.participants - a.participants
      case 'endDate':
        return new Date(a.endDate).getTime() - new Date(b.endDate).getTime()
      default:
        return 0
    }
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-slate-50 font-inter">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-8 w-8 text-emerald-600" />
                <h1 className="text-2xl font-bold text-slate-900">SolanaPredict</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <WalletMultiButton className="!bg-emerald-600 hover:!bg-emerald-700 !rounded-xl !font-medium" />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white shadow-lg border-0 rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Volume</p>
                  <p className="text-2xl font-bold text-slate-900">{formatCurrency(stats.totalVolume)}</p>
                </div>
                <div className="h-12 w-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg border-0 rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Active Markets</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.activeMarkets}</p>
                </div>
                <div className="h-12 w-12 bg-amber-100 rounded-xl flex items-center justify-center">
                  <Activity className="h-6 w-6 text-amber-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg border-0 rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Users</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.totalUsers.toLocaleString()}</p>
                </div>
                <div className="h-12 w-12 bg-slate-100 rounded-xl flex items-center justify-center">
                  <Users className="h-6 w-6 text-slate-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg border-0 rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Avg Return</p>
                  <p className="text-2xl font-bold text-emerald-600">+{stats.avgReturn}%</p>
                </div>
                <div className="h-12 w-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="bg-white shadow-lg border-0 rounded-xl mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search markets..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-48 rounded-xl border-slate-200">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="crypto">Crypto</SelectItem>
                  <SelectItem value="economics">Economics</SelectItem>
                  <SelectItem value="stocks">Stocks</SelectItem>
                  <SelectItem value="sports">Sports</SelectItem>
                  <SelectItem value="politics">Politics</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-48 rounded-xl border-slate-200">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="volume">Volume</SelectItem>
                  <SelectItem value="participants">Participants</SelectItem>
                  <SelectItem value="endDate">End Date</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Markets Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="bg-white shadow-lg border-0 rounded-xl animate-pulse">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                    <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                    <div className="flex space-x-4">
                      <div className="h-16 bg-slate-200 rounded-xl flex-1"></div>
                      <div className="h-16 bg-slate-200 rounded-xl flex-1"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            sortedMarkets.map((market) => (
              <Card key={market.id} className="bg-white shadow-lg border-0 rounded-xl hover:shadow-xl transition-shadow duration-200">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary" className="bg-slate-100 text-slate-700 rounded-lg">
                          {market.category}
                        </Badge>
                        {market.trending && (
                          <Badge className="bg-amber-100 text-amber-700 rounded-lg">
                            <Zap className="h-3 w-3 mr-1" />
                            Trending
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-lg font-semibold text-slate-900 leading-tight">
                        {market.title}
                      </CardTitle>
                      <CardDescription className="text-slate-600 mt-1">
                        {market.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    {/* Betting Options */}
                    <div