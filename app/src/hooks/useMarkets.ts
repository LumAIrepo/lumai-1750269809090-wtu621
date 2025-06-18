```typescript
import { useState, useEffect, useCallback } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { PublicKey, AccountInfo } from '@solana/web3.js'
import { Program, AnchorProvider, web3, BN } from '@coral-xyz/anchor'
import { toast } from 'sonner'

export interface Market {
  publicKey: PublicKey
  title: string
  description: string
  category: string
  endTime: Date
  resolved: boolean
  outcome: boolean | null
  totalVolume: number
  totalLiquidity: number
  yesPrice: number
  noPrice: number
  yesShares: number
  noShares: number
  creator: PublicKey
  resolver: PublicKey
  createdAt: Date
  imageUrl?: string
  tags: string[]
  minBet: number
  maxBet: number
  feePercentage: number
  participants: number
  lastTradeTime: Date | null
  priceHistory: Array<{
    timestamp: Date
    yesPrice: number
    noPrice: number
    volume: number
  }>
}

export interface MarketFilters {
  category?: string
  status?: 'active' | 'resolved' | 'all'
  sortBy?: 'volume' | 'liquidity' | 'endTime' | 'created'
  sortOrder?: 'asc' | 'desc'
  search?: string
  minVolume?: number
  maxEndTime?: Date
}

export interface UseMarketsReturn {
  markets: Market[]
  loading: boolean
  error: string | null
  totalMarkets: number
  hasMore: boolean
  fetchMarkets: (filters?: MarketFilters, page?: number) => Promise<void>
  refreshMarkets: () => Promise<void>
  getMarketById: (id: string) => Market | undefined
  subscribeToMarket: (marketId: string) => () => void
  getMarketsByCategory: (category: string) => Market[]
  getTrendingMarkets: () => Market[]
  getRecentMarkets: () => Market[]
  getUserMarkets: (userPublicKey: PublicKey) => Market[]
}

const MARKETS_PER_PAGE = 20
const PROGRAM_ID = new PublicKey('PredMktProgram11111111111111111111111111111')

export function useMarkets(): UseMarketsReturn {
  const { connection } = useConnection()
  const { publicKey, wallet } = useWallet()
  
  const [markets, setMarkets] = useState<Market[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totalMarkets, setTotalMarkets] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [currentPage, setCurrentPage] = useState(0)
  const [subscriptions, setSubscriptions] = useState<Map<string, number>>(new Map())

  const parseMarketAccount = useCallback((account: AccountInfo<Buffer>, publicKey: PublicKey): Market | null => {
    try {
      const data = account.data
      
      // Parse market data from buffer
      const title = data.subarray(8, 72).toString('utf8').replace(/\0/g, '')
      const description = data.subarray(72, 328).toString('utf8').replace(/\0/g, '')
      const category = data.subarray(328, 360).toString('utf8').replace(/\0/g, '')
      
      const endTime = new Date(data.readBigUInt64LE(360) * 1000)
      const resolved = data.readUInt8(368) === 1
      const outcome = data.readUInt8(369) === 255 ? null : data.readUInt8(369) === 1
      
      const totalVolume = data.readBigUInt64LE(370) / BigInt(1e9)
      const totalLiquidity = data.readBigUInt64LE(378) / BigInt(1e9)
      const yesShares = data.readBigUInt64LE(386) / BigInt(1e9)
      const noShares = data.readBigUInt64LE(394) / BigInt(1e9)
      
      const totalShares = Number(yesShares) + Number(noShares)
      const yesPrice = totalShares > 0 ? Number(yesShares) / totalShares : 0.5
      const noPrice = 1 - yesPrice
      
      const creator = new PublicKey(data.subarray(402, 434))
      const resolver = new PublicKey(data.subarray(434, 466))
      const createdAt = new Date(data.readBigUInt64LE(466) * 1000)
      
      const minBet = data.readBigUInt64LE(474) / BigInt(1e9)
      const maxBet = data.readBigUInt64LE(482) / BigInt(1e9)
      const feePercentage = data.readUInt16LE(490) / 100
      const participants = data.readUInt32LE(492)
      
      const lastTradeTimestamp = data.readBigUInt64LE(496)
      const lastTradeTime = lastTradeTimestamp > 0 ? new Date(Number(lastTradeTimestamp) * 1000) : null
      
      // Parse tags (assuming 5 tags max, 16 bytes each)
      const tags: string[] = []
      for (let i = 0; i < 5; i++) {
        const tagStart = 504 + (i * 16)
        const tag = data.subarray(tagStart, tagStart + 16).toString('utf8').replace(/\0/g, '')
        if (tag) tags.push(tag)
      }
      
      return {
        publicKey,
        title,
        description,
        category,
        endTime,
        resolved,
        outcome,
        totalVolume: Number(totalVolume),
        totalLiquidity: Number(totalLiquidity),
        yesPrice,
        noPrice,
        yesShares: Number(yesShares),
        noShares: Number(noShares),
        creator,
        resolver,
        createdAt,
        tags,
        minBet: Number(minBet),
        maxBet: Number(maxBet),
        feePercentage,
        participants,
        lastTradeTime,
        priceHistory: [] // Will be populated separately
      }
    } catch (err) {
      console.error('Error parsing market account:', err)
      return null
    }
  }, [])

  const fetchMarkets = useCallback(async (filters?: MarketFilters, page: number = 0) => {
    if (loading) return
    
    setLoading(true)
    setError(null)
    
    try {
      // Get all market accounts
      const accounts = await connection.getProgramAccounts(PROGRAM_ID, {
        filters: [
          {
            dataSize: 584 // Expected market account size
          }
        ]
      })
      
      let parsedMarkets = accounts
        .map(({ account, pubkey }) => parseMarketAccount(account, pubkey))
        .filter((market): market is Market => market !== null)
      
      // Apply filters
      if (filters) {
        if (filters.category) {
          parsedMarkets = parsedMarkets.filter(m => 
            m.category.toLowerCase() === filters.category!.toLowerCase()
          )
        }
        
        if (filters.status) {
          if (filters.status === 'active') {
            parsedMarkets = parsedMarkets.filter(m => !m.resolved && m.endTime > new Date())
          } else if (filters.status === 'resolved') {
            parsedMarkets = parsedMarkets.filter(m => m.resolved)
          }
        }
        
        if (filters.search) {
          const searchLower = filters.search.toLowerCase()
          parsedMarkets = parsedMarkets.filter(m =>
            m.title.toLowerCase().includes(searchLower) ||
            m.description.toLowerCase().includes(searchLower) ||
            m.tags.some(tag => tag.toLowerCase().includes(searchLower))
          )
        }
        
        if (filters.minVolume) {
          parsedMarkets = parsedMarkets.filter(m => m.totalVolume >= filters.minVolume!)
        }
        
        if (filters.maxEndTime) {
          parsedMarkets = parsedMarkets.filter(m => m.endTime <= filters.maxEndTime!)
        }
        
        // Sort markets
        const sortBy = filters.sortBy || 'volume'
        const sortOrder = filters.sortOrder || 'desc'
        
        parsedMarkets.sort((a, b) => {
          let comparison = 0
          
          switch (sortBy) {
            case 'volume':
              comparison = a.totalVolume - b.totalVolume
              break
            case 'liquidity':
              comparison = a.totalLiquidity - b.totalLiquidity
              break
            case 'endTime':
              comparison = a.endTime.getTime() - b.endTime.getTime()
              break
            case 'created':
              comparison = a.createdAt.getTime() - b.createdAt.getTime()
              break
          }
          
          return sortOrder === 'desc' ? -comparison : comparison
        })
      }
      
      setTotalMarkets(parsedMarkets.length)
      
      // Pagination
      const startIndex = page * MARKETS_PER_PAGE
      const endIndex = startIndex + MARKETS_PER_PAGE
      const paginatedMarkets = parsedMarkets.slice(startIndex, endIndex)
      
      if (page === 0) {
        setMarkets(paginatedMarkets)
      } else {
        setMarkets(prev => [...prev, ...paginatedMarkets])
      }
      
      setHasMore(endIndex < parsedMarkets.length)
      setCurrentPage(page)
      
    } catch (err) {
      console.error('Error fetching markets:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch markets')
      toast.error('Failed to load markets')
    } finally {
      setLoading(false)
    }
  }, [connection, parseMarketAccount, loading])

  const refreshMarkets = useCallback(async () => {
    setCurrentPage(0)
    await fetchMarkets(undefined, 0)
  }, [fetchMarkets])

  const getMarketById = useCallback((id: string): Market | undefined => {
    return markets.find(market => market.publicKey.toString() === id)
  }, [markets])

  const subscribeToMarket = useCallback((marketId: string) => {
    try {
      const marketPubkey = new PublicKey(marketId)
      
      const subscriptionId = connection.onAccountChange(
        marketPubkey,
        (accountInfo) => {
          const updatedMarket = parseMarketAccount(accountInfo, marketPubkey)
          if (updatedMarket) {
            setMarkets(prev => 
              prev.map(market => 
                market.publicKey.equals(marketPubkey) ? updatedMarket : market
              )
            )
          }
        },
        'confirmed'
      )
      
      setSubscriptions(prev => new Map(prev).set(marketId, subscriptionId))
      
      return () => {
        connection.removeAccountChangeListener(subscriptionId)
        setSubscriptions(prev => {
          const newMap = new Map(prev)
          newMap.delete(marketId)
          return newMap
        })
      }
    } catch (err) {
      console.error('Error subscribing to market:', err)
      return () => {}
    }
  }, [connection, parseMarketAccount])

  const getMarketsByCategory = useCallback((category: string): Market[] => {
    return markets.filter(market => 
      market.category.toLowerCase() === category.toLowerCase()
    )
  }, [markets])

  const getTrendingMarkets = useCallback((): Market[] => {
    return markets
      .filter(market => !market.resolved && market.endTime > new Date())
      .sort((a, b) => {
        // Calculate trending score based on volume, liquidity, and recent activity
        const aScore = a.totalVolume * 0.4 + a.totalLiquidity * 0.3 + 
          (a.lastTradeTime ? (Date.now() - a.lastTradeTime.getTime()) / (1000 * 60 * 60) : 0) * -0.3
        const bScore = b.totalVolume * 0.4 + b.totalLiquidity * 0.3 + 
          (b.lastTradeTime ? (Date.now() - b.lastTradeTime.getTime()) / (1000 * 60 * 60) : 0) * -0.3
        return bScore - aScore
      })
      .slice(0, 10)
  }, [markets])

  const getRecentMarkets = useCallback((): Market[] => {
    return markets
      .filter(market => !market.resolved)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10)
  }, [markets])

  const getUserMarkets = useCallback((userPublicKey: PublicKey): Market[] => {
    return markets.filter(market => market.creator.equals(userPublicKey))
  }, [markets])

  // Initial load
  useEffect(() => {
    fetchMarkets()
  }, [])

  // Cleanup subscriptions on unmount
  useEffect(() => {
    return () => {
      subscriptions.forEach((subscriptionId) => {
        connection.removeAccountChangeListener(subscriptionId)
      })
    }
  }, [connection, subscriptions])

  return {
    markets,
    loading,
    error,
    totalMarkets,
    hasMore,
    fetchMarkets,
    refreshMarkets,
    getMarketById,
    subscribeToMarket,
    getMarketsByCategory,
    getTrendingMarkets,
    getRecentMarkets,
    getUserMarkets
  }
}
```