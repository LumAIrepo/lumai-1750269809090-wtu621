```typescript
import { Connection, PublicKey, Transaction, SystemProgram, SYSVAR_RENT_PUBKEY, SYSVAR_CLOCK_PUBKEY } from '@solana/web3.js';
import { Program, AnchorProvider, web3, BN, IdlAccounts } from '@coral-xyz/anchor';
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token';
import { WalletContextState } from '@solana/wallet-adapter-react';

export interface PredictionMarket {
  publicKey: PublicKey;
  authority: PublicKey;
  title: string;
  description: string;
  category: string;
  endTime: BN;
  resolutionTime: BN;
  totalVolume: BN;
  totalLiquidity: BN;
  yesPrice: number;
  noPrice: number;
  yesShares: BN;
  noShares: BN;
  resolved: boolean;
  outcome: boolean | null;
  creator: PublicKey;
  createdAt: BN;
  minBet: BN;
  maxBet: BN;
  feeRate: number;
  status: 'active' | 'ended' | 'resolved' | 'cancelled';
}

export interface UserPosition {
  publicKey: PublicKey;
  user: PublicKey;
  market: PublicKey;
  yesShares: BN;
  noShares: BN;
  totalInvested: BN;
  averageYesPrice: number;
  averageNoPrice: number;
  realized: BN;
  unrealized: BN;
  createdAt: BN;
}

export interface MarketOrder {
  publicKey: PublicKey;
  user: PublicKey;
  market: PublicKey;
  side: 'yes' | 'no';
  amount: BN;
  price: number;
  shares: BN;
  filled: boolean;
  cancelled: boolean;
  timestamp: BN;
  txSignature: string;
}

export class PredictionMarketProgram {
  private program: Program;
  private connection: Connection;
  private wallet: WalletContextState;

  constructor(connection: Connection, wallet: WalletContextState, program: Program) {
    this.connection = connection;
    this.wallet = wallet;
    this.program = program;
  }

  static PROGRAM_ID = new PublicKey('PredMktProgram11111111111111111111111111111');
  static USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');

  async createMarket(
    title: string,
    description: string,
    category: string,
    endTime: Date,
    resolutionTime: Date,
    minBet: number,
    maxBet: number
  ): Promise<{ signature: string; marketPubkey: PublicKey }> {
    if (!this.wallet.publicKey) throw new Error('Wallet not connected');

    const marketKeypair = web3.Keypair.generate();
    const [marketVault] = PublicKey.findProgramAddressSync(
      [Buffer.from('market_vault'), marketKeypair.publicKey.toBuffer()],
      PredictionMarketProgram.PROGRAM_ID
    );

    const userTokenAccount = await getAssociatedTokenAddress(
      PredictionMarketProgram.USDC_MINT,
      this.wallet.publicKey
    );

    const tx = await this.program.methods
      .createMarket(
        title,
        description,
        category,
        new BN(Math.floor(endTime.getTime() / 1000)),
        new BN(Math.floor(resolutionTime.getTime() / 1000)),
        new BN(minBet * 1e6),
        new BN(maxBet * 1e6)
      )
      .accounts({
        market: marketKeypair.publicKey,
        marketVault,
        authority: this.wallet.publicKey,
        creator: this.wallet.publicKey,
        userTokenAccount,
        mint: PredictionMarketProgram.USDC_MINT,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
        clock: SYSVAR_CLOCK_PUBKEY,
      })
      .signers([marketKeypair])
      .rpc();

    return { signature: tx, marketPubkey: marketKeypair.publicKey };
  }

  async placeBet(
    marketPubkey: PublicKey,
    side: 'yes' | 'no',
    amount: number,
    maxPrice: number
  ): Promise<string> {
    if (!this.wallet.publicKey) throw new Error('Wallet not connected');

    const [userPosition] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('user_position'),
        this.wallet.publicKey.toBuffer(),
        marketPubkey.toBuffer(),
      ],
      PredictionMarketProgram.PROGRAM_ID
    );

    const [marketVault] = PublicKey.findProgramAddressSync(
      [Buffer.from('market_vault'), marketPubkey.toBuffer()],
      PredictionMarketProgram.PROGRAM_ID
    );

    const userTokenAccount = await getAssociatedTokenAddress(
      PredictionMarketProgram.USDC_MINT,
      this.wallet.publicKey
    );

    const orderKeypair = web3.Keypair.generate();

    const tx = await this.program.methods
      .placeBet(
        side === 'yes',
        new BN(amount * 1e6),
        maxPrice * 100
      )
      .accounts({
        market: marketPubkey,
        marketVault,
        userPosition,
        order: orderKeypair.publicKey,
        user: this.wallet.publicKey,
        userTokenAccount,
        mint: PredictionMarketProgram.USDC_MINT,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
        clock: SYSVAR_CLOCK_PUBKEY,
      })
      .signers([orderKeypair])
      .rpc();

    return tx;
  }

  async sellShares(
    marketPubkey: PublicKey,
    side: 'yes' | 'no',
    shares: number,
    minPrice: number
  ): Promise<string> {
    if (!this.wallet.publicKey) throw new Error('Wallet not connected');

    const [userPosition] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('user_position'),
        this.wallet.publicKey.toBuffer(),
        marketPubkey.toBuffer(),
      ],
      PredictionMarketProgram.PROGRAM_ID
    );

    const [marketVault] = PublicKey.findProgramAddressSync(
      [Buffer.from('market_vault'), marketPubkey.toBuffer()],
      PredictionMarketProgram.PROGRAM_ID
    );

    const userTokenAccount = await getAssociatedTokenAddress(
      PredictionMarketProgram.USDC_MINT,
      this.wallet.publicKey
    );

    const tx = await this.program.methods
      .sellShares(
        side === 'yes',
        new BN(shares * 1e6),
        minPrice * 100
      )
      .accounts({
        market: marketPubkey,
        marketVault,
        userPosition,
        user: this.wallet.publicKey,
        userTokenAccount,
        mint: PredictionMarketProgram.USDC_MINT,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        clock: SYSVAR_CLOCK_PUBKEY,
      })
      .rpc();

    return tx;
  }

  async resolveMarket(marketPubkey: PublicKey, outcome: boolean): Promise<string> {
    if (!this.wallet.publicKey) throw new Error('Wallet not connected');

    const tx = await this.program.methods
      .resolveMarket(outcome)
      .accounts({
        market: marketPubkey,
        authority: this.wallet.publicKey,
        clock: SYSVAR_CLOCK_PUBKEY,
      })
      .rpc();

    return tx;
  }

  async claimWinnings(marketPubkey: PublicKey): Promise<string> {
    if (!this.wallet.publicKey) throw new Error('Wallet not connected');

    const [userPosition] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('user_position'),
        this.wallet.publicKey.toBuffer(),
        marketPubkey.toBuffer(),
      ],
      PredictionMarketProgram.PROGRAM_ID
    );

    const [marketVault] = PublicKey.findProgramAddressSync(
      [Buffer.from('market_vault'), marketPubkey.toBuffer()],
      PredictionMarketProgram.PROGRAM_ID
    );

    const userTokenAccount = await getAssociatedTokenAddress(
      PredictionMarketProgram.USDC_MINT,
      this.wallet.publicKey
    );

    const tx = await this.program.methods
      .claimWinnings()
      .accounts({
        market: marketPubkey,
        marketVault,
        userPosition,
        user: this.wallet.publicKey,
        userTokenAccount,
        mint: PredictionMarketProgram.USDC_MINT,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    return tx;
  }

  async getMarket(marketPubkey: PublicKey): Promise<PredictionMarket | null> {
    try {
      const marketAccount = await this.program.account.market.fetch(marketPubkey);
      return {
        publicKey: marketPubkey,
        authority: marketAccount.authority,
        title: marketAccount.title,
        description: marketAccount.description,
        category: marketAccount.category,
        endTime: marketAccount.endTime,
        resolutionTime: marketAccount.resolutionTime,
        totalVolume: marketAccount.totalVolume,
        totalLiquidity: marketAccount.totalLiquidity,
        yesPrice: marketAccount.yesPrice / 100,
        noPrice: marketAccount.noPrice / 100,
        yesShares: marketAccount.yesShares,
        noShares: marketAccount.noShares,
        resolved: marketAccount.resolved,
        outcome: marketAccount.outcome,
        creator: marketAccount.creator,
        createdAt: marketAccount.createdAt,
        minBet: marketAccount.minBet,
        maxBet: marketAccount.maxBet,
        feeRate: marketAccount.feeRate / 100,
        status: this.getMarketStatus(marketAccount),
      };
    } catch (error) {
      console.error('Error fetching market:', error);
      return null;
    }
  }

  async getAllMarkets(): Promise<PredictionMarket[]> {
    try {
      const markets = await this.program.account.market.all();
      return markets.map(({ publicKey, account }) => ({
        publicKey,
        authority: account.authority,
        title: account.title,
        description: account.description,
        category: account.category,
        endTime: account.endTime,
        resolutionTime: account.resolutionTime,
        totalVolume: account.totalVolume,
        totalLiquidity: account.totalLiquidity,
        yesPrice: account.yesPrice / 100,
        noPrice: account.noPrice / 100,
        yesShares: account.yesShares,
        noShares: account.noShares,
        resolved: account.resolved,
        outcome: account.outcome,
        creator: account.creator,
        createdAt: account.createdAt,
        minBet: account.minBet,
        maxBet: account.maxBet,
        feeRate: account.feeRate / 100,
        status: this.getMarketStatus(account),
      }));
    } catch (error) {
      console.error('Error fetching markets:', error);
      return [];
    }
  }

  async getUserPosition(marketPubkey: PublicKey, userPubkey?: PublicKey): Promise<UserPosition | null> {
    const user = userPubkey || this.wallet.publicKey;
    if (!user) return null;

    try {
      const [userPositionPubkey] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('user_position'),
          user.toBuffer(),
          marketPubkey.toBuffer(),
        ],
        PredictionMarketProgram.PROGRAM_ID
      );

      const positionAccount = await this.program.account.userPosition.fetch(userPositionPubkey);
      
      return {
        publicKey: userPositionPubkey,
        user: positionAccount.user,
        market: positionAccount.market,
        yesShares: positionAccount.yesShares,
        noShares: positionAccount.noShares,
        totalInvested: positionAccount.totalInvested,
        averageYesPrice: positionAccount.averageYesPrice / 100,
        averageNoPrice: positionAccount.averageNoPrice / 100,
        realized: positionAccount.realized,
        unrealized: positionAccount.unrealized,
        createdAt: positionAccount.createdAt,
      };
    } catch (error) {
      console.error('Error fetching user position:', error);
      return null;
    }
  }

  async getUserPositions(userPubkey?: PublicKey): Promise<UserPosition[]> {
    const user = userPubkey || this.wallet.publicKey;
    if (!user) return [];

    try {
      const positions = await this.program.account.userPosition.all([
        {
          memcmp: {
            offset: 8,
            bytes: user.toBase58(),
          },
        },
      ]);

      return positions.map(({ publicKey, account }) => ({
        publicKey,
        user: account.user,
        market: account.market,
        yesShares: account.yesShares,
        noShares: account.noShares,
        totalInvested: account.totalInvested,
        averageYesPrice: account.averageYesPrice / 100,
        averageNoPrice: account.averageNoPrice / 100,
        realized: account.realized,
        unrealized: account.unrealized,
        createdAt: account.createdAt,
      }));
    } catch (error) {
      console.error('Error fetching user positions:', error);
      return [];
    }
  }

  async getMarketOrders(marketPubkey: PublicKey): Promise<MarketOrder[]> {
    try {
      const orders = await this.program.account.order.all([
        {
          memcmp: {
            offset: 40,
            bytes: marketPubkey.toBase58(),
          },
        },
      ]);

      return orders.map(({ publicKey, account }) => ({
        publicKey,
        user: account.