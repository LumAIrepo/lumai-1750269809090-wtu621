```rust
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("PredMktProgram11111111111111111111111111111");

#[program]
pub mod prediction_market {
    use super::*;

    pub fn initialize_market(
        ctx: Context<InitializeMarket>,
        market_id: u64,
        title: String,
        description: String,
        category: String,
        resolution_time: i64,
        oracle_pubkey: Pubkey,
        min_bet_amount: u64,
    ) -> Result<()> {
        let market = &mut ctx.accounts.market;
        let clock = Clock::get()?;

        require!(resolution_time > clock.unix_timestamp, ErrorCode::InvalidResolutionTime);
        require!(title.len() <= 100, ErrorCode::TitleTooLong);
        require!(description.len() <= 500, ErrorCode::DescriptionTooLong);
        require!(min_bet_amount > 0, ErrorCode::InvalidMinBetAmount);

        market.market_id = market_id;
        market.title = title;
        market.description = description;
        market.category = category;
        market.creator = ctx.accounts.creator.key();
        market.oracle = oracle_pubkey;
        market.resolution_time = resolution_time;
        market.creation_time = clock.unix_timestamp;
        market.status = MarketStatus::Active;
        market.total_yes_amount = 0;
        market.total_no_amount = 0;
        market.total_volume = 0;
        market.min_bet_amount = min_bet_amount;
        market.resolved_outcome = None;
        market.resolution_timestamp = None;
        market.bump = ctx.bumps.market;

        emit!(MarketCreated {
            market_id,
            creator: ctx.accounts.creator.key(),
            title: market.title.clone(),
            resolution_time,
        });

        Ok(())
    }

    pub fn place_bet(
        ctx: Context<PlaceBet>,
        market_id: u64,
        outcome: bool,
        amount: u64,
    ) -> Result<()> {
        let market = &mut ctx.accounts.market;
        let bet = &mut ctx.accounts.bet;
        let clock = Clock::get()?;

        require!(market.status == MarketStatus::Active, ErrorCode::MarketNotActive);
        require!(clock.unix_timestamp < market.resolution_time, ErrorCode::MarketExpired);
        require!(amount >= market.min_bet_amount, ErrorCode::BetAmountTooLow);

        // Transfer tokens from bettor to market vault
        let cpi_accounts = Transfer {
            from: ctx.accounts.bettor_token_account.to_account_info(),
            to: ctx.accounts.market_vault.to_account_info(),
            authority: ctx.accounts.bettor.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, amount)?;

        // Update market totals
        if outcome {
            market.total_yes_amount = market.total_yes_amount.checked_add(amount).ok_or(ErrorCode::Overflow)?;
        } else {
            market.total_no_amount = market.total_no_amount.checked_add(amount).ok_or(ErrorCode::Overflow)?;
        }
        market.total_volume = market.total_volume.checked_add(amount).ok_or(ErrorCode::Overflow)?;

        // Initialize bet account
        bet.market = market.key();
        bet.bettor = ctx.accounts.bettor.key();
        bet.outcome = outcome;
        bet.amount = amount;
        bet.timestamp = clock.unix_timestamp;
        bet.claimed = false;
        bet.bump = ctx.bumps.bet;

        emit!(BetPlaced {
            market_id,
            bettor: ctx.accounts.bettor.key(),
            outcome,
            amount,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    pub fn resolve_market(
        ctx: Context<ResolveMarket>,
        market_id: u64,
        outcome: bool,
    ) -> Result<()> {
        let market = &mut ctx.accounts.market;
        let clock = Clock::get()?;

        require!(market.status == MarketStatus::Active, ErrorCode::MarketNotActive);
        require!(ctx.accounts.oracle.key() == market.oracle, ErrorCode::UnauthorizedOracle);
        require!(clock.unix_timestamp >= market.resolution_time, ErrorCode::MarketNotExpired);

        market.status = MarketStatus::Resolved;
        market.resolved_outcome = Some(outcome);
        market.resolution_timestamp = Some(clock.unix_timestamp);

        emit!(MarketResolved {
            market_id,
            outcome,
            resolution_timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    pub fn claim_winnings(
        ctx: Context<ClaimWinnings>,
        market_id: u64,
    ) -> Result<()> {
        let market = &ctx.accounts.market;
        let bet = &mut ctx.accounts.bet;

        require!(market.status == MarketStatus::Resolved, ErrorCode::MarketNotResolved);
        require!(!bet.claimed, ErrorCode::AlreadyClaimed);
        require!(bet.bettor == ctx.accounts.bettor.key(), ErrorCode::UnauthorizedClaimer);

        let resolved_outcome = market.resolved_outcome.ok_or(ErrorCode::MarketNotResolved)?;
        require!(bet.outcome == resolved_outcome, ErrorCode::LosingBet);

        // Calculate winnings
        let total_winning_amount = if resolved_outcome {
            market.total_yes_amount
        } else {
            market.total_no_amount
        };

        let total_pool = market.total_yes_amount.checked_add(market.total_no_amount).ok_or(ErrorCode::Overflow)?;
        let winnings = (bet.amount as u128)
            .checked_mul(total_pool as u128)
            .ok_or(ErrorCode::Overflow)?
            .checked_div(total_winning_amount as u128)
            .ok_or(ErrorCode::DivisionByZero)?
            as u64;

        // Transfer winnings from market vault to bettor
        let seeds = &[
            b"market",
            &market.market_id.to_le_bytes(),
            &[market.bump],
        ];
        let signer = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.market_vault.to_account_info(),
            to: ctx.accounts.bettor_token_account.to_account_info(),
            authority: market.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        token::transfer(cpi_ctx, winnings)?;

        bet.claimed = true;

        emit!(WinningsClaimed {
            market_id,
            bettor: ctx.accounts.bettor.key(),
            amount: winnings,
        });

        Ok(())
    }

    pub fn cancel_market(
        ctx: Context<CancelMarket>,
        market_id: u64,
    ) -> Result<()> {
        let market = &mut ctx.accounts.market;
        let clock = Clock::get()?;

        require!(market.status == MarketStatus::Active, ErrorCode::MarketNotActive);
        require!(
            ctx.accounts.authority.key() == market.creator || 
            ctx.accounts.authority.key() == market.oracle,
            ErrorCode::UnauthorizedCancel
        );
        require!(clock.unix_timestamp < market.resolution_time, ErrorCode::MarketExpired);

        market.status = MarketStatus::Cancelled;

        emit!(MarketCancelled {
            market_id,
            cancelled_by: ctx.accounts.authority.key(),
        });

        Ok(())
    }

    pub fn refund_bet(
        ctx: Context<RefundBet>,
        market_id: u64,
    ) -> Result<()> {
        let market = &ctx.accounts.market;
        let bet = &mut ctx.accounts.bet;

        require!(market.status == MarketStatus::Cancelled, ErrorCode::MarketNotCancelled);
        require!(!bet.claimed, ErrorCode::AlreadyClaimed);
        require!(bet.bettor == ctx.accounts.bettor.key(), ErrorCode::UnauthorizedClaimer);

        // Transfer bet amount back to bettor
        let seeds = &[
            b"market",
            &market.market_id.to_le_bytes(),
            &[market.bump],
        ];
        let signer = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.market_vault.to_account_info(),
            to: ctx.accounts.bettor_token_account.to_account_info(),
            authority: market.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        token::transfer(cpi_ctx, bet.amount)?;

        bet.claimed = true;

        emit!(BetRefunded {
            market_id,
            bettor: ctx.accounts.bettor.key(),
            amount: bet.amount,
        });

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(market_id: u64)]
pub struct InitializeMarket<'info> {
    #[account(
        init,
        payer = creator,
        space = Market::LEN,
        seeds = [b"market", &market_id.to_le_bytes()],
        bump
    )]
    pub market: Account<'info, Market>,
    
    #[account(
        init,
        payer = creator,
        token::mint = mint,
        token::authority = market,
        seeds = [b"vault", &market_id.to_le_bytes()],
        bump
    )]
    pub market_vault: Account<'info, TokenAccount>,
    
    pub mint: Account<'info, anchor_spl::token::Mint>,
    
    #[account(mut)]
    pub creator: Signer<'info>,
    
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(market_id: u64)]
pub struct PlaceBet<'info> {
    #[account(
        mut,
        seeds = [b"market", &market_id.to_le_bytes()],
        bump = market.bump
    )]
    pub market: Account<'info, Market>,
    
    #[account(
        init,
        payer = bettor,
        space = Bet::LEN,
        seeds = [b"bet", market.key().as_ref(), bettor.key().as_ref()],
        bump
    )]
    pub bet: Account<'info, Bet>,
    
    #[account(
        mut,
        seeds = [b"vault", &market_id.to_le_bytes()],
        bump
    )]
    pub market_vault: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub bettor_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub bettor: Signer<'info>,
    
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
#[instruction(market_id: u64)]
pub struct ResolveMarket<'info> {
    #[account(
        mut,
        seeds = [b"market", &market_id.to_le_bytes()],
        bump = market.bump
    )]
    pub market: Account<'info, Market>,
    
    pub oracle: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(market_id: u64)]
pub struct ClaimWinnings<'info> {
    #[account(
        seeds = [b"market", &market_id.to_le_bytes()],
        bump = market.bump
    )]
    pub market: Account<'info, Market>,
    
    #[account(
        mut,
        seeds = [b"bet", market.key().as_ref(), bettor.key().as_ref()],
        bump = bet.bump
    )]
    pub bet: Account<'info, Bet>,
    
    #[account(
        mut,
        seeds = [b"vault", &market_id.to_le_bytes()],
        bump
    )]
    pub market_vault: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub bettor_token_account: Account<'info, TokenAccount>,
    
    pub bettor: Signer<'info>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
#[instruction(market_id: u64)]
pub struct CancelMarket<'info> {
    #[account(
        mut,
        seeds = [b"market", &market_id.to_le_bytes()],
        bump = market.bump
    )]
    pub market: Account<'info, Market>,
    
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(market_id: u64)]
pub struct RefundBet<'info> {
    #[account(
        seeds = [b"market", &market_id.to_le_bytes()],
        bump = market.bump
    )]
    pub market: Account<'info, Market>,
    
    #[account(
        mut,
        seeds = [b"bet", market.key().as_ref(), bettor.key().as_ref()],
        bump = bet.bump
    )]
    pub bet: Account<'info, Bet>,
    
    #[account(
        mut,
        seeds = [b"vault", &market_id.to_le_bytes()],
        bump
    )]
    pub market_vault: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub bettor_token_account: Account<'info, TokenAccount>,
    
    pub bettor: Signer<'info>,
    
    pub token_program: Program<'info, Token>,
}

#[account]
pub struct Market {
    pub market_id: u64,
    pub title: String,
    pub description: String,
    pub category: String,
    pub creator: Pubkey,
    pub oracle: Pubkey,
    pub resolution_time: i64,
    pub creation_time: i64,
    pub status: MarketStatus,
    pub total_yes_amount: u64,
    pub total_no_amount: u64,
    pub total_volume: u64,
    pub min_bet_amount: u64,
    pub resolved_outcome: Option<bool>,
    pub resolution_timestamp: Option<i64>,
    pub bump: u8,
}

impl Market {
    pub const LEN: usize = 8 + // discriminator
        8 + // market_id
        4 + 100 + // title (String)