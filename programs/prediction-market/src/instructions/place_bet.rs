```rust
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::state::*;
use crate::errors::*;

#[derive(Accounts)]
#[instruction(outcome: u8, amount: u64)]
pub struct PlaceBet<'info> {
    #[account(
        mut,
        seeds = [b"market", market.creator.as_ref(), market.market_id.to_le_bytes().as_ref()],
        bump = market.bump,
        constraint = market.status == MarketStatus::Active @ PredictionMarketError::MarketNotActive,
        constraint = Clock::get()?.unix_timestamp < market.end_time @ PredictionMarketError::MarketExpired,
        constraint = outcome < market.outcomes.len() as u8 @ PredictionMarketError::InvalidOutcome
    )]
    pub market: Account<'info, Market>,

    #[account(
        init_if_needed,
        payer = bettor,
        space = 8 + Bet::INIT_SPACE,
        seeds = [b"bet", market.key().as_ref(), bettor.key().as_ref()],
        bump
    )]
    pub bet: Account<'info, Bet>,

    #[account(
        mut,
        constraint = bettor_token_account.mint == market.token_mint @ PredictionMarketError::InvalidTokenMint,
        constraint = bettor_token_account.owner == bettor.key() @ PredictionMarketError::InvalidTokenOwner
    )]
    pub bettor_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [b"vault", market.key().as_ref()],
        bump = market.vault_bump,
        constraint = market_vault.mint == market.token_mint @ PredictionMarketError::InvalidTokenMint
    )]
    pub market_vault: Account<'info, TokenAccount>,

    #[account(mut)]
    pub bettor: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn place_bet(
    ctx: Context<PlaceBet>,
    outcome: u8,
    amount: u64,
) -> Result<()> {
    let market = &mut ctx.accounts.market;
    let bet = &mut ctx.accounts.bet;
    let bettor = &ctx.accounts.bettor;
    let clock = Clock::get()?;

    require!(amount > 0, PredictionMarketError::InvalidBetAmount);
    require!(
        amount >= market.min_bet_amount,
        PredictionMarketError::BetAmountTooLow
    );
    require!(
        amount <= market.max_bet_amount,
        PredictionMarketError::BetAmountTooHigh
    );

    // Calculate current odds and validate liquidity
    let total_pool = market.outcomes[outcome as usize].total_amount;
    let opposing_pool: u64 = market.outcomes
        .iter()
        .enumerate()
        .filter(|(i, _)| *i != outcome as usize)
        .map(|(_, outcome_data)| outcome_data.total_amount)
        .sum();

    // Ensure there's sufficient liquidity for potential payouts
    let potential_payout = if opposing_pool > 0 {
        amount.checked_mul(total_pool + opposing_pool)
            .and_then(|x| x.checked_div(opposing_pool))
            .ok_or(PredictionMarketError::MathOverflow)?
    } else {
        amount.checked_mul(2).ok_or(PredictionMarketError::MathOverflow)?
    };

    require!(
        potential_payout <= market.max_payout_per_bet,
        PredictionMarketError::PayoutTooHigh
    );

    // Transfer tokens from bettor to market vault
    let transfer_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.bettor_token_account.to_account_info(),
            to: ctx.accounts.market_vault.to_account_info(),
            authority: bettor.to_account_info(),
        },
    );
    token::transfer(transfer_ctx, amount)?;

    // Initialize or update bet account
    if bet.bettor == Pubkey::default() {
        bet.bettor = bettor.key();
        bet.market = market.key();
        bet.created_at = clock.unix_timestamp;
        bet.bump = ctx.bumps.bet;
        bet.outcomes = vec![BetOutcome::default(); market.outcomes.len()];
    }

    // Update bet outcome
    bet.outcomes[outcome as usize].amount = bet.outcomes[outcome as usize]
        .amount
        .checked_add(amount)
        .ok_or(PredictionMarketError::MathOverflow)?;
    
    bet.outcomes[outcome as usize].odds_at_bet = if opposing_pool > 0 {
        ((total_pool + opposing_pool) as f64 / opposing_pool as f64 * 10000.0) as u64
    } else {
        20000 // 2.0x odds when no opposing bets
    };

    bet.total_amount = bet.total_amount
        .checked_add(amount)
        .ok_or(PredictionMarketError::MathOverflow)?;
    
    bet.last_bet_at = clock.unix_timestamp;

    // Update market outcome totals
    market.outcomes[outcome as usize].total_amount = market.outcomes[outcome as usize]
        .total_amount
        .checked_add(amount)
        .ok_or(PredictionMarketError::MathOverflow)?;
    
    market.outcomes[outcome as usize].bet_count = market.outcomes[outcome as usize]
        .bet_count
        .checked_add(1)
        .ok_or(PredictionMarketError::MathOverflow)?;

    // Update market totals
    market.total_volume = market.total_volume
        .checked_add(amount)
        .ok_or(PredictionMarketError::MathOverflow)?;
    
    market.total_bets = market.total_bets
        .checked_add(1)
        .ok_or(PredictionMarketError::MathOverflow)?;

    // Update market liquidity metrics
    market.last_bet_time = clock.unix_timestamp;
    
    // Calculate new odds for all outcomes
    let total_market_pool: u64 = market.outcomes.iter().map(|o| o.total_amount).sum();
    for (i, outcome_data) in market.outcomes.iter_mut().enumerate() {
        if total_market_pool > outcome_data.total_amount {
            outcome_data.current_odds = ((total_market_pool as f64 / outcome_data.total_amount as f64) * 10000.0) as u64;
        } else {
            outcome_data.current_odds = 10000; // 1.0x odds
        }
    }

    // Emit bet placed event
    emit!(BetPlacedEvent {
        market: market.key(),
        bettor: bettor.key(),
        outcome,
        amount,
        odds: bet.outcomes[outcome as usize].odds_at_bet,
        timestamp: clock.unix_timestamp,
        total_market_volume: market.total_volume,
    });

    Ok(())
}

#[event]
pub struct BetPlacedEvent {
    pub market: Pubkey,
    pub bettor: Pubkey,
    pub outcome: u8,
    pub amount: u64,
    pub odds: u64,
    pub timestamp: i64,
    pub total_market_volume: u64,
}
```