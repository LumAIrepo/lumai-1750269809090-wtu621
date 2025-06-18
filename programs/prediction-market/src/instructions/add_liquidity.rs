```rust
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::state::*;
use crate::errors::*;

#[derive(Accounts)]
pub struct AddLiquidity<'info> {
    #[account(
        mut,
        seeds = [b"market", market.market_id.to_le_bytes().as_ref()],
        bump = market.bump,
        has_one = outcome_a_mint,
        has_one = outcome_b_mint,
        constraint = market.status == MarketStatus::Active @ PredictionMarketError::MarketNotActive,
    )]
    pub market: Account<'info, Market>,

    #[account(
        mut,
        seeds = [
            b"liquidity_pool",
            market.key().as_ref(),
        ],
        bump = liquidity_pool.bump,
        has_one = market,
        has_one = outcome_a_vault,
        has_one = outcome_b_vault,
        has_one = lp_token_mint,
    )]
    pub liquidity_pool: Account<'info, LiquidityPool>,

    #[account(
        mut,
        seeds = [
            b"user_liquidity",
            market.key().as_ref(),
            liquidity_provider.key().as_ref(),
        ],
        bump,
    )]
    pub user_liquidity_position: Account<'info, UserLiquidityPosition>,

    #[account(mut)]
    pub liquidity_provider: Signer<'info>,

    /// Token accounts for the liquidity provider
    #[account(
        mut,
        constraint = provider_outcome_a_account.mint == outcome_a_mint.key(),
        constraint = provider_outcome_a_account.owner == liquidity_provider.key(),
    )]
    pub provider_outcome_a_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = provider_outcome_b_account.mint == outcome_b_mint.key(),
        constraint = provider_outcome_b_account.owner == liquidity_provider.key(),
    )]
    pub provider_outcome_b_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = provider_lp_token_account.mint == lp_token_mint.key(),
        constraint = provider_lp_token_account.owner == liquidity_provider.key(),
    )]
    pub provider_lp_token_account: Account<'info, TokenAccount>,

    /// Market outcome token mints
    #[account(mut)]
    pub outcome_a_mint: Account<'info, token::Mint>,

    #[account(mut)]
    pub outcome_b_mint: Account<'info, token::Mint>,

    /// LP token mint
    #[account(mut)]
    pub lp_token_mint: Account<'info, token::Mint>,

    /// Liquidity pool vaults
    #[account(
        mut,
        constraint = outcome_a_vault.mint == outcome_a_mint.key(),
        constraint = outcome_a_vault.owner == liquidity_pool.key(),
    )]
    pub outcome_a_vault: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = outcome_b_vault.mint == outcome_b_mint.key(),
        constraint = outcome_b_vault.owner == liquidity_pool.key(),
    )]
    pub outcome_b_vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub clock: Sysvar<'info, Clock>,
}

pub fn add_liquidity(
    ctx: Context<AddLiquidity>,
    outcome_a_amount: u64,
    outcome_b_amount: u64,
    min_lp_tokens: u64,
) -> Result<()> {
    let market = &mut ctx.accounts.market;
    let liquidity_pool = &mut ctx.accounts.liquidity_pool;
    let user_position = &mut ctx.accounts.user_liquidity_position;
    let clock = &ctx.accounts.clock;

    // Validate input amounts
    require!(outcome_a_amount > 0, PredictionMarketError::InvalidAmount);
    require!(outcome_b_amount > 0, PredictionMarketError::InvalidAmount);

    // Check if market is still accepting liquidity
    require!(
        clock.unix_timestamp < market.resolution_time,
        PredictionMarketError::MarketExpired
    );

    // Calculate current pool reserves
    let outcome_a_reserve = ctx.accounts.outcome_a_vault.amount;
    let outcome_b_reserve = ctx.accounts.outcome_b_vault.amount;
    let total_lp_supply = ctx.accounts.lp_token_mint.supply;

    // Calculate LP tokens to mint
    let lp_tokens_to_mint = if total_lp_supply == 0 {
        // Initial liquidity provision - use geometric mean
        let initial_liquidity = (outcome_a_amount as u128)
            .checked_mul(outcome_b_amount as u128)
            .ok_or(PredictionMarketError::MathOverflow)?;
        
        // Take square root approximation
        let mut lp_amount = (initial_liquidity as f64).sqrt() as u64;
        
        // Ensure minimum liquidity
        if lp_amount < 1000 {
            lp_amount = 1000;
        }
        
        lp_amount
    } else {
        // Subsequent liquidity provision - maintain proportional ratio
        let lp_from_a = (outcome_a_amount as u128)
            .checked_mul(total_lp_supply as u128)
            .ok_or(PredictionMarketError::MathOverflow)?
            .checked_div(outcome_a_reserve as u128)
            .ok_or(PredictionMarketError::MathOverflow)? as u64;

        let lp_from_b = (outcome_b_amount as u128)
            .checked_mul(total_lp_supply as u128)
            .ok_or(PredictionMarketError::MathOverflow)?
            .checked_div(outcome_b_reserve as u128)
            .ok_or(PredictionMarketError::MathOverflow)? as u64;

        // Use the minimum to maintain pool ratio
        std::cmp::min(lp_from_a, lp_from_b)
    };

    // Check slippage protection
    require!(
        lp_tokens_to_mint >= min_lp_tokens,
        PredictionMarketError::SlippageExceeded
    );

    // Transfer outcome A tokens from provider to vault
    let transfer_a_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.provider_outcome_a_account.to_account_info(),
            to: ctx.accounts.outcome_a_vault.to_account_info(),
            authority: ctx.accounts.liquidity_provider.to_account_info(),
        },
    );
    token::transfer(transfer_a_ctx, outcome_a_amount)?;

    // Transfer outcome B tokens from provider to vault
    let transfer_b_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.provider_outcome_b_account.to_account_info(),
            to: ctx.accounts.outcome_b_vault.to_account_info(),
            authority: ctx.accounts.liquidity_provider.to_account_info(),
        },
    );
    token::transfer(transfer_b_ctx, outcome_b_amount)?;

    // Mint LP tokens to provider
    let market_key = market.key();
    let seeds = &[
        b"liquidity_pool",
        market_key.as_ref(),
        &[liquidity_pool.bump],
    ];
    let signer_seeds = &[&seeds[..]];

    let mint_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        token::MintTo {
            mint: ctx.accounts.lp_token_mint.to_account_info(),
            to: ctx.accounts.provider_lp_token_account.to_account_info(),
            authority: liquidity_pool.to_account_info(),
        },
        signer_seeds,
    );
    token::mint_to(mint_ctx, lp_tokens_to_mint)?;

    // Update user liquidity position
    user_position.lp_tokens = user_position.lp_tokens
        .checked_add(lp_tokens_to_mint)
        .ok_or(PredictionMarketError::MathOverflow)?;
    
    user_position.outcome_a_contributed = user_position.outcome_a_contributed
        .checked_add(outcome_a_amount)
        .ok_or(PredictionMarketError::MathOverflow)?;
    
    user_position.outcome_b_contributed = user_position.outcome_b_contributed
        .checked_add(outcome_b_amount)
        .ok_or(PredictionMarketError::MathOverflow)?;
    
    user_position.last_update_time = clock.unix_timestamp;

    // Update liquidity pool stats
    liquidity_pool.total_liquidity = liquidity_pool.total_liquidity
        .checked_add(lp_tokens_to_mint)
        .ok_or(PredictionMarketError::MathOverflow)?;
    
    liquidity_pool.outcome_a_reserve = liquidity_pool.outcome_a_reserve
        .checked_add(outcome_a_amount)
        .ok_or(PredictionMarketError::MathOverflow)?;
    
    liquidity_pool.outcome_b_reserve = liquidity_pool.outcome_b_reserve
        .checked_add(outcome_b_amount)
        .ok_or(PredictionMarketError::MathOverflow)?;
    
    liquidity_pool.last_update_time = clock.unix_timestamp;

    // Update market total liquidity
    market.total_liquidity = market.total_liquidity
        .checked_add(outcome_a_amount.checked_add(outcome_b_amount).ok_or(PredictionMarketError::MathOverflow)?)
        .ok_or(PredictionMarketError::MathOverflow)?;

    // Emit event
    emit!(LiquidityAddedEvent {
        market: market.key(),
        liquidity_provider: ctx.accounts.liquidity_provider.key(),
        outcome_a_amount,
        outcome_b_amount,
        lp_tokens_minted: lp_tokens_to_mint,
        timestamp: clock.unix_timestamp,
    });

    msg!(
        "Added liquidity: {} outcome A, {} outcome B tokens, minted {} LP tokens",
        outcome_a_amount,
        outcome_b_amount,
        lp_tokens_to_mint
    );

    Ok(())
}

#[event]
pub struct LiquidityAddedEvent {
    pub market: Pubkey,
    pub liquidity_provider: Pubkey,
    pub outcome_a_amount: u64,
    pub outcome_b_amount: u64,
    pub lp_tokens_minted: u64,
    pub timestamp: i64,
}
```