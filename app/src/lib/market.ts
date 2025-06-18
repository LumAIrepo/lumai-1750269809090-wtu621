```typescript
import { Connection, PublicKey, AccountInfo, ParsedAccountData } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';

export interface MarketData {
  id: string;
  title: string;
  description: string;
  category: string;
  endDate: Date;
  totalVolume: number;
  totalLiquidity: number;
  outcomes: MarketOutcome[];
  status: MarketStatus;
  creator: string;
  resolutionSource: string;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  imageUrl?: string;
  isActive: boolean;
  minBetAmount: number;
  maxBetAmount: number;
  feePercentage: number;
}

export interface MarketOutcome {
  id: string;
  title: string;
  odds: number;
  probability: number;
  totalBets: number;
  totalVolume: number;
  isWinning?: boolean;
  color: string;
}

export interface UserPosition {
  marketId: string;
  outcomeId: string;
  amount: number;
  odds: number;
  timestamp: Date;
  status: 'active' | 'won' | 'lost' | 'pending';
  potentialPayout: number;
}

export interface MarketStats {
  totalMarkets: number;
  activeMarkets: number;
  totalVolume: number;
  totalUsers: number;
  averageOdds: number;
  popularCategories: CategoryStats[];
}

export interface CategoryStats {
  category: string;
  count: number;
  volume: number;
}

export enum MarketStatus {
  ACTIVE = 'active',
  CLOSED = 'closed',
  RESOLVED = 'resolved',
  CANCELLED = 'cancelled',
  PENDING = 'pending'
}

export enum MarketCategory {
  POLITICS = 'politics',
  SPORTS = 'sports',
  CRYPTO = 'crypto',
  ENTERTAINMENT = 'entertainment',
  SCIENCE = 'science',
  ECONOMICS = 'economics',
  WEATHER = 'weather',
  OTHER = 'other'
}

export class MarketService {
  private connection: Connection;
  private programId: PublicKey;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheTimeout = 30000; // 30 seconds

  constructor(connection: Connection, programId: string) {
    this.connection = connection;
    this.programId = new PublicKey(programId);
  }

  private isCacheValid(key: string): boolean {
    const cached = this.cache.get(key);
    if (!cached) return false;
    return Date.now() - cached.timestamp < this.cacheTimeout;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  private getCache(key: string): any {
    const cached = this.cache.get(key);
    return cached ? cached.data : null;
  }

  async getAllMarkets(filters?: {
    category?: MarketCategory;
    status?: MarketStatus;
    sortBy?: 'volume' | 'endDate' | 'created' | 'liquidity';
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
  }): Promise<MarketData[]> {
    const cacheKey = `markets_${JSON.stringify(filters)}`;
    
    if (this.isCacheValid(cacheKey)) {
      return this.getCache(cacheKey);
    }

    try {
      const accounts = await this.connection.getProgramAccounts(this.programId, {
        filters: [
          {
            memcmp: {
              offset: 0,
              bytes: 'market'
            }
          }
        ]
      });

      let markets = await Promise.all(
        accounts.map(async (account) => {
          return this.parseMarketAccount(account.account, account.pubkey.toString());
        })
      );

      // Apply filters
      if (filters?.category) {
        markets = markets.filter(m => m.category === filters.category);
      }

      if (filters?.status) {
        markets = markets.filter(m => m.status === filters.status);
      }

      // Sort markets
      if (filters?.sortBy) {
        markets.sort((a, b) => {
          let aValue: any, bValue: any;
          
          switch (filters.sortBy) {
            case 'volume':
              aValue = a.totalVolume;
              bValue = b.totalVolume;
              break;
            case 'endDate':
              aValue = a.endDate.getTime();
              bValue = b.endDate.getTime();
              break;
            case 'created':
              aValue = a.createdAt.getTime();
              bValue = b.createdAt.getTime();
              break;
            case 'liquidity':
              aValue = a.totalLiquidity;
              bValue = b.totalLiquidity;
              break;
            default:
              return 0;
          }

          const order = filters.sortOrder === 'desc' ? -1 : 1;
          return aValue > bValue ? order : aValue < bValue ? -order : 0;
        });
      }

      // Apply pagination
      if (filters?.offset || filters?.limit) {
        const start = filters.offset || 0;
        const end = filters.limit ? start + filters.limit : undefined;
        markets = markets.slice(start, end);
      }

      this.setCache(cacheKey, markets);
      return markets;
    } catch (error) {
      console.error('Error fetching markets:', error);
      throw new Error('Failed to fetch markets');
    }
  }

  async getMarketById(marketId: string): Promise<MarketData | null> {
    const cacheKey = `market_${marketId}`;
    
    if (this.isCacheValid(cacheKey)) {
      return this.getCache(cacheKey);
    }

    try {
      const marketPubkey = new PublicKey(marketId);
      const accountInfo = await this.connection.getAccountInfo(marketPubkey);
      
      if (!accountInfo) {
        return null;
      }

      const market = this.parseMarketAccount(accountInfo, marketId);
      this.setCache(cacheKey, market);
      return market;
    } catch (error) {
      console.error('Error fetching market:', error);
      return null;
    }
  }

  async getUserPositions(userPublicKey: string): Promise<UserPosition[]> {
    const cacheKey = `positions_${userPublicKey}`;
    
    if (this.isCacheValid(cacheKey)) {
      return this.getCache(cacheKey);
    }

    try {
      const userPubkey = new PublicKey(userPublicKey);
      const accounts = await this.connection.getProgramAccounts(this.programId, {
        filters: [
          {
            memcmp: {
              offset: 8,
              bytes: userPubkey.toBase58()
            }
          }
        ]
      });

      const positions = accounts.map(account => {
        return this.parsePositionAccount(account.account);
      });

      this.setCache(cacheKey, positions);
      return positions;
    } catch (error) {
      console.error('Error fetching user positions:', error);
      throw new Error('Failed to fetch user positions');
    }
  }

  async getMarketStats(): Promise<MarketStats> {
    const cacheKey = 'market_stats';
    
    if (this.isCacheValid(cacheKey)) {
      return this.getCache(cacheKey);
    }

    try {
      const markets = await this.getAllMarkets();
      
      const stats: MarketStats = {
        totalMarkets: markets.length,
        activeMarkets: markets.filter(m => m.status === MarketStatus.ACTIVE).length,
        totalVolume: markets.reduce((sum, m) => sum + m.totalVolume, 0),
        totalUsers: await this.getTotalUsers(),
        averageOdds: this.calculateAverageOdds(markets),
        popularCategories: this.calculateCategoryStats(markets)
      };

      this.setCache(cacheKey, stats);
      return stats;
    } catch (error) {
      console.error('Error fetching market stats:', error);
      throw new Error('Failed to fetch market stats');
    }
  }

  async getTrendingMarkets(limit: number = 10): Promise<MarketData[]> {
    const cacheKey = `trending_${limit}`;
    
    if (this.isCacheValid(cacheKey)) {
      return this.getCache(cacheKey);
    }

    try {
      const markets = await this.getAllMarkets({
        status: MarketStatus.ACTIVE,
        sortBy: 'volume',
        sortOrder: 'desc',
        limit
      });

      this.setCache(cacheKey, markets);
      return markets;
    } catch (error) {
      console.error('Error fetching trending markets:', error);
      throw new Error('Failed to fetch trending markets');
    }
  }

  async getMarketsByCategory(category: MarketCategory, limit?: number): Promise<MarketData[]> {
    return this.getAllMarkets({
      category,
      status: MarketStatus.ACTIVE,
      sortBy: 'volume',
      sortOrder: 'desc',
      limit
    });
  }

  async searchMarkets(query: string, filters?: {
    category?: MarketCategory;
    status?: MarketStatus;
  }): Promise<MarketData[]> {
    try {
      const markets = await this.getAllMarkets(filters);
      
      const searchTerms = query.toLowerCase().split(' ');
      
      return markets.filter(market => {
        const searchableText = `${market.title} ${market.description} ${market.tags.join(' ')}`.toLowerCase();
        return searchTerms.every(term => searchableText.includes(term));
      });
    } catch (error) {
      console.error('Error searching markets:', error);
      throw new Error('Failed to search markets');
    }
  }

  async getMarketHistory(marketId: string, timeframe: '1h' | '24h' | '7d' | '30d' = '24h'): Promise<{
    timestamp: Date;
    volume: number;
    liquidity: number;
    outcomes: { id: string; odds: number; probability: number }[];
  }[]> {
    const cacheKey = `history_${marketId}_${timeframe}`;
    
    if (this.isCacheValid(cacheKey)) {
      return this.getCache(cacheKey);
    }

    try {
      // This would typically fetch from a time-series database or indexer
      // For now, we'll return mock data structure
      const history = await this.fetchMarketHistoryFromIndexer(marketId, timeframe);
      
      this.setCache(cacheKey, history);
      return history;
    } catch (error) {
      console.error('Error fetching market history:', error);
      throw new Error('Failed to fetch market history');
    }
  }

  private parseMarketAccount(accountInfo: AccountInfo<Buffer>, pubkey: string): MarketData {
    // Parse the account data based on your program's account structure
    const data = accountInfo.data;
    
    // This is a simplified parser - adjust based on your actual account structure
    const title = this.readString(data, 8, 64);
    const description = this.readString(data, 72, 256);
    const category = this.readString(data, 328, 32);
    const endDate = new Date(this.readU64(data, 360).toNumber() * 1000);
    const totalVolume = this.readU64(data, 368).toNumber() / 1e9; // Convert from lamports
    const totalLiquidity = this.readU64(data, 376).toNumber() / 1e9;
    const status = this.readU8(data, 384);
    const creator = new PublicKey(data.slice(385, 417)).toString();
    const createdAt = new Date(this.readU64(data, 417).toNumber() * 1000);
    const isActive = this.readU8(data, 425) === 1;
    const minBetAmount = this.readU64(data, 426).toNumber() / 1e9;
    const maxBetAmount = this.readU64(data, 434).toNumber() / 1e9;
    const feePercentage = this.readU16(data, 442) / 100;

    // Parse outcomes (assuming up to 10 outcomes)
    const outcomes: MarketOutcome[] = [];
    let offset = 444;
    const outcomeCount = this.readU8(data, offset);
    offset += 1;

    for (let i = 0; i < outcomeCount; i++) {
      const outcomeTitle = this.readString(data, offset, 64);
      offset += 64;
      const odds = this.readU32(data, offset) / 10000; // Stored as basis points
      offset += 4;
      const probability = this.readU32(data, offset) / 10000;
      offset += 4;
      const totalBets = this.readU32(data, offset);
      offset += 4;
      const outcomeVolume = this.readU64(data, offset).toNumber() / 1e9;
      offset += 8;

      outcomes.push({
        id: `${pubkey}_${i}`,
        title: outcomeTitle,
        odds,
        probability,
        totalBets,
        totalVolume: outcomeVolume,
        color: this.getOutcomeColor(i)
      });
    }

    return {
      id: pubkey,
      title,
      description,
      category,
      endDate,
      totalVolume,
      totalLiquidity,
      outcomes,
      status: this.mapStatus(status),
      creator,
      resolutionSource: 'Oracle', // Default or parse from data
      createdAt,
      updatedAt: new Date(),
      tags: this.parseTags(category),
      isActive,
      minBetAmount,
      maxBetAmount,
      feePercentage
    };
  }

  private parsePositionAccount(accountInfo: AccountInfo<Buffer>): UserPosition {
    const data = accountInfo.data;
    
    const marketId = new PublicKey(data.slice(8, 40)).toString();
    const outcomeId = this.readString(data, 40, 32);
    const amount = this.readU64(data, 72).toNumber() / 1e9;
    const odds = this.readU32(data, 80) / 10000;
    const timestamp = new Date(this.readU64(data, 84).toNumber() * 1000);
    const status = this.mapPositionStatus(this.readU8(data, 92));
    const potentialPayout = amount * odds;

    return {
      marketId,
      outcomeId,
      amount,
      odds,
      timestamp,
      status,
      potentialPayout
    };
  }

  private async getTotalUsers(): Promise<number> {
    try {
      const accounts = await this.connection.getProgramAccounts(this.programId, {
        filters: [
          {
            memcmp: {
              offset: 0,
              bytes: 'user'
            }
          }
        ]
      });
      return accounts