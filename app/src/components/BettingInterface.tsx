```tsx
'use client'

import { useState, useEffect } from 'react'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { AlertCircle, TrendingUp, TrendingDown, Users, DollarSign, Clock, CheckCircle, XCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'

interface Market {
  id: string
  title: string
  description: string
  category: string
  endDate: Date
  totalVolume: number
  totalBets: number
  yesOdds: number
  noOdds: number
  yesPrice: number
  noPrice: number
  liquidity: number
  status: 'active' | 'resolved' | 'closed'
  outcome?: 'yes' | 'no'
  image?: string
}

interface UserPosition {
  marketId: string
  side: 'yes' | 'no'
  amount: number
  shares: number
  avgPrice: number
  currentValue: number
  pnl: number
}

export default function BettingInterface() {
  const { publicKey, connected, signTransaction } = useWallet()
  const { connection } = useConnection()
  
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null)
  const [betAmount, setBetAmount] = useState('')
  const [selectedSide, setSelectedSide] = useState<'yes' | 'no'>('yes')
  const [isPlacingBet, setIsPlacingBet] = useState(false)
  const [userPositions, setUserPositions] = useState<UserPosition[]>([])
  const [balance, setBalance] = useState(0)

  // Mock market data
  const [markets] = useState<Market[]>([
    {
      id: '1',
      title: 'Will Bitcoin reach $100,000 by end of 2024?',
      description: 'Bitcoin price prediction for end of year 2024',
      category: 'Crypto',
      endDate: new Date('2024-12-31'),
      totalVolume: 125000,
      totalBets: 1247,
      yesOdds: 1.65,
      noOdds: 2.35,
      yesPrice: 0.61,
      noPrice: 0.39,
      liquidity: 45000,
      status: 'active'
    },
    {
      id: '2',
      title: 'Will Solana price exceed $300 in 2024?',
      description: 'SOL token price prediction for 2024',
      category: 'Crypto',
      endDate: new Date('2024-12-31'),
      totalVolume: 89000,
      totalBets: 892,
      yesOdds: 2.1,
      noOdds: 1.8,
      yesPrice: 0.48,
      noPrice: 0.52,
      liquidity: 32000,
      status: 'active'
    },
    {
      id: '3',
      title: 'Will the US Federal Reserve cut rates in Q1 2024?',
      description: 'Federal Reserve interest rate decision prediction',
      category: 'Economics',
      endDate: new Date('2024-03-31'),
      totalVolume: 67000,
      totalBets: 543,
      yesOdds: 1.45,
      noOdds: 2.75,
      yesPrice: 0.69,
      noPrice: 0.31,
      liquidity: 28000,
      status: 'resolved',
      outcome: 'no'
    }
  ])

  useEffect(() => {
    if (connected && publicKey) {
      fetchUserBalance()
      fetchUserPositions()
    }
  }, [connected, publicKey])

  const fetchUserBalance = async () => {
    if (!connection || !publicKey) return
    try {
      const balance = await connection.getBalance(publicKey)
      setBalance(balance / LAMPORTS_PER_SOL)
    } catch (error) {
      console.error('Error fetching balance:', error)
    }
  }

  const fetchUserPositions = async () => {
    // Mock user positions
    setUserPositions([
      {
        marketId: '1',
        side: 'yes',
        amount: 100,
        shares: 164,
        avgPrice: 0.61,
        currentValue: 100.16,
        pnl: 0.16
      },
      {
        marketId: '2',
        side: 'no',
        amount: 50,
        shares: 96,
        avgPrice: 0.52,
        currentValue: 49.92,
        pnl: -0.08
      }
    ])
  }

  const handlePlaceBet = async () => {
    if (!connected || !publicKey || !selectedMarket) {
      toast.error('Please connect your wallet first')
      return
    }

    if (!betAmount || parseFloat(betAmount) <= 0) {
      toast.error('Please enter a valid bet amount')
      return
    }

    if (parseFloat(betAmount) > balance) {
      toast.error('Insufficient balance')
      return
    }

    setIsPlacingBet(true)

    try {
      // Mock bet placement - in real implementation, this would interact with Solana program
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast.success(`Bet placed successfully! ${betAmount} SOL on ${selectedSide.toUpperCase()}`)
      setBetAmount('')
      fetchUserBalance()
      fetchUserPositions()
    } catch (error) {
      console.error('Error placing bet:', error)
      toast.error('Failed to place bet. Please try again.')
    } finally {
      setIsPlacingBet(false)
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

  const formatSOL = (amount: number) => {
    return `${amount.toFixed(4)} SOL`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-100 text-emerald-800'
      case 'resolved': return 'bg-slate-100 text-slate-800'
      case 'closed': return 'bg-red-100 text-red-800'
      default: return 'bg-slate-100 text-slate-800'
    }
  }

  const getOutcomeIcon = (outcome?: string) => {
    if (outcome === 'yes') return <CheckCircle className="h-4 w-4 text-emerald-600" />
    if (outcome === 'no') return <XCircle className="h-4 w-4 text-red-600" />
    return null
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Prediction Markets</h1>
            <p className="text-slate-600 mt-1">Bet on real-world events with decentralized markets</p>
          </div>
          {connected && (
            <Card className="rounded-xl shadow-lg border-0">
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm text-slate-600">Wallet Balance</p>
                    <p className="text-lg font-semibold text-slate-900">{formatSOL(balance)}</p>
                  </div>
                  <div className="h-8 w-px bg-slate-200" />
                  <div className="text-right">
                    <p className="text-sm text-slate-600">Connected</p>
                    <p className="text-sm font-medium text-emerald-600">
                      {publicKey?.toString().slice(0, 4)}...{publicKey?.toString().slice(-4)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Markets List */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="rounded-xl shadow-lg border-0">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl text-slate-900">Active Markets</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {markets.map((market) => (
                  <Card 
                    key={market.id}
                    className={`rounded-xl border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
                      selectedMarket?.id === market.id 
                        ? 'border-emerald-600 bg-emerald-50' 
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                    onClick={() => setSelectedMarket(market)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge className={`${getStatusColor(market.status)} rounded-lg`}>
                              {market.status}
                            </Badge>
                            <Badge variant="outline" className="rounded-lg">
                              {market.category}
                            </Badge>
                            {getOutcomeIcon(market.outcome)}
                          </div>
                          <h3 className="font-semibold text-slate-900 mb-1">{market.title}</h3>
                          <p className="text-sm text-slate-600">{market.description}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-emerald-800">YES</span>
                            <TrendingUp className="h-4 w-4 text-emerald-600" />
                          </div>
                          <div className="mt-1">
                            <span className="text-lg font-bold text-emerald-900">{market.yesPrice.toFixed(2)}¢</span>
                            <span className="text-sm text-emerald-700 ml-2">{market.yesOdds.toFixed(2)}x</span>
                          </div>
                        </div>
                        <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-red-800">NO</span>
                            <TrendingDown className="h-4 w-4 text-red-600" />
                          </div>
                          <div className="mt-1">
                            <span className="text-lg font-bold text-red-900">{market.noPrice.toFixed(2)}¢</span>
                            <span className="text-sm text-red-700 ml-2">{market.noOdds.toFixed(2)}x</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm text-slate-600">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-1">
                            <DollarSign className="h-4 w-4" />
                            <span>{formatCurrency(market.totalVolume)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Users className="h-4 w-4" />
                            <span>{market.totalBets}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>{market.endDate.toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-slate-500">Liquidity: {formatCurrency(market.liquidity)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Betting Panel */}
          <div className="space-y-6">
            {selectedMarket ? (
              <Card className="rounded-xl shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="text-lg text-slate-900">Place Bet</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!connected ? (
                    <Alert className="rounded-xl border-amber-200 bg-amber-50">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      <AlertDescription className="text-amber-800">
                        Connect your wallet to place bets
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <>
                      <div>
                        <Label className="text-sm font-medium text-slate-700">Market</Label>
                        <p className="text-sm text-slate-900 mt-1 font-medium">{selectedMarket.title}</p>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-slate-700 mb-2 block">Choose Side</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            variant={selectedSide === 'yes' ? 'default' : 'outline'}
                            className={`rounded-xl h-12 ${
                              selectedSide === 'yes' 
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                                : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                            }`}
                            onClick