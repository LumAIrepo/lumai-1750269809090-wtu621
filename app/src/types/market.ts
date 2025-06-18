```typescript
import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';

export enum MarketStatus {
  ACTIVE = 'active',
  RESOLVED = 'resolved',
  CANCELLED = 'cancelled',
  PENDING = 'pending'
}

export enum OutcomeType {
  BINARY = 'binary',
  CATEGORICAL = 'categorical',
  SCALAR = 'scalar'
}

export enum ResolutionSource {
  ORACLE = 'oracle',
  MANUAL = 'manual',
  AUTOMATED = 'automated'
}

export interface MarketOutcome {
  id: string;
  name: string;
  description?: string;
  odds: number;
  probability: number;
  totalVolume: BN;
  totalShares: BN;
  price: number;
  priceChange24h: number;
  isWinning?: boolean;
}

export interface MarketMetadata {
  title: string;
  description: string;
  category: string;
  tags: string[];
  imageUrl?: string;
  externalUrl?: string;
  resolutionCriteria: string;
  resolutionSource: ResolutionSource;
  oracleAddress?: PublicKey;
}

export interface MarketTiming {
  createdAt: Date;
  tradingStartTime: Date;
  tradingEndTime: Date;
  resolutionTime: Date;
  resolvedAt?: Date;
}

export interface MarketLiquidity {
  totalLiquidity: BN;
  availableLiquidity: BN;
  liquidityProviders: number;
  spread: number;
  slippage: number;
  volume24h: BN;
  volume7d: BN;
  volumeTotal: BN;
}

export interface MarketFees {
  tradingFee: number; // basis points
  resolutionFee: number; // basis points
  liquidityFee: number; // basis points
  protocolFee: number; // basis points
}

export interface MarketStatistics {
  totalTrades: number;
  uniqueTraders: number;
  averageTradeSize: BN;
  largestTrade: BN;
  priceHistory: PricePoint[];
  volumeHistory: VolumePoint[];
}

export interface PricePoint {
  timestamp: Date;
  price: number;
  volume: BN;
  outcomeId: string;
}

export interface VolumePoint {
  timestamp: Date;
  volume: BN;
  trades: number;
}

export interface Market {
  // On-chain identifiers
  publicKey: PublicKey;
  authority: PublicKey;
  mint: PublicKey;
  vault: PublicKey;
  
  // Market configuration
  marketId: string;
  status: MarketStatus;
  outcomeType: OutcomeType;
  outcomes: MarketOutcome[];
  
  // Market metadata
  metadata: MarketMetadata;
  timing: MarketTiming;
  fees: MarketFees;
  
  // Market state
  liquidity: MarketLiquidity;
  statistics: MarketStatistics;
  
  // Resolution data
  winningOutcome?: string;
  resolutionData?: any;
  resolutionTxSignature?: string;
  
  // Display properties
  featured: boolean;
  trending: boolean;
  verified: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  
  // Computed properties
  timeToResolution: number; // milliseconds
  isActive: boolean;
  canTrade: boolean;
  canResolve: boolean;
  totalVolume: BN;
  marketCap: BN;
}

export interface CreateMarketParams {
  title: string;
  description: string;
  category: string;
  tags: string[];
  outcomes: Omit<MarketOutcome, 'id' | 'totalVolume' | 'totalShares' | 'price' | 'priceChange24h'>[];
  tradingEndTime: Date;
  resolutionTime: Date;
  resolutionCriteria: string;
  resolutionSource: ResolutionSource;
  oracleAddress?: PublicKey;
  initialLiquidity: BN;
  tradingFee: number;
  imageUrl?: string;
  externalUrl?: string;
}

export interface MarketFilter {
  status?: MarketStatus[];
  category?: string[];
  tags?: string[];
  outcomeType?: OutcomeType[];
  minVolume?: BN;
  maxVolume?: BN;
  minLiquidity?: BN;
  maxLiquidity?: BN;
  resolutionTimeStart?: Date;
  resolutionTimeEnd?: Date;
  featured?: boolean;
  trending?: boolean;
  verified?: boolean;
  riskLevel?: ('low' | 'medium' | 'high')[];
}

export interface MarketSort {
  field: 'volume' | 'liquidity' | 'createdAt' | 'resolutionTime' | 'trades' | 'probability';
  direction: 'asc' | 'desc';
}

export interface MarketSearchParams {
  query?: string;
  filter?: MarketFilter;
  sort?: MarketSort;
  limit?: number;
  offset?: number;
}

export interface MarketPosition {
  marketId: string;
  outcomeId: string;
  shares: BN;
  averagePrice: number;
  totalCost: BN;
  currentValue: BN;
  unrealizedPnl: BN;
  realizedPnl: BN;
  createdAt: Date;
  updatedAt: Date;
}

export interface MarketTrade {
  id: string;
  marketId: string;
  outcomeId: string;
  trader: PublicKey;
  side: 'buy' | 'sell';
  shares: BN;
  price: number;
  amount: BN;
  fee: BN;
  timestamp: Date;
  txSignature: string;
}

export interface MarketOrderBook {
  marketId: string;
  outcomeId: string;
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
  spread: number;
  midPrice: number;
  lastUpdated: Date;
}

export interface OrderBookEntry {
  price: number;
  size: BN;
  orders: number;
  total: BN;
}

export interface MarketEvent {
  id: string;
  marketId: string;
  type: 'created' | 'trade' | 'resolved' | 'cancelled' | 'liquidity_added' | 'liquidity_removed';
  data: any;
  timestamp: Date;
  txSignature?: string;
}

export interface MarketAnalytics {
  marketId: string;
  period: '1h' | '24h' | '7d' | '30d' | 'all';
  volume: BN;
  trades: number;
  uniqueTraders: number;
  averageTradeSize: BN;
  priceVolatility: number;
  liquidityUtilization: number;
  feeRevenue: BN;
  returnOnLiquidity: number;
}

export interface MarketValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface MarketResolution {
  marketId: string;
  winningOutcome: string;
  resolutionData: any;
  resolutionSource: ResolutionSource;
  resolvedBy: PublicKey;
  resolvedAt: Date;
  txSignature: string;
  payouts: MarketPayout[];
}

export interface MarketPayout {
  trader: PublicKey;
  outcomeId: string;
  shares: BN;
  payout: BN;
  claimed: boolean;
  claimedAt?: Date;
  claimTxSignature?: string;
}

export type MarketUpdate = Partial<Pick<Market, 
  'status' | 'winningOutcome' | 'resolutionData' | 'liquidity' | 'statistics'
>>;

export interface MarketSubscription {
  marketId: string;
  events: ('trade' | 'price_change' | 'liquidity_change' | 'status_change')[];
  callback: (event: MarketEvent) => void;
}
```