```tsx
'use client'

import React, { useState, useEffect } from 'react'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TrendingUp, TrendingDown, DollarSign, Users, BarChart3, Droplets, Plus, Minus, Info, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

interface LiquidityPosition {
  id: string
  marketId: string
  marketTitle: string
  outcome: 'YES' | 'NO'
  amount: number
  shares: number
  currentValue: number
  pnl: number
  pnlPercentage: number
  timestamp: number
}

interface MarketLiquidity {
  marketId: string
  marketTitle: string
  totalLiquidity: number
  yesLiquidity: number
  noLiquidity: number
  yesPrice: number
  noPrice: number
  volume24h: number
  apy: number
  fees24h: number
}

export default function LiquidityPool() {
  const { publicKey, connected } = useWallet()
  const { connection } = useConnection()
  const [loading, setLoading] = useState(false)
  const [positions, setPositions] = useState<LiquidityPosition[]>([])
  const [markets, setMarkets] = useState<MarketLiquidity[]>([])
  const [selectedMarket, setSelectedMarket] = useState<string>('')
  const [selectedOutcome, setSelectedOutcome] = useState<'YES' | 'NO'>('YES')
  const [liquidityAmount, setLiquidityAmount] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [totalValue, setTotalValue] = useState(0)
  const [totalPnl, setTotalPnl] = useState(0)
  const [totalFees, setTotalFees] = useState(0)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false)

  useEffect(() => {
    if (connected && publicKey) {
      fetchLiquidityData()
      fetchMarkets()
    }
  }, [connected, publicKey])

  const fetchLiquidityData = async () => {
    try {
      setLoading(true)
      // Mock data - replace with actual Solana program calls
      const mockPositions: LiquidityPosition[] = [
        {
          id: '1',
          marketId: 'market_1',
          marketTitle: 'Will Bitcoin reach $100k by end of 2024?',
          outcome: 'YES',
          amount: 500,
          shares: 1250,
          currentValue: 625,
          pnl: 125,
          pnlPercentage: 25,
          timestamp: Date.now() - 86400000
        },
        {
          id: '2',
          marketId: 'market_2',
          marketTitle: 'Will Ethereum 2.0 launch successfully?',
          outcome: 'NO',
          amount: 300,
          shares: 800,
          currentValue: 280,
          pnl: -20,
          pnlPercentage: -6.67,
          timestamp: Date.now() - 172800000
        }
      ]

      setPositions(mockPositions)
      
      const totalVal = mockPositions.reduce((sum, pos) => sum + pos.currentValue, 0)
      const totalP = mockPositions.reduce((sum, pos) => sum + pos.pnl, 0)
      
      setTotalValue(totalVal)
      setTotalPnl(totalP)
      setTotalFees(45.50) // Mock fees earned
    } catch (error) {
      console.error('Error fetching liquidity data:', error)
      toast.error('Failed to fetch liquidity data')
    } finally {
      setLoading(false)
    }
  }

  const fetchMarkets = async () => {
    try {
      // Mock data - replace with actual Solana program calls
      const mockMarkets: MarketLiquidity[] = [
        {
          marketId: 'market_1',
          marketTitle: 'Will Bitcoin reach $100k by end of 2024?',
          totalLiquidity: 125000,
          yesLiquidity: 75000,
          noLiquidity: 50000,
          yesPrice: 0.65,
          noPrice: 0.35,
          volume24h: 25000,
          apy: 12.5,
          fees24h: 125.50
        },
        {
          marketId: 'market_2',
          marketTitle: 'Will Ethereum 2.0 launch successfully?',
          totalLiquidity: 85000,
          yesLiquidity: 45000,
          noLiquidity: 40000,
          yesPrice: 0.53,
          noPrice: 0.47,
          volume24h: 18000,
          apy: 8.7,
          fees24h: 89.25
        }
      ]

      setMarkets(mockMarkets)
    } catch (error) {
      console.error('Error fetching markets:', error)
      toast.error('Failed to fetch market data')
    }
  }

  const handleAddLiquidity = async () => {
    if (!connected || !publicKey) {
      toast.error('Please connect your wallet')
      return
    }

    if (!selectedMarket || !liquidityAmount) {
      toast.error('Please select a market and enter an amount')
      return
    }

    try {
      setLoading(true)
      
      // Mock transaction - replace with actual Solana program interaction
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast.success('Liquidity added successfully!')
      setShowAddDialog(false)
      setLiquidityAmount('')
      fetchLiquidityData()
    } catch (error) {
      console.error('Error adding liquidity:', error)
      toast.error('Failed to add liquidity')
    } finally {
      setLoading(false)
    }
  }

  const handleWithdrawLiquidity = async (positionId: string) => {
    if (!connected || !publicKey) {
      toast.error('Please connect your wallet')
      return
    }

    try {
      setLoading(true)
      
      // Mock transaction - replace with actual Solana program interaction
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast.success('Liquidity withdrawn successfully!')
      setShowWithdrawDialog(false)
      setWithdrawAmount('')
      fetchLiquidityData()
    } catch (error) {
      console.error('Error withdrawing liquidity:', error)
      toast.error('Failed to withdraw liquidity')
    } finally {
      setLoading(false)
    }
  }

  if (!connected) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg border-0 rounded-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-slate-900">Connect Wallet</CardTitle>
            <CardDescription className="text-slate-600">
              Connect your wallet to manage liquidity positions
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 font-inter">Liquidity Pool</h1>
            <p className="text-slate-600 mt-1">Provide liquidity to prediction markets and earn fees</p>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md">
                <Plus className="w-4 h-4 mr-2" />
                Add Liquidity
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-xl">
              <DialogHeader>
                <DialogTitle className="text-slate-900">Add Liquidity</DialogTitle>
                <DialogDescription className="text-slate-600">
                  Provide liquidity to earn fees from trading activity
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="market" className="text-slate-700">Market</Label>
                  <Select value={selectedMarket} onValueChange={setSelectedMarket}>
                    <SelectTrigger className="rounded-xl border-slate-200">
                      <SelectValue placeholder="Select a market" />
                    </SelectTrigger>
                    <SelectContent>
                      {markets.map((market) => (
                        <SelectItem key={market.marketId} value={market.marketId}>
                          {market.marketTitle}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="outcome" className="text-slate-700">Outcome</Label>
                  <Select value={selectedOutcome} onValueChange={(value: 'YES' | 'NO') => setSelectedOutcome(value)}>
                    <SelectTrigger className="rounded-xl border-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="YES">YES</SelectItem>
                      <SelectItem value="NO">NO</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="amount" className="text-slate-700">Amount (SOL)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    value={liquidityAmount}
                    onChange={(e) => setLiquidityAmount(e.target.value)}
                    className="rounded-xl border-slate-200"
                  />
                </div>
                <Button 
                  onClick={handleAddLiquidity} 
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
                >
                  {loading ? 'Adding...' : 'Add Liquidity'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Portfolio Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="shadow-lg border-0 rounded-xl bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Value</p>
                  <p className="text-2xl font-bold text-slate-900">${totalValue.toFixed(2)}</p>
                </div>
                <div className="p-3 bg-emerald-100 rounded-xl">
                  <DollarSign className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 rounded-xl bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total P&L</p>
                  <p className={`text-2xl font-bold ${totalPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}
                  </p>
                </div>
                <div className={`p-3 rounded-xl ${totalPnl >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                  {totalPnl >= 0 ? 
                    <TrendingUp className="w-6 h-6 text-green-600" /> : 
                    <TrendingDown className="w-6 h-6 text-red-600" />
                  }
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 rounded-xl bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Fees Earned</p>
                  <p className="text-2xl font-bold text-emerald-600">${totalFees.toFixed(2)}</p>
                </div>
                <div className="p-3 bg-amber-100 rounded-xl">
                  <BarChart3 className="w-6 h-6 text-amber-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 rounded-xl bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Active Positions</p>
                  <p className="text-2xl font-bold text-slate-900">{positions.length}</p>
                </div>
                <div className="p-3 bg-slate-100 rounded-xl">
                  <Users className="w-6 h-6 text-slate-700" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="positions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-white shadow-sm rounded-xl border border-slate-200">
            <TabsTrigger value="positions" className="rounded-xl data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              My Positions
            </Tab