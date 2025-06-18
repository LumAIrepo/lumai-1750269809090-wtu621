```tsx
'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart, 
  Activity, 
  DollarSign,
  Users,
  Volume2,
  Clock,
  Target,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'

interface MarketData {
  id: string
  title: string
  category: string
  totalVolume: number
  totalBets: number
  yesPrice: number
  noPrice: number
  liquidity: number
  participants: number
  timeRemaining: string
  trend: 'up' | 'down' | 'stable'
  priceHistory: { timestamp: number; price: number }[]
  volumeHistory: { timestamp: number; volume: number }[]
}

interface AnalyticsData {
  totalVolume: number
  totalMarkets: number
  activeUsers: number
  avgLiquidity: number
  topCategories: { name: string; volume: number; percentage: number }[]
  recentActivity: { type: string; market: string; amount: number; timestamp: number }[]
  marketPerformance: MarketData[]
}

export default function MarketAnalytics() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [selectedTimeframe, setSelectedTimeframe] = useState<'24h' | '7d' | '30d'>('24h')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true)
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        const mockData: AnalyticsData = {
          totalVolume: 2847392.50,
          totalMarkets: 156,
          activeUsers: 8924,
          avgLiquidity: 18234.67,
          topCategories: [
            { name: 'Politics', volume: 1247832.10, percentage: 43.8 },
            { name: 'Sports', volume: 892341.25, percentage: 31.3 },
            { name: 'Crypto', volume: 456789.30, percentage: 16.0 },
            { name: 'Entertainment', volume: 250429.85, percentage: 8.9 }
          ],
          recentActivity: [
            { type: 'bet', market: '2024 Presidential Election', amount: 5000, timestamp: Date.now() - 300000 },
            { type: 'bet', market: 'Bitcoin $100k by EOY', amount: 2500, timestamp: Date.now() - 600000 },
            { type: 'market_created', market: 'Tesla Stock Price', amount: 0, timestamp: Date.now() - 900000 },
            { type: 'bet', market: 'Super Bowl Winner', amount: 1200, timestamp: Date.now() - 1200000 }
          ],
          marketPerformance: [
            {
              id: '1',
              title: '2024 Presidential Election',
              category: 'Politics',
              totalVolume: 456789.30,
              totalBets: 2847,
              yesPrice: 0.62,
              noPrice: 0.38,
              liquidity: 89234.50,
              participants: 1247,
              timeRemaining: '127 days',
              trend: 'up',
              priceHistory: Array.from({ length: 24 }, (_, i) => ({
                timestamp: Date.now() - (23 - i) * 3600000,
                price: 0.58 + Math.random() * 0.08
              })),
              volumeHistory: Array.from({ length: 24 }, (_, i) => ({
                timestamp: Date.now() - (23 - i) * 3600000,
                volume: 15000 + Math.random() * 10000
              }))
            },
            {
              id: '2',
              title: 'Bitcoin reaches $100k by EOY',
              category: 'Crypto',
              totalVolume: 234567.80,
              totalBets: 1523,
              yesPrice: 0.34,
              noPrice: 0.66,
              liquidity: 45678.90,
              participants: 892,
              timeRemaining: '45 days',
              trend: 'down',
              priceHistory: Array.from({ length: 24 }, (_, i) => ({
                timestamp: Date.now() - (23 - i) * 3600000,
                price: 0.38 - Math.random() * 0.08
              })),
              volumeHistory: Array.from({ length: 24 }, (_, i) => ({
                timestamp: Date.now() - (23 - i) * 3600000,
                volume: 8000 + Math.random() * 6000
              }))
            }
          ]
        }
        
        setAnalyticsData(mockData)
      } catch (error) {
        console.error('Failed to fetch analytics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [selectedTimeframe])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num)
  }

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <ArrowUpRight className="h-4 w-4 text-emerald-600" />
      case 'down':
        return <ArrowDownRight className="h-4 w-4 text-red-500" />
      default:
        return <Activity className="h-4 w-4 text-slate-500" />
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="shadow-lg border-0 bg-white">
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-slate-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!analyticsData) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500">Failed to load analytics data</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Market Analytics</h1>
          <p className="text-slate-600 mt-1">Comprehensive market insights and performance metrics</p>
        </div>
        <div className="flex gap-2">
          {(['24h', '7d', '30d'] as const).map((timeframe) => (
            <Button
              key={timeframe}
              variant={selectedTimeframe === timeframe ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedTimeframe(timeframe)}
              className={selectedTimeframe === timeframe 
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                : 'border-slate-300 text-slate-700 hover:bg-slate-50'
              }
            >
              {timeframe}
            </Button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-lg border-0 bg-white rounded-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Volume</p>
                <p className="text-2xl font-bold text-slate-900">{formatCurrency(analyticsData.totalVolume)}</p>
              </div>
              <div className="h-12 w-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
            <div className="flex items-center mt-4">
              <ArrowUpRight className="h-4 w-4 text-emerald-600 mr-1" />
              <span className="text-sm text-emerald-600 font-medium">+12.5%</span>
              <span className="text-sm text-slate-500 ml-2">vs last period</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 bg-white rounded-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Active Markets</p>
                <p className="text-2xl font-bold text-slate-900">{formatNumber(analyticsData.totalMarkets)}</p>
              </div>
              <div className="h-12 w-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <Target className="h-6 w-6 text-amber-500" />
              </div>
            </div>
            <div className="flex items-center mt-4">
              <ArrowUpRight className="h-4 w-4 text-emerald-600 mr-1" />
              <span className="text-sm text-emerald-600 font-medium">+8.2%</span>
              <span className="text-sm text-slate-500 ml-2">vs last period</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 bg-white rounded-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Active Users</p>
                <p className="text-2xl font-bold text-slate-900">{formatNumber(analyticsData.activeUsers)}</p>
              </div>
              <div className="h-12 w-12 bg-slate-100 rounded-xl flex items-center justify-center">
                <Users className="h-6 w-6 text-slate-700" />
              </div>
            </div>
            <div className="flex items-center mt-4">
              <ArrowUpRight className="h-4 w-4 text-emerald-600 mr-1" />
              <span className="text-sm text-emerald-600 font-medium">+15.7%</span>
              <span className="text-sm text-slate-500 ml-2">vs last period</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 bg-white rounded-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Avg Liquidity</p>
                <p className="text-2xl font-bold text-slate-900">{formatCurrency(analyticsData.avgLiquidity)}</p>
              </div>
              <div className="h-12 w-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <Volume2 className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
            <div className="flex items-center mt-4">
              <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
              <span className="text-sm text-red-500 font-medium">-3.1%</span>
              <span className="text-sm text-slate-500 ml-2">vs last period</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Distribution */}
        <Card className="shadow-lg border-0 bg-white rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <PieChart className="h-5 w-5 text-emerald-600" />
              Category Distribution
            </CardTitle>
            <CardDescription>Volume by market category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData.topCategories.map((category, index) => (
                <div key={category.name} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-700">{category.name}</span>
                    <span className="text-sm text-slate-600">{category.percentage}%</span>
                  </div>
                  <Progress 
                    value={category.percentage} 
                    className="h-2"
                  />
                  <div className="text-xs text-slate-500">
                    {formatCurrency(category.volume)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="shadow-lg border-0 bg-white rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <Activity className="h-5 w-5 text-emerald-600" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest market interactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">