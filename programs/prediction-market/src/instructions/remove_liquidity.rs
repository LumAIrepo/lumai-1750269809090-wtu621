```rust
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::state::*;
use crate::errors::*;

#[derive(Accounts)]
pub struct RemoveLiquidity<'info> {
    #[account(
        mut,
        seeds = [b"market", market.event_id.as_bytes()],
        bump = market.bump,
        has_one = authority
    )]
    pub market: Account<'info, Market>,

    #[account(
        mut,
        seeds = [b"liquidity_pool", market.key().as_ref()],
        bump = liquidity_pool.bump
    )]
    pub liquidity_pool: Account<'info, LiquidityPool>,

    #[account(
        mut,
        seeds = [b"liquidity_position", market.key().as_ref(), liquidity_provider.key().as_ref()],
        bump = liquidity_position.bump,
        has_one = liquidity_provider,
        has_one = market
    )]
    pub liquidity_position: Account<'info, LiquidityPosition>,

    #[account(
        mut,
        associated_token::mint = market.base_mint,
        associated_token::authority = liquidity_pool
    )]
    pub pool_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint = market.base_mint,
        associated_token::authority = liquidity_provider
    )]
    pub provider_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint = liquidity_pool.lp_mint,
        associated_token::authority = liquidity_provider
    )]
    pub provider_lp_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint = liquidity_pool.lp_mint,
        associated_token::authority = liquidity_pool
    )]
    pub pool_lp_token_account: Account<'info, TokenAccount>,

    /// CHECK: This is the mint authority for LP tokens
    #[account(
        seeds = [b"lp_mint_authority", liquidity_pool.key().as_ref()],
        bump = liquidity_pool.lp_mint_authority_bump
    )]
    pub lp_mint_authority: UncheckedAccount<'info>,

    pub liquidity_provider: Signer<'info>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

impl<'info> RemoveLiquidity<'info> {
    pub fn remove_liquidity(&mut self, lp_tokens_to_burn: u64) -> Result<()> {
        let market = &mut self.market;
        let liquidity_pool = &mut self.liquidity_pool;
        let liquidity_position = &mut self.liquidity_position;

        // Validate market state
        require!(
            market.status == MarketStatus::Active || market.status == MarketStatus::Resolved,
            PredictionMarketError::MarketNotActive
        );

        // Validate LP token amount
        require!(
            lp_tokens_to_burn > 0,
            PredictionMarketError::InvalidAmount
        );

        require!(
            lp_tokens_to_burn <= liquidity_position.lp_tokens,
            PredictionMarketError::InsufficientLpTokens
        );

        // Calculate withdrawal amounts based on pool share
        let total_lp_supply = liquidity_pool.total_lp_tokens;
        let pool_balance = self.pool_token_account.amount;
        
        require!(
            total_lp_supply > 0,
            PredictionMarketError::EmptyPool
        );

        // Calculate proportional withdrawal amount
        let withdrawal_amount = (pool_balance as u128)
            .checked_mul(lp_tokens_to_burn as u128)
            .ok_or(PredictionMarketError::MathOverflow)?
            .checked_div(total_lp_supply as u128)
            .ok_or(PredictionMarketError::MathOverflow)? as u64;

        require!(
            withdrawal_amount > 0,
            PredictionMarketError::InvalidAmount
        );

        require!(
            withdrawal_amount <= pool_balance,
            PredictionMarketError::InsufficientPoolBalance
        );

        // Calculate fees if market is still active
        let (net_withdrawal, fee_amount) = if market.status == MarketStatus::Active {
            let fee_amount = withdrawal_amount
                .checked_mul(liquidity_pool.withdrawal_fee_bps as u64)
                .ok_or(PredictionMarketError::MathOverflow)?
                .checked_div(10000)
                .ok_or(PredictionMarketError::MathOverflow)?;
            
            let net_withdrawal = withdrawal_amount
                .checked_sub(fee_amount)
                .ok_or(PredictionMarketError::MathOverflow)?;
            
            (net_withdrawal, fee_amount)
        } else {
            (withdrawal_amount, 0)
        };

        // Transfer tokens from pool to liquidity provider
        let pool_seeds = &[
            b"liquidity_pool",
            market.key().as_ref(),
            &[liquidity_pool.bump]
        ];
        let pool_signer = &[&pool_seeds[..]];

        token::transfer(
            CpiContext::new_with_signer(
                self.token_program.to_account_info(),
                Transfer {
                    from: self.pool_token_account.to_account_info(),
                    to: self.provider_token_account.to_account_info(),
                    authority: liquidity_pool.to_account_info(),
                },
                pool_signer,
            ),
            net_withdrawal,
        )?;

        // Burn LP tokens from provider
        token::burn(
            CpiContext::new_with_signer(
                self.token_program.to_account_info(),
                token::Burn {
                    mint: liquidity_pool.lp_mint.to_account_info(),
                    from: self.provider_lp_token_account.to_account_info(),
                    authority: self.liquidity_provider.to_account_info(),
                },
                &[],
            ),
            lp_tokens_to_burn,
        )?;

        // Update liquidity position
        liquidity_position.lp_tokens = liquidity_position.lp_tokens
            .checked_sub(lp_tokens_to_burn)
            .ok_or(PredictionMarketError::MathOverflow)?;

        liquidity_position.base_amount = liquidity_position.base_amount
            .checked_sub(withdrawal_amount)
            .ok_or(PredictionMarketError::MathOverflow)?;

        liquidity_position.last_interaction = Clock::get()?.unix_timestamp;

        // Update liquidity pool state
        liquidity_pool.total_liquidity = liquidity_pool.total_liquidity
            .checked_sub(withdrawal_amount)
            .ok_or(PredictionMarketError::MathOverflow)?;

        liquidity_pool.total_lp_tokens = liquidity_pool.total_lp_tokens
            .checked_sub(lp_tokens_to_burn)
            .ok_or(PredictionMarketError::MathOverflow)?;

        if fee_amount > 0 {
            liquidity_pool.total_fees_collected = liquidity_pool.total_fees_collected
                .checked_add(fee_amount)
                .ok_or(PredictionMarketError::MathOverflow)?;
        }

        // Update market liquidity
        market.total_liquidity = market.total_liquidity
            .checked_sub(withdrawal_amount)
            .ok_or(PredictionMarketError::MathOverflow)?;

        // Close position if no LP tokens remaining
        if liquidity_position.lp_tokens == 0 {
            liquidity_position.is_active = false;
            liquidity_pool.active_providers = liquidity_pool.active_providers
                .checked_sub(1)
                .ok_or(PredictionMarketError::MathOverflow)?;
        }

        // Emit event
        emit!(LiquidityRemovedEvent {
            market: market.key(),
            liquidity_provider: self.liquidity_provider.key(),
            lp_tokens_burned: lp_tokens_to_burn,
            base_amount_withdrawn: net_withdrawal,
            fee_amount,
            remaining_lp_tokens: liquidity_position.lp_tokens,
            pool_total_liquidity: liquidity_pool.total_liquidity,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }
}

#[event]
pub struct LiquidityRemovedEvent {
    pub market: Pubkey,
    pub liquidity_provider: Pubkey,
    pub lp_tokens_burned: u64,
    pub base_amount_withdrawn: u64,
    pub fee_amount: u64,
    pub remaining_lp_tokens: u64,
    pub pool_total_liquidity: u64,
    pub timestamp: i64,
}
```