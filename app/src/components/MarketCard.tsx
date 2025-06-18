```tsx
'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { TrendingUp, TrendingDown, Users, DollarSign, Clock, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MarketCardProps {
  market: {
    id: string
    title: string
    description: string
    category: string
    endDate: Date
    totalVolume: number
    totalLiquidity: number
    participantCount: number
    outcomes: Array<{
      id: string
      name: string
      odds: number
      probability: number
      isWinning?: boolean
    }>
    status: 'active' | 'resolved' | 'upcoming'
    imageUrl?: string
    tags: string[]
    createdBy: string
    resolutionSource: string
  }
  onBetClick?: (marketId: string, outcomeId: string) => void
  onViewDetails?: (marketId: string) => void
  className?: string
}

export default function MarketCard({ market, onBetClick, onViewDetails, className }: MarketCardProps) {
  const [selectedOutcome, setSelectedOutcome] = useState<string | null>(null)

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`
    }
    return `$${amount.toFixed(2)}`
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      case 'resolved':
        return 'bg-slate-100 text-slate-800 border-slate-200'
      case 'upcoming':
        return 'bg-amber-100 text-amber-800 border-amber-200'
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200'
    }
  }

  const getTimeRemaining = () => {
    const now = new Date()
    const diff = market.endDate.getTime() - now.getTime()
    
    if (diff <= 0) return 'Ended'
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    
    if (days > 0) return `${days}d ${hours}h`
    return `${hours}h`
  }

  const primaryOutcome = market.outcomes[0]
  const secondaryOutcome = market.outcomes[1]

  return (
    <Card className={cn(
      'group hover:shadow-lg transition-all duration-300 border-slate-200 bg-white',
      'hover:border-emerald-200 hover:-translate-y-1',
      className
    )}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className={getStatusColor(market.status)}>
                {market.status.charAt(0).toUpperCase() + market.status.slice(1)}
              </Badge>
              <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                {market.category}
              </Badge>
            </div>
            <CardTitle className="text-lg font-semibold text-slate-900 leading-tight mb-2 group-hover:text-emerald-700 transition-colors">
              {market.title}
            </CardTitle>
            <p className="text-sm text-slate-600 line-clamp-2">
              {market.description}
            </p>
          </div>
          {market.imageUrl && (
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
              <img 
                src={market.imageUrl} 
                alt={market.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Outcomes Section */}
        <div className="space-y-3">
          {market.outcomes.slice(0, 2).map((outcome, index) => (
            <div 
              key={outcome.id}
              className={cn(
                'flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer',
                selectedOutcome === outcome.id 
                  ? 'border-emerald-300 bg-emerald-50' 
                  : 'border-slate-200 hover:border-slate-300 bg-slate-50',
                outcome.isWinning && 'border-emerald-400 bg-emerald-100'
              )}
              onClick={() => setSelectedOutcome(outcome.id)}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-2 h-2 rounded-full',
                  index === 0 ? 'bg-emerald-500' : 'bg-red-500'
                )}>
                </div>
                <span className="font-medium text-slate-900">{outcome.name}</span>
                {outcome.isWinning && (
                  <Badge className="bg-emerald-600 text-white text-xs">
                    Winner
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-sm font-semibold text-slate-900">
                    {outcome.odds > 0 ? '+' : ''}{outcome.odds}
                  </div>
                  <div className="text-xs text-slate-500">
                    {(outcome.probability * 100).toFixed(1)}%
                  </div>
                </div>
                {outcome.probability > 0.5 ? (
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500" />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Market Stats */}
        <div className="grid grid-cols-3 gap-4 pt-2">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <DollarSign className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-medium text-slate-500">Volume</span>
            </div>
            <div className="text-sm font-semibold text-slate-900">
              {formatCurrency(market.totalVolume)}
            </div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Users className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-medium text-slate-500">Traders</span>
            </div>
            <div className="text-sm font-semibold text-slate-900">
              {market.participantCount.toLocaleString()}
            </div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Clock className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-medium text-slate-500">Ends</span>
            </div>
            <div className="text-sm font-semibold text-slate-900">
              {getTimeRemaining()}
            </div>
          </div>
        </div>

        {/* Liquidity Progress */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-slate-500">Liquidity</span>
            <span className="text-xs font-semibold text-slate-700">
              {formatCurrency(market.totalLiquidity)}
            </span>
          </div>
          <Progress 
            value={Math.min((market.totalLiquidity / 100000) * 100, 100)} 
            className="h-2 bg-slate-200"
          />
        </div>

        <Separator className="my-4" />

        {/* Action Buttons */}
        <div className="flex gap-2">
          {market.status === 'active' && selectedOutcome && (
            <Button
              onClick={() => onBetClick?.(market.id, selectedOutcome)}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl"
            >
              Place Bet
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => onViewDetails?.(market.id)}
            className={cn(
              'border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl',
              !selectedOutcome && market.status === 'active' ? 'flex-1' : 'flex-shrink-0'
            )}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Details
          </Button>
        </div>

        {/* Tags */}
        {market.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-2">
            {market.tags.slice(0, 3).map((tag) => (
              <Badge 
                key={tag} 
                variant="secondary" 
                className="text-xs bg-slate-100 text-slate-600 hover:bg-slate-200"
              >
                {tag}
              </Badge>
            ))}
            {market.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-600">
                +{market.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Resolution Source */}
        <div className="text-xs text-slate-500 pt-1">
          Resolved by: {market.resolutionSource}
        </div>
      </CardContent>
    </Card>
  )
}
```