```rust
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::state::*;
use crate::errors::*;

#[derive(Accounts)]
pub struct ResolveMarket<'info> {
    #[account(
        mut,
        seeds = [b"market", market.creator.as_ref(), &market.market_id.to_le_bytes()],
        bump = market.bump,
        constraint = market.status == MarketStatus::Active @ PredictionMarketError::MarketNotActive,
        constraint = market.resolution_time <= Clock::get()?.unix_timestamp @ PredictionMarketError::MarketNotExpired
    )]
    pub market: Account<'info, Market>,

    #[account(
        constraint = oracle.key() == market.oracle @ PredictionMarketError::InvalidOracle
    )]
    pub oracle: Signer<'info>,

    #[account(
        mut,
        seeds = [b"vault", market.key().as_ref()],
        bump = market.vault_bump,
        token::mint = market.token_mint,
        token::authority = vault_authority
    )]
    pub vault: Account<'info, TokenAccount>,

    /// CHECK: This is a PDA used as the vault authority
    #[account(
        seeds = [b"vault_authority", market.key().as_ref()],
        bump = market.vault_authority_bump
    )]
    pub vault_authority: UncheckedAccount<'info>,

    #[account(
        mut,
        seeds = [b"protocol_fee", market.key().as_ref()],
        bump,
        token::mint = market.token_mint,
        token::authority = protocol_fee_authority
    )]
    pub protocol_fee_account: Account<'info, TokenAccount>,

    /// CHECK: This is a PDA used as the protocol fee authority
    #[account(
        seeds = [b"protocol_fee_authority"],
        bump
    )]
    pub protocol_fee_authority: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

impl<'info> ResolveMarket<'info> {
    pub fn resolve_market(&mut self, outcome: u8, oracle_data: Vec<u8>) -> Result<()> {
        let market = &mut self.market;
        
        // Validate outcome
        require!(outcome < market.outcomes.len() as u8, PredictionMarketError::InvalidOutcome);
        
        // Validate oracle data if required
        if !oracle_data.is_empty() {
            require!(oracle_data.len() <= 256, PredictionMarketError::OracleDataTooLarge);
        }

        // Update market state
        market.status = MarketStatus::Resolved;
        market.winning_outcome = Some(outcome);
        market.resolution_timestamp = Clock::get()?.unix_timestamp;
        market.oracle_data = oracle_data;

        // Calculate protocol fee
        let total_pool = market.total_pool;
        let protocol_fee = total_pool
            .checked_mul(market.protocol_fee_rate as u64)
            .ok_or(PredictionMarketError::MathOverflow)?
            .checked_div(10000)
            .ok_or(PredictionMarketError::MathOverflow)?;

        // Transfer protocol fee
        if protocol_fee > 0 {
            let seeds = &[
                b"vault_authority",
                market.key().as_ref(),
                &[market.vault_authority_bump]
            ];
            let signer_seeds = &[&seeds[..]];

            let transfer_ctx = CpiContext::new_with_signer(
                self.token_program.to_account_info(),
                Transfer {
                    from: self.vault.to_account_info(),
                    to: self.protocol_fee_account.to_account_info(),
                    authority: self.vault_authority.to_account_info(),
                },
                signer_seeds,
            );

            token::transfer(transfer_ctx, protocol_fee)?;
        }

        // Update winning pool amount (after protocol fee)
        let winning_outcome_index = outcome as usize;
        let winning_pool = market.outcome_pools[winning_outcome_index];
        let remaining_pool = total_pool.checked_sub(protocol_fee).ok_or(PredictionMarketError::MathOverflow)?;
        
        // Calculate payout ratio for winners
        if winning_pool > 0 {
            market.payout_ratio = remaining_pool
                .checked_mul(10000)
                .ok_or(PredictionMarketError::MathOverflow)?
                .checked_div(winning_pool)
                .ok_or(PredictionMarketError::MathOverflow)?;
        } else {
            // No winners, all funds go to protocol (already transferred above)
            market.payout_ratio = 0;
        }

        emit!(MarketResolvedEvent {
            market: market.key(),
            winning_outcome: outcome,
            total_pool,
            winning_pool,
            payout_ratio: market.payout_ratio,
            protocol_fee,
            resolution_timestamp: market.resolution_timestamp,
        });

        Ok(())
    }
}

#[event]
pub struct MarketResolvedEvent {
    pub market: Pubkey,
    pub winning_outcome: u8,
    pub total_pool: u64,
    pub winning_pool: u64,
    pub payout_ratio: u64,
    pub protocol_fee: u64,
    pub resolution_timestamp: i64,
}
```