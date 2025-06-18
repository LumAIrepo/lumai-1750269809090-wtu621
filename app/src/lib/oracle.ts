```typescript
import { Connection, PublicKey, AccountInfo } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';

export interface OracleData {
  eventId: string;
  title: string;
  description: string;
  category: string;
  endTime: Date;
  resolutionTime: Date;
  outcome: number | null;
  isResolved: boolean;
  confidence: number;
  volume: number;
  liquidity: number;
  source: string;
  lastUpdated: Date;
}

export interface PriceData {
  eventId: string;
  yesPrice: number;
  noPrice: number;
  timestamp: Date;
  volume24h: number;
  priceChange24h: number;
}

export interface EventOutcome {
  eventId: string;
  outcome: 'YES' | 'NO' | 'INVALID';
  confidence: number;
  timestamp: Date;
  source: string;
  verificationCount: number;
}

export class OracleService {
  private connection: Connection;
  private oracleProgramId: PublicKey;
  private priceFeeds: Map<string, PriceData> = new Map();
  private eventData: Map<string, OracleData> = new Map();

  constructor(connection: Connection, oracleProgramId: string) {
    this.connection = connection;
    this.oracleProgramId = new PublicKey(oracleProgramId);
  }

  async fetchEventData(eventId: string): Promise<OracleData | null> {
    try {
      const eventPubkey = await this.getEventPubkey(eventId);
      const accountInfo = await this.connection.getAccountInfo(eventPubkey);
      
      if (!accountInfo) {
        return null;
      }

      const eventData = this.deserializeEventData(accountInfo.data);
      this.eventData.set(eventId, eventData);
      
      return eventData;
    } catch (error) {
      console.error('Error fetching event data:', error);
      return null;
    }
  }

  async fetchPriceData(eventId: string): Promise<PriceData | null> {
    try {
      const pricePubkey = await this.getPricePubkey(eventId);
      const accountInfo = await this.connection.getAccountInfo(pricePubkey);
      
      if (!accountInfo) {
        return null;
      }

      const priceData = this.deserializePriceData(accountInfo.data);
      this.priceFeeds.set(eventId, priceData);
      
      return priceData;
    } catch (error) {
      console.error('Error fetching price data:', error);
      return null;
    }
  }

  async subscribeToEventUpdates(eventId: string, callback: (data: OracleData) => void): Promise<number> {
    try {
      const eventPubkey = await this.getEventPubkey(eventId);
      
      return this.connection.onAccountChange(
        eventPubkey,
        (accountInfo: AccountInfo<Buffer>) => {
          const eventData = this.deserializeEventData(accountInfo.data);
          this.eventData.set(eventId, eventData);
          callback(eventData);
        },
        'confirmed'
      );
    } catch (error) {
      console.error('Error subscribing to event updates:', error);
      throw error;
    }
  }

  async subscribeToPriceUpdates(eventId: string, callback: (data: PriceData) => void): Promise<number> {
    try {
      const pricePubkey = await this.getPricePubkey(eventId);
      
      return this.connection.onAccountChange(
        pricePubkey,
        (accountInfo: AccountInfo<Buffer>) => {
          const priceData = this.deserializePriceData(accountInfo.data);
          this.priceFeeds.set(eventId, priceData);
          callback(priceData);
        },
        'confirmed'
      );
    } catch (error) {
      console.error('Error subscribing to price updates:', error);
      throw error;
    }
  }

  async resolveEvent(eventId: string, outcome: 'YES' | 'NO' | 'INVALID'): Promise<EventOutcome> {
    try {
      const eventData = await this.fetchEventData(eventId);
      if (!eventData) {
        throw new Error('Event not found');
      }

      const resolution: EventOutcome = {
        eventId,
        outcome,
        confidence: this.calculateConfidence(eventData),
        timestamp: new Date(),
        source: 'oracle',
        verificationCount: 1
      };

      await this.submitResolution(resolution);
      return resolution;
    } catch (error) {
      console.error('Error resolving event:', error);
      throw error;
    }
  }

  async getMultipleEventData(eventIds: string[]): Promise<Map<string, OracleData>> {
    const results = new Map<string, OracleData>();
    
    try {
      const pubkeys = await Promise.all(
        eventIds.map(id => this.getEventPubkey(id))
      );

      const accountInfos = await this.connection.getMultipleAccountsInfo(pubkeys);
      
      accountInfos.forEach((accountInfo, index) => {
        if (accountInfo) {
          const eventData = this.deserializeEventData(accountInfo.data);
          results.set(eventIds[index], eventData);
          this.eventData.set(eventIds[index], eventData);
        }
      });

      return results;
    } catch (error) {
      console.error('Error fetching multiple event data:', error);
      return results;
    }
  }

  async getHistoricalPrices(eventId: string, timeframe: '1h' | '24h' | '7d' | '30d'): Promise<PriceData[]> {
    try {
      const endTime = Date.now();
      const startTime = this.getStartTimeForTimeframe(timeframe, endTime);
      
      // In a real implementation, this would query historical data from the blockchain
      // For now, we'll simulate historical data
      return this.generateHistoricalData(eventId, startTime, endTime);
    } catch (error) {
      console.error('Error fetching historical prices:', error);
      return [];
    }
  }

  async validateEventData(eventId: string): Promise<boolean> {
    try {
      const eventData = await this.fetchEventData(eventId);
      if (!eventData) return false;

      // Validate event structure and data integrity
      const isValid = this.validateEventStructure(eventData) &&
                     this.validateEventTiming(eventData) &&
                     this.validateEventSource(eventData);

      return isValid;
    } catch (error) {
      console.error('Error validating event data:', error);
      return false;
    }
  }

  getCachedEventData(eventId: string): OracleData | null {
    return this.eventData.get(eventId) || null;
  }

  getCachedPriceData(eventId: string): PriceData | null {
    return this.priceFeeds.get(eventId) || null;
  }

  unsubscribe(subscriptionId: number): void {
    this.connection.removeAccountChangeListener(subscriptionId);
  }

  private async getEventPubkey(eventId: string): Promise<PublicKey> {
    const [eventPubkey] = await PublicKey.findProgramAddress(
      [Buffer.from('event'), Buffer.from(eventId)],
      this.oracleProgramId
    );
    return eventPubkey;
  }

  private async getPricePubkey(eventId: string): Promise<PublicKey> {
    const [pricePubkey] = await PublicKey.findProgramAddress(
      [Buffer.from('price'), Buffer.from(eventId)],
      this.oracleProgramId
    );
    return pricePubkey;
  }

  private deserializeEventData(data: Buffer): OracleData {
    // Simplified deserialization - in practice, use proper borsh or anchor deserialization
    const view = new DataView(data.buffer);
    let offset = 0;

    const eventIdLength = view.getUint32(offset, true);
    offset += 4;
    const eventId = new TextDecoder().decode(data.slice(offset, offset + eventIdLength));
    offset += eventIdLength;

    const titleLength = view.getUint32(offset, true);
    offset += 4;
    const title = new TextDecoder().decode(data.slice(offset, offset + titleLength));
    offset += titleLength;

    const descriptionLength = view.getUint32(offset, true);
    offset += 4;
    const description = new TextDecoder().decode(data.slice(offset, offset + descriptionLength));
    offset += descriptionLength;

    const categoryLength = view.getUint32(offset, true);
    offset += 4;
    const category = new TextDecoder().decode(data.slice(offset, offset + categoryLength));
    offset += categoryLength;

    const endTime = new Date(Number(view.getBigUint64(offset, true)));
    offset += 8;

    const resolutionTime = new Date(Number(view.getBigUint64(offset, true)));
    offset += 8;

    const hasOutcome = view.getUint8(offset);
    offset += 1;
    const outcome = hasOutcome ? view.getUint32(offset, true) : null;
    if (hasOutcome) offset += 4;

    const isResolved = Boolean(view.getUint8(offset));
    offset += 1;

    const confidence = view.getFloat64(offset, true);
    offset += 8;

    const volume = view.getFloat64(offset, true);
    offset += 8;

    const liquidity = view.getFloat64(offset, true);
    offset += 8;

    const sourceLength = view.getUint32(offset, true);
    offset += 4;
    const source = new TextDecoder().decode(data.slice(offset, offset + sourceLength));
    offset += sourceLength;

    const lastUpdated = new Date(Number(view.getBigUint64(offset, true)));

    return {
      eventId,
      title,
      description,
      category,
      endTime,
      resolutionTime,
      outcome,
      isResolved,
      confidence,
      volume,
      liquidity,
      source,
      lastUpdated
    };
  }

  private deserializePriceData(data: Buffer): PriceData {
    const view = new DataView(data.buffer);
    let offset = 0;

    const eventIdLength = view.getUint32(offset, true);
    offset += 4;
    const eventId = new TextDecoder().decode(data.slice(offset, offset + eventIdLength));
    offset += eventIdLength;

    const yesPrice = view.getFloat64(offset, true);
    offset += 8;

    const noPrice = view.getFloat64(offset, true);
    offset += 8;

    const timestamp = new Date(Number(view.getBigUint64(offset, true)));
    offset += 8;

    const volume24h = view.getFloat64(offset, true);
    offset += 8;

    const priceChange24h = view.getFloat64(offset, true);

    return {
      eventId,
      yesPrice,
      noPrice,
      timestamp,
      volume24h,
      priceChange24h
    };
  }

  private calculateConfidence(eventData: OracleData): number {
    // Calculate confidence based on volume, liquidity, and time to resolution
    const volumeScore = Math.min(eventData.volume / 10000, 1) * 0.4;
    const liquidityScore = Math.min(eventData.liquidity / 5000, 1) * 0.3;
    const timeScore = this.calculateTimeScore(eventData.resolutionTime) * 0.3;
    
    return Math.min(volumeScore + liquidityScore + timeScore, 1);
  }

  private calculateTimeScore(resolutionTime: Date): number {
    const now = new Date();
    const timeToResolution = resolutionTime.getTime() - now.getTime();
    const hoursToResolution = timeToResolution / (1000 * 60 * 60);
    
    if (hoursToResolution < 0) return 1; // Already resolved
    if (hoursToResolution > 168) return 0.5; // More than a week
    
    return 0.5 + (168 - hoursToResolution) / 336; // Linear scale
  }

  private async submitResolution(resolution: EventOutcome): Promise<void> {
    // In a real implementation, this would submit the resolution to the blockchain
    console.log('Submitting resolution:', resolution);
  }

  private getStartTimeForTimeframe(timeframe: string, endTime: number): number {
    const timeframes = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    };
    
    return endTime - timeframes[timeframe as keyof typeof timeframes];
  }

  private generateHistoricalData(eventId: string, startTime: number, endTime: number): PriceData[] {
    const data: PriceData[] = [];
    const interval = (endTime - startTime) / 100; // 100 data points
    
    for (let i = 0; i < 100; i++) {
      const timestamp = new Date(startTime + (i * interval));
      const basePrice = 0.5 + (Math.sin(i / 10) * 0.2);
      
      data.push({
        eventId,
        yesPrice: Math.max(0.01, Math.min(0.99, basePrice + (Math.random() - 0.5) * 0.1)),
        noPrice: Math.max(0.01, Math.min(0.99, 1 - basePrice + (Math.random() - 0.5) * 0.1)),
        timestamp,
        volume24h: Math.random() * 10000,
        priceChange24h: (Math.random() - 0.5) * 0.2
      });
    }
    
    return data;
  }

  private validateEventStructure(eventData: OracleData): boolean {
    return !!(
      eventData.eventId &&
      eventData.title &&
      eventData.description &&
      eventData.category &&
      eventData.endTime &&
      eventData.resolutionTime &&
      eventData.source
    );
  }

  private validateEventTiming(eventData: OracleData): boolean {
    const now = new Date();
    return eventData.endTime > now && eventData.resolutionTime >= eventData.endTime;
  }

  private validateEventSource(eventData: OracleData): boolean {
    const trustedSources = ['reuters', 'ap', 'bloomberg', 'oracle', 'chainlink'];
    return trustedSources.includes(eventData.source.toLowerCase());
  }
}

export const createOracleService = (connection: Connection, oracleProgramId: string): OracleService => {
  return new OracleService(connection, oracleProgramId);
};

export const ORACLE_PROGRAM_ID