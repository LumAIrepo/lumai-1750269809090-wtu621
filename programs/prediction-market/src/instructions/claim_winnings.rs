```rust
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

use crate::state::*;
use crate::errors::*;

#[derive(Accounts)]
pub struct ClaimWinnings<'info> {
    #[account(
        mut,
        seeds = [b"market", market.creator.as_ref(), &market.market_id.to_le_bytes()],
        bump = market.bump,
        constraint = market.status == MarketStatus::Resolved @ PredictionMarketError::MarketNotResolved,
    )]
    pub market: Account<'info, Market>,

    #[account(
        mut,
        seeds = [b"position", market.key().as_ref(), user.key().as_ref()],
        bump = position.bump,
        constraint = position.market == market.key() @ PredictionMarketError::InvalidPosition,
        constraint = position.user == user.key() @ PredictionMarketError::InvalidPosition,
        constraint = !position.claimed @ PredictionMarketError::AlreadyClaimed,
    )]
    pub position: Account<'info, Position>,

    #[account(
        mut,
        seeds = [b"market_vault", market.key().as_ref()],
        bump = market.vault_bump,
    )]
    pub market_vault: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = user_token_account.mint == market.token_mint @ PredictionMarketError::InvalidTokenAccount,
        constraint = user_token_account.owner == user.key() @ PredictionMarketError::InvalidTokenAccount,
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

impl<'info> ClaimWinnings<'info> {
    pub fn claim_winnings(&mut self) -> Result<()> {
        let market = &mut self.market;
        let position = &mut self.position;

        // Calculate winnings based on position and market outcome
        let winnings = self.calculate_winnings()?;

        require!(winnings > 0, PredictionMarketError::NoWinnings);

        // Mark position as claimed
        position.claimed = true;
        position.claimed_at = Clock::get()?.unix_timestamp;

        // Transfer winnings from market vault to user
        let market_key = market.key();
        let seeds = &[
            b"market_vault",
            market_key.as_ref(),
            &[market.vault_bump],
        ];
        let signer_seeds = &[&seeds[..]];

        let transfer_ctx = CpiContext::new_with_signer(
            self.token_program.to_account_info(),
            Transfer {
                from: self.market_vault.to_account_info(),
                to: self.user_token_account.to_account_info(),
                authority: self.market_vault.to_account_info(),
            },
            signer_seeds,
        );

        token::transfer(transfer_ctx, winnings)?;

        // Update market statistics
        market.total_claimed = market.total_claimed.checked_add(winnings)
            .ok_or(PredictionMarketError::MathOverflow)?;

        emit!(WinningsClaimedEvent {
            market: market.key(),
            user: self.user.key(),
            position: position.key(),
            amount: winnings,
            outcome: position.outcome,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    fn calculate_winnings(&self) -> Result<u64> {
        let market = &self.market;
        let position = &self.position;

        // Check if user's position matches the winning outcome
        let winning_outcome = match market.resolved_outcome {
            Some(outcome) => outcome,
            None => return Err(PredictionMarketError::MarketNotResolved.into()),
        };

        if position.outcome != winning_outcome {
            return Ok(0); // No winnings for losing positions
        }

        // Calculate winnings based on position size and odds
        let total_winning_pool = match winning_outcome {
            Outcome::Yes => market.yes_pool,
            Outcome::No => market.no_pool,
        };

        let total_losing_pool = match winning_outcome {
            Outcome::Yes => market.no_pool,
            Outcome::No => market.yes_pool,
        };

        // Winnings = (position_size / total_winning_pool) * (total_losing_pool + total_winning_pool) - fees
        let total_pool = total_winning_pool.checked_add(total_losing_pool)
            .ok_or(PredictionMarketError::MathOverflow)?;

        let gross_winnings = (position.amount as u128)
            .checked_mul(total_pool as u128)
            .ok_or(PredictionMarketError::MathOverflow)?
            .checked_div(total_winning_pool as u128)
            .ok_or(PredictionMarketError::MathOverflow)?;

        // Apply platform fee (e.g., 2%)
        let platform_fee = gross_winnings
            .checked_mul(market.fee_rate as u128)
            .ok_or(PredictionMarketError::MathOverflow)?
            .checked_div(10000) // fee_rate is in basis points
            .ok_or(PredictionMarketError::MathOverflow)?;

        let net_winnings = gross_winnings
            .checked_sub(platform_fee)
            .ok_or(PredictionMarketError::MathOverflow)?;

        // Ensure winnings don't exceed u64 max
        if net_winnings > u64::MAX as u128 {
            return Err(PredictionMarketError::MathOverflow.into());
        }

        Ok(net_winnings as u64)
    }
}

#[event]
pub struct WinningsClaimedEvent {
    pub market: Pubkey,
    pub user: Pubkey,
    pub position: Pubkey,
    pub amount: u64,
    pub outcome: Outcome,
    pub timestamp: i64,
}
```