```tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertCircle, TrendingUp, TrendingDown, Users, DollarSign, Clock, CheckCircle, XCircle, BarChart3, Activity } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

interface Market {
  id: string
  title: string
  description: string
  category: string
  endDate: Date
  totalVolume: number
  totalLiquidity: number
  participantCount: number
  status: 'active' | 'resolved' | 'cancelled'
  resolution: string | null
  outcomes: {
    id: string
    name: string
    probability: number
    price: number
    volume: number
    change24h: number
  }[]
  creator: {
    address: string
    name: string
    avatar?: string
    reputation: number
  }
  resolutionSource: string
  tags: string[]
}

interface Position {
  id: string
  outcome: string
  shares: number
  avgPrice: number
  currentValue: number
  pnl: number
  pnlPercentage: number
}

interface Trade {
  id: string
  user: string
  outcome: string
  type: 'buy' | 'sell'
  shares: number
  price: number
  timestamp: Date
  txHash: string
}

const priceHistoryData = [
  { time: '00:00', yes: 0.65, no: 0.35 },
  { time: '04:00', yes: 0.68, no: 0.32 },
  { time: '08:00', yes: 0.72, no: 0.28 },
  { time: '12:00', yes: 0.69, no: 0.31 },
  { time: '16:00', yes: 0.74, no: 0.26 },
  { time: '20:00', yes: 0.71, no: 0.29 },
  { time: '24:00', yes: 0.73, no: 0.27 }
]

const volumeData = [
  { name: 'Yes', value: 45000, color: '#10b981' },
  { name: 'No', value: 18000, color: '#ef4444' }
]

export default function MarketDetailPage() {
  const params = useParams()
  const { connected, publicKey } = useWallet()
  const { connection } = useConnection()
  const [market, setMarket] = useState<Market | null>(null)
  const [positions, setPositions] = useState<Position[]>([])
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOutcome, setSelectedOutcome] = useState<string>('')
  const [betAmount, setBetAmount] = useState('')
  const [betType, setBetType] = useState<'buy' | 'sell'>('buy')
  const [showBetDialog, setShowBetDialog] = useState(false)

  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        // Mock data - replace with actual Solana program calls
        const mockMarket: Market = {
          id: params.id as string,
          title: 'Will Bitcoin reach $100,000 by end of 2024?',
          description: 'This market resolves to "Yes" if Bitcoin (BTC) reaches or exceeds $100,000 USD on any major exchange (Coinbase, Binance, Kraken) before January 1, 2025, 00:00 UTC.',
          category: 'Cryptocurrency',
          endDate: new Date('2024-12-31'),
          totalVolume: 125000,
          totalLiquidity: 89000,
          participantCount: 1247,
          status: 'active',
          resolution: null,
          outcomes: [
            {
              id: 'yes',
              name: 'Yes',
              probability: 73,
              price: 0.73,
              volume: 91000,
              change24h: 2.1
            },
            {
              id: 'no',
              name: 'No',
              probability: 27,
              price: 0.27,
              volume: 34000,
              change24h: -2.1
            }
          ],
          creator: {
            address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
            name: 'CryptoOracle',
            avatar: '/avatars/oracle.png',
            reputation: 94
          },
          resolutionSource: 'CoinGecko API + Manual Verification',
          tags: ['crypto', 'bitcoin', 'price-prediction']
        }

        const mockPositions: Position[] = [
          {
            id: '1',
            outcome: 'Yes',
            shares: 150,
            avgPrice: 0.68,
            currentValue: 109.5,
            pnl: 7.5,
            pnlPercentage: 7.36
          }
        ]

        const mockTrades: Trade[] = [
          {
            id: '1',
            user: '7xKX...gAsU',
            outcome: 'Yes',
            type: 'buy',
            shares: 50,
            price: 0.74,
            timestamp: new Date(Date.now() - 300000),
            txHash: '5KJp4XK...'
          },
          {
            id: '2',
            user: '9mNq...kLpR',
            outcome: 'No',
            type: 'sell',
            shares: 25,
            price: 0.26,
            timestamp: new Date(Date.now() - 600000),
            txHash: '8Rq2mX...'
          }
        ]

        setMarket(mockMarket)
        setPositions(mockPositions)
        setTrades(mockTrades)
      } catch (error) {
        console.error('Error fetching market data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMarketData()
  }, [params.id])

  const handlePlaceBet = async () => {
    if (!connected || !publicKey || !market) return

    try {
      // Implement actual betting logic with Solana program
      console.log('Placing bet:', {
        outcome: selectedOutcome,
        amount: betAmount,
        type: betType
      })
      
      setShowBetDialog(false)
      setBetAmount('')
    } catch (error) {
      console.error('Error placing bet:', error)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-100 text-emerald-800'
      case 'resolved': return 'bg-slate-100 text-slate-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-slate-100 text-slate-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  if (!market) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Market Not Found</h2>
          <p className="text-slate-600">The requested market could not be found.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 font-inter">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Badge className={getStatusColor(market.status)}>
                  {market.status.charAt(0).toUpperCase() + market.status.slice(1)}
                </Badge>
                <Badge variant="outline" className="text-slate-600">
                  {market.category}
                </Badge>
              </div>
              <h1 className="text-3xl font-bold text-slate-900 mb-3">{market.title}</h1>
              <p className="text-slate-600 text-lg leading-relaxed max-w-4xl">{market.description}</p>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="rounded-xl shadow-sm border-slate-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <DollarSign className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Total Volume</p>
                    <p className="text-xl font-bold text-slate-900">{formatCurrency(market.totalVolume)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-xl shadow-sm border-slate-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Activity className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Liquidity</p>
                    <p className="text-xl font-bold text-slate-900">{formatCurrency(market.totalLiquidity)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-xl shadow-sm border-slate-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    <Users className="h-5 w-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Participants</p>
                    <p className="text-xl font-bold text-slate-900">{market.participantCount.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-xl shadow-sm border-slate-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Clock className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Ends</p>
                    <p className="text-xl font-bold text-slate-900">
                      {market.endDate.toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Outcomes */}
            <Card className="rounded-xl shadow-sm border-slate-200">
              <CardHeader>
                <CardTitle className="text-slate-900">Market Outcomes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {market.outcomes.map((outcome) => (
                  <div key={outcome.id} className="p-4 border border-slate-200 rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-slate-900">{outcome.name}</h3>
                        <Badge variant={outcome.change24h > 0 ? "default" : "destructive"} className="text-xs">
                          {outcome.change24h > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                          {formatPercentage(outcome.change24h)}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-slate-900">${outcome.price.toFixed(2)}</p>
                        <p className="text-sm text-slate-600">{outcome.probability}% chance</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-slate-600">Volume: {formatCurrency(outcome.volume)}</span>
                      <Progress value={outcome.probability} className="w-32 h-2" />
                    </div>