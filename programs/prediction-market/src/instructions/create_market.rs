```rust
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

use crate::state::*;
use crate::errors::*;

#[derive(Accounts)]
#[instruction(market_id: String, title: String, description: String, category: String, end_time: i64, resolution_source: String)]
pub struct CreateMarket<'info> {
    #[account(
        init,
        payer = creator,
        space = 8 + Market::INIT_SPACE,
        seeds = [b"market", market_id.as_bytes()],
        bump
    )]
    pub market: Account<'info, Market>,

    #[account(
        init,
        payer = creator,
        token::mint = usdc_mint,
        token::authority = market,
        seeds = [b"market_vault", market.key().as_ref()],
        bump
    )]
    pub market_vault: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = creator,
        space = 8 + MarketStats::INIT_SPACE,
        seeds = [b"market_stats", market.key().as_ref()],
        bump
    )]
    pub market_stats: Account<'info, MarketStats>,

    #[account(
        init,
        payer = creator,
        space = 8 + OutcomeTokens::INIT_SPACE,
        seeds = [b"outcome_tokens", market.key().as_ref()],
        bump
    )]
    pub outcome_tokens: Account<'info, OutcomeTokens>,

    #[account(
        init,
        payer = creator,
        token::mint = usdc_mint,
        token::authority = outcome_tokens,
        seeds = [b"yes_token_vault", market.key().as_ref()],
        bump
    )]
    pub yes_token_vault: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = creator,
        token::mint = usdc_mint,
        token::authority = outcome_tokens,
        seeds = [b"no_token_vault", market.key().as_ref()],
        bump
    )]
    pub no_token_vault: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = creator,
        space = 8 + LiquidityPool::INIT_SPACE,
        seeds = [b"liquidity_pool", market.key().as_ref()],
        bump
    )]
    pub liquidity_pool: Account<'info, LiquidityPool>,

    #[account(
        init,
        payer = creator,
        token::mint = usdc_mint,
        token::authority = liquidity_pool,
        seeds = [b"liquidity_vault", market.key().as_ref()],
        bump
    )]
    pub liquidity_vault: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = creator,
        space = 8 + MarketResolution::INIT_SPACE,
        seeds = [b"market_resolution", market.key().as_ref()],
        bump
    )]
    pub market_resolution: Account<'info, MarketResolution>,

    #[account(mut)]
    pub creator: Signer<'info>,

    #[account(
        mut,
        constraint = creator_token_account.mint == usdc_mint.key(),
        constraint = creator_token_account.owner == creator.key()
    )]
    pub creator_token_account: Account<'info, TokenAccount>,

    pub usdc_mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(
    ctx: Context<CreateMarket>,
    market_id: String,
    title: String,
    description: String,
    category: String,
    end_time: i64,
    resolution_source: String,
    initial_liquidity: u64,
    creator_fee_bps: u16,
    platform_fee_bps: u16,
) -> Result<()> {
    let clock = Clock::get()?;
    let current_time = clock.unix_timestamp;

    // Validate inputs
    require!(market_id.len() <= 32, PredictionMarketError::MarketIdTooLong);
    require!(title.len() <= 128, PredictionMarketError::TitleTooLong);
    require!(description.len() <= 512, PredictionMarketError::DescriptionTooLong);
    require!(category.len() <= 32, PredictionMarketError::CategoryTooLong);
    require!(resolution_source.len() <= 128, PredictionMarketError::ResolutionSourceTooLong);
    require!(end_time > current_time, PredictionMarketError::InvalidEndTime);
    require!(end_time <= current_time + 365 * 24 * 60 * 60, PredictionMarketError::EndTimeTooFar);
    require!(initial_liquidity >= 1000, PredictionMarketError::InsufficientInitialLiquidity);
    require!(creator_fee_bps <= 1000, PredictionMarketError::CreatorFeeTooHigh);
    require!(platform_fee_bps <= 500, PredictionMarketError::PlatformFeeTooHigh);

    let market = &mut ctx.accounts.market;
    let market_stats = &mut ctx.accounts.market_stats;
    let outcome_tokens = &mut ctx.accounts.outcome_tokens;
    let liquidity_pool = &mut ctx.accounts.liquidity_pool;
    let market_resolution = &mut ctx.accounts.market_resolution;

    // Initialize market
    market.market_id = market_id.clone();
    market.title = title.clone();
    market.description = description.clone();
    market.category = category.clone();
    market.creator = ctx.accounts.creator.key();
    market.created_at = current_time;
    market.end_time = end_time;
    market.resolution_source = resolution_source.clone();
    market.status = MarketStatus::Active;
    market.usdc_mint = ctx.accounts.usdc_mint.key();
    market.market_vault = ctx.accounts.market_vault.key();
    market.creator_fee_bps = creator_fee_bps;
    market.platform_fee_bps = platform_fee_bps;
    market.bump = ctx.bumps.market;

    // Initialize market stats
    market_stats.market = market.key();
    market_stats.total_volume = 0;
    market_stats.total_liquidity = initial_liquidity;
    market_stats.yes_volume = 0;
    market_stats.no_volume = 0;
    market_stats.unique_traders = 0;
    market_stats.total_trades = 0;
    market_stats.last_trade_price = 5000; // 50% initial price
    market_stats.yes_price = 5000;
    market_stats.no_price = 5000;
    market_stats.bump = ctx.bumps.market_stats;

    // Initialize outcome tokens
    outcome_tokens.market = market.key();
    outcome_tokens.yes_token_supply = 0;
    outcome_tokens.no_token_supply = 0;
    outcome_tokens.yes_token_vault = ctx.accounts.yes_token_vault.key();
    outcome_tokens.no_token_vault = ctx.accounts.no_token_vault.key();
    outcome_tokens.bump = ctx.bumps.outcome_tokens;

    // Initialize liquidity pool
    liquidity_pool.market = market.key();
    liquidity_pool.total_liquidity = initial_liquidity;
    liquidity_pool.yes_reserves = initial_liquidity / 2;
    liquidity_pool.no_reserves = initial_liquidity / 2;
    liquidity_pool.liquidity_vault = ctx.accounts.liquidity_vault.key();
    liquidity_pool.k_constant = (initial_liquidity / 2) * (initial_liquidity / 2);
    liquidity_pool.fee_rate_bps = 30; // 0.3% trading fee
    liquidity_pool.bump = ctx.bumps.liquidity_pool;

    // Initialize market resolution
    market_resolution.market = market.key();
    market_resolution.resolved = false;
    market_resolution.resolution_time = 0;
    market_resolution.winning_outcome = None;
    market_resolution.resolver = None;
    market_resolution.resolution_data = String::new();
    market_resolution.dispute_period_end = 0;
    market_resolution.bump = ctx.bumps.market_resolution;

    // Transfer initial liquidity from creator
    let transfer_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.creator_token_account.to_account_info(),
            to: ctx.accounts.liquidity_vault.to_account_info(),
            authority: ctx.accounts.creator.to_account_info(),
        },
    );
    token::transfer(transfer_ctx, initial_liquidity)?;

    // Emit market creation event
    emit!(MarketCreatedEvent {
        market: market.key(),
        market_id: market_id.clone(),
        title: title.clone(),
        creator: ctx.accounts.creator.key(),
        end_time,
        initial_liquidity,
        category: category.clone(),
        created_at: current_time,
    });

    msg!(
        "Market created: {} - {} by {} with {} USDC initial liquidity",
        market_id,
        title,
        ctx.accounts.creator.key(),
        initial_liquidity
    );

    Ok(())
}

#[event]
pub struct MarketCreatedEvent {
    pub market: Pubkey,
    pub market_id: String,
    pub title: String,
    pub creator: Pubkey,
    pub end_time: i64,
    pub initial_liquidity: u64,
    pub category: String,
    pub created_at: i64,
}
```