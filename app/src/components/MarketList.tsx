```tsx
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { TrendingUp, TrendingDown, Clock, Users, DollarSign, Search, Filter, Calendar, Volume2 } from 'lucide-react'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'

interface Market {
  id: string
  title: string
  description: string
  category: string
  endDate: Date
  totalVolume: number
  totalBets: number
  liquidity: number
  yesPrice: number
  noPrice: number
  yesPercentage: number
  noPercentage: number
  status: 'active' | 'resolved' | 'pending'
  outcome?: 'yes' | 'no'
  createdAt: Date
  tags: string[]
  verified: boolean
}

const mockMarkets: Market[] = [
  {
    id: '1',
    title: 'Will Bitcoin reach $100,000 by end of 2024?',
    description: 'Bitcoin (BTC) will trade at or above $100,000 USD on any major exchange before January 1, 2025.',
    category: 'Crypto',
    endDate: new Date('2024-12-31'),
    totalVolume: 2500000,
    totalBets: 1247,
    liquidity: 450000,
    yesPrice: 0.68,
    noPrice: 0.32,
    yesPercentage: 68,
    noPercentage: 32,
    status: 'active',
    createdAt: new Date('2024-01-15'),
    tags: ['Bitcoin', 'Price', 'Crypto'],
    verified: true
  },
  {
    id: '2',
    title: 'Will Solana SOL outperform Ethereum ETH in 2024?',
    description: 'SOL/USD percentage gain will exceed ETH/USD percentage gain from Jan 1 to Dec 31, 2024.',
    category: 'Crypto',
    endDate: new Date('2024-12-31'),
    totalVolume: 1800000,
    totalBets: 892,
    liquidity: 320000,
    yesPrice: 0.45,
    noPrice: 0.55,
    yesPercentage: 45,
    noPercentage: 55,
    status: 'active',
    createdAt: new Date('2024-02-01'),
    tags: ['Solana', 'Ethereum', 'Performance'],
    verified: true
  },
  {
    id: '3',
    title: 'US Presidential Election 2024 - Democratic Victory',
    description: 'Will the Democratic Party candidate win the 2024 US Presidential Election?',
    category: 'Politics',
    endDate: new Date('2024-11-05'),
    totalVolume: 5200000,
    totalBets: 3421,
    liquidity: 890000,
    yesPrice: 0.52,
    noPrice: 0.48,
    yesPercentage: 52,
    noPercentage: 48,
    status: 'active',
    createdAt: new Date('2024-01-10'),
    tags: ['Politics', 'Election', 'USA'],
    verified: true
  },
  {
    id: '4',
    title: 'Will Tesla stock reach $300 by Q4 2024?',
    description: 'Tesla (TSLA) stock price will trade at or above $300 per share before December 31, 2024.',
    category: 'Stocks',
    endDate: new Date('2024-12-31'),
    totalVolume: 980000,
    totalBets: 567,
    liquidity: 180000,
    yesPrice: 0.34,
    noPrice: 0.66,
    yesPercentage: 34,
    noPercentage: 66,
    status: 'active',
    createdAt: new Date('2024-03-01'),
    tags: ['Tesla', 'Stocks', 'Price'],
    verified: false
  },
  {
    id: '5',
    title: 'AI will achieve AGI breakthrough in 2024',
    description: 'A major AI company will announce achieving Artificial General Intelligence (AGI) in 2024.',
    category: 'Technology',
    endDate: new Date('2024-12-31'),
    totalVolume: 750000,
    totalBets: 423,
    liquidity: 125000,
    yesPrice: 0.15,
    noPrice: 0.85,
    yesPercentage: 15,
    noPercentage: 85,
    status: 'active',
    createdAt: new Date('2024-02-15'),
    tags: ['AI', 'Technology', 'AGI'],
    verified: true
  }
]

export default function MarketList() {
  const { connected, publicKey } = useWallet()
  const { connection } = useConnection()
  const [markets, setMarkets] = useState<Market[]>(mockMarkets)
  const [filteredMarkets, setFilteredMarkets] = useState<Market[]>(mockMarkets)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState('volume')
  const [activeTab, setActiveTab] = useState('all')

  const categories = ['all', 'Crypto', 'Politics', 'Stocks', 'Technology', 'Sports']

  useEffect(() => {
    let filtered = markets

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(market =>
        market.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        market.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        market.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(market => market.category === selectedCategory)
    }

    // Filter by status
    if (activeTab !== 'all') {
      filtered = filtered.filter(market => market.status === activeTab)
    }

    // Sort markets
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'volume':
          return b.totalVolume - a.totalVolume
        case 'bets':
          return b.totalBets - a.totalBets
        case 'liquidity':
          return b.liquidity - a.liquidity
        case 'newest':
          return b.createdAt.getTime() - a.createdAt.getTime()
        case 'ending':
          return a.endDate.getTime() - b.endDate.getTime()
        default:
          return 0
      }
    })

    setFilteredMarkets(filtered)
  }, [markets, searchTerm, selectedCategory, sortBy, activeTab])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date)
  }

  const getDaysUntilEnd = (endDate: Date) => {
    const now = new Date()
    const diffTime = endDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      case 'resolved':
        return 'bg-slate-100 text-slate-800 border-slate-200'
      case 'pending':
        return 'bg-amber-100 text-amber-800 border-amber-200'
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Prediction Markets</h1>
          <p className="text-slate-600 mt-1">Bet on real-world events with decentralized prediction markets</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
            <Volume2 className="w-3 h-3 mr-1" />
            {filteredMarkets.length} Markets
          </Badge>
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">
            Create Market
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <Card className="rounded-xl shadow-sm border-slate-200">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search markets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-40 rounded-xl border-slate-200">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category === 'all' ? 'All Categories' : category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40 rounded-xl border-slate-200">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="volume">Volume</SelectItem>
                  <SelectItem value="bets">Total Bets</SelectItem>
                  <SelectItem value="liquidity">Liquidity</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="ending">Ending Soon</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Market Status Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-96 rounded-xl bg-slate-100">
          <TabsTrigger value="all" className="rounded-xl">All Markets</TabsTrigger>
          <TabsTrigger value="active" className="rounded-xl">Active</TabsTrigger>
          <TabsTrigger value="resolved" className="rounded-xl">Resolved</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <div className="grid gap-6">
            {filteredMarkets.map((market) => (
              <Card key={market.id} className="rounded-xl shadow-sm border-slate-200 hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Market Info */}
                    <div className="flex-1 space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold text-slate-900 line-clamp-2">
                              {market.title}
                            </h3>
                            {market.verified && (
                              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
                                Verified
                              </Badge>
                            )}
                          </div>
                          <p className="text-slate-600 text-sm line-clamp-2 mb-3">
                            {market.description}
                          </p>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {market.category}
                            </Badge>
                            {market.tags.slice(0, 2).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs bg-slate-50">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <Badge className={`${getStatusColor(market.status)} text-xs font-medium`}>
                          {market.status.charAt(0).toUpperCase() + market.status.slice(1)}
                        </Badge>
                      </div>

                      {/* Market Stats */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-slate-500" />
                          <div>
                            <p className="text-xs text-slate-500">Volume</p>
                            <p className="font-semibold text-slate-900">{formatCurrency(market.totalVolume)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-slate-500" />
                          <div>
                            <p className="text-xs text-slate-500">Bets</p>
                            <p className="font-semibold text-slate-900">{market.