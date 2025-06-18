use anchor_lang::prelude::*;

#[account]
pub struct Market {
    pub authority: Pubkey,
    pub title: String,
    pub description: String,
    pub category: String,
    pub oracle: Pubkey,
    pub resolution_time: i64,
    pub created_at: i64,
    pub resolved_at: Option<i64>,
    pub outcome: Option<u8>,
    pub total_volume: u64,
    pub total_liquidity: u64,
    pub fee_rate: u16, // basis points (e.g., 250 = 2.5%)
    pub status: MarketStatus,
    pub outcomes: Vec<Outcome>,
    pub bump: u8,
}

impl Market {
    pub const MAX_TITLE_LENGTH: usize = 100;
    pub const MAX_DESCRIPTION_LENGTH: usize = 500;
    pub const MAX_CATEGORY_LENGTH: usize = 50;
    pub const MAX_OUTCOMES: usize = 10;
    
    pub fn space() -> usize {
        8 + // discriminator
        32 + // authority
        4 + Self::MAX_TITLE_LENGTH + // title
        4 + Self::MAX_DESCRIPTION_LENGTH + // description
        4 + Self::MAX_CATEGORY_LENGTH + // category
        32 + // oracle
        8 + // resolution_time
        8 + // created_at
        1 + 8 + // resolved_at (Option<i64>)
        1 + 1 + // outcome (Option<u8>)
        8 + // total_volume
        8 + // total_liquidity
        2 + // fee_rate
        1 + // status
        4 + (Self::MAX_OUTCOMES * Outcome::space()) + // outcomes
        1 // bump
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum MarketStatus {
    Active,
    Paused,
    Resolved,
    Cancelled,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct Outcome {
    pub id: u8,
    pub title: String,
    pub total_shares: u64,
    pub price: u64, // in lamports per share
    pub last_price: u64,
    pub volume_24h: u64,
}

impl Outcome {
    pub const MAX_TITLE_LENGTH: usize = 50;
    
    pub fn space() -> usize {
        1 + // id
        4 + Self::MAX_TITLE_LENGTH + // title
        8 + // total_shares
        8 + // price
        8 + // last_price
        8 // volume_24h
    }
}

#[account]
pub struct Position {
    pub owner: Pubkey,
    pub market: Pubkey,
    pub outcome_id: u8,
    pub shares: u64,
    pub average_price: u64,
    pub created_at: i64,
    pub last_updated: i64,
    pub realized_pnl: i64,
    pub unrealized_pnl: i64,
    pub bump: u8,
}

impl Position {
    pub fn space() -> usize {
        8 + // discriminator
        32 + // owner
        32 + // market
        1 + // outcome_id
        8 + // shares
        8 + // average_price
        8 + // created_at
        8 + // last_updated
        8 + // realized_pnl
        8 + // unrealized_pnl
        1 // bump
    }
}

#[account]
pub struct UserProfile {
    pub owner: Pubkey,
    pub total_volume: u64,
    pub total_pnl: i64,
    pub markets_traded: u32,
    pub win_rate: u16, // basis points
    pub created_at: i64,
    pub last_active: i64,
    pub reputation_score: u32,
    pub bump: u8,
}

impl UserProfile {
    pub fn space() -> usize {
        8 + // discriminator
        32 + // owner
        8 + // total_volume
        8 + // total_pnl
        4 + // markets_traded
        2 + // win_rate
        8 + // created_at
        8 + // last_active
        4 + // reputation_score
        1 // bump
    }
}

#[account]
pub struct LiquidityPool {
    pub market: Pubkey,
    pub outcome_id: u8,
    pub total_liquidity: u64,
    pub available_liquidity: u64,
    pub utilization_rate: u16, // basis points
    pub apr: u16, // basis points
    pub created_at: i64,
    pub last_updated: i64,
    pub bump: u8,
}

impl LiquidityPool {
    pub fn space() -> usize {
        8 + // discriminator
        32 + // market
        1 + // outcome_id
        8 + // total_liquidity
        8 + // available_liquidity
        2 + // utilization_rate
        2 + // apr
        8 + // created_at
        8 + // last_updated
        1 // bump
    }
}

#[account]
pub struct LiquidityPosition {
    pub owner: Pubkey,
    pub pool: Pubkey,
    pub shares: u64,
    pub deposited_amount: u64,
    pub earned_fees: u64,
    pub created_at: i64,
    pub last_updated: i64,
    pub bump: u8,
}

impl LiquidityPosition {
    pub fn space() -> usize {
        8 + // discriminator
        32 + // owner
        32 + // pool
        8 + // shares
        8 + // deposited_amount
        8 + // earned_fees
        8 + // created_at
        8 + // last_updated
        1 // bump
    }
}

#[account]
pub struct Trade {
    pub trader: Pubkey,
    pub market: Pubkey,
    pub outcome_id: u8,
    pub trade_type: TradeType,
    pub shares: u64,
    pub price: u64,
    pub total_cost: u64,
    pub fee_paid: u64,
    pub timestamp: i64,
    pub bump: u8,
}

impl Trade {
    pub fn space() -> usize {
        8 + // discriminator
        32 + // trader
        32 + // market
        1 + // outcome_id
        1 + // trade_type
        8 + // shares
        8 + // price
        8 + // total_cost
        8 + // fee_paid
        8 + // timestamp
        1 // bump
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum TradeType {
    Buy,
    Sell,
}

#[account]
pub struct Oracle {
    pub authority: Pubkey,
    pub name: String,
    pub description: String,
    pub reputation_score: u32,
    pub total_resolutions: u32,
    pub accurate_resolutions: u32,
    pub created_at: i64,
    pub is_active: bool,
    pub bump: u8,
}

impl Oracle {
    pub const MAX_NAME_LENGTH: usize = 50;
    pub const MAX_DESCRIPTION_LENGTH: usize = 200;
    
    pub fn space() -> usize {
        8 + // discriminator
        32 + // authority
        4 + Self::MAX_NAME_LENGTH + // name
        4 + Self::MAX_DESCRIPTION_LENGTH + // description
        4 + // reputation_score
        4 + // total_resolutions
        4 + // accurate_resolutions
        8 + // created_at
        1 + // is_active
        1 // bump
    }
}

#[account]
pub struct GlobalState {
    pub authority: Pubkey,
    pub total_markets: u32,
    pub total_volume: u64,
    pub total_fees_collected: u64,
    pub platform_fee_rate: u16, // basis points
    pub oracle_fee_rate: u16, // basis points
    pub min_market_duration: i64,
    pub max_market_duration: i64,
    pub paused: bool,
    pub bump: u8,
}

impl GlobalState {
    pub fn space() -> usize {
        8 + // discriminator
        32 + // authority
        4 + // total_markets
        8 + // total_volume
        8 + // total_fees_collected
        2 + // platform_fee_rate
        2 + // oracle_fee_rate
        8 + // min_market_duration
        8 + // max_market_duration
        1 + // paused
        1 // bump
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct PriceHistory {
    pub timestamp: i64,
    pub price: u64,
    pub volume: u64,
}

impl PriceHistory {
    pub fn space() -> usize {
        8 + // timestamp
        8 + // price
        8 // volume
    }
}