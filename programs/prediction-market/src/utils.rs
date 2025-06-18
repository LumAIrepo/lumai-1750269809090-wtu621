```rust
use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount, Mint};
use std::collections::BTreeMap;

/// Calculate betting odds based on total stakes
pub fn calculate_odds(yes_stakes: u64, no_stakes: u64) -> Result<(u64, u64)> {
    if yes_stakes == 0 && no_stakes == 0 {
        return Ok((5000, 5000)); // 50/50 odds in basis points
    }
    
    let total_stakes = yes_stakes.checked_add(no_stakes)
        .ok_or(ProgramError::ArithmeticOverflow)?;
    
    if total_stakes == 0 {
        return Ok((5000, 5000));
    }
    
    // Calculate implied probability in basis points (0-10000)
    let yes_probability = (yes_stakes as u128)
        .checked_mul(10000)
        .ok_or(ProgramError::ArithmeticOverflow)?
        .checked_div(total_stakes as u128)
        .ok_or(ProgramError::ArithmeticOverflow)? as u64;
    
    let no_probability = 10000_u64.checked_sub(yes_probability)
        .ok_or(ProgramError::ArithmeticOverflow)?;
    
    Ok((yes_probability, no_probability))
}

/// Calculate payout for a winning bet
pub fn calculate_payout(
    bet_amount: u64,
    winning_stakes: u64,
    losing_stakes: u64,
    house_edge_bps: u64,
) -> Result<u64> {
    if winning_stakes == 0 {
        return Ok(0);
    }
    
    let total_pool = winning_stakes.checked_add(losing_stakes)
        .ok_or(ProgramError::ArithmeticOverflow)?;
    
    // Calculate house edge
    let house_fee = (total_pool as u128)
        .checked_mul(house_edge_bps as u128)
        .ok_or(ProgramError::ArithmeticOverflow)?
        .checked_div(10000)
        .ok_or(ProgramError::ArithmeticOverflow)? as u64;
    
    let net_pool = total_pool.checked_sub(house_fee)
        .ok_or(ProgramError::ArithmeticOverflow)?;
    
    // Calculate proportional payout
    let payout = (bet_amount as u128)
        .checked_mul(net_pool as u128)
        .ok_or(ProgramError::ArithmeticOverflow)?
        .checked_div(winning_stakes as u128)
        .ok_or(ProgramError::ArithmeticOverflow)? as u64;
    
    Ok(payout)
}

/// Calculate market liquidity score
pub fn calculate_liquidity_score(yes_stakes: u64, no_stakes: u64) -> u64 {
    let total_stakes = yes_stakes.saturating_add(no_stakes);
    let balance_ratio = if yes_stakes > no_stakes {
        (no_stakes as u128 * 10000) / (yes_stakes as u128).max(1)
    } else {
        (yes_stakes as u128 * 10000) / (no_stakes as u128).max(1)
    };
    
    // Score based on total volume and balance
    let volume_score = (total_stakes / 1_000_000).min(5000); // Max 5000 points for volume
    let balance_score = (balance_ratio / 2).min(5000) as u64; // Max 5000 points for balance
    
    volume_score + balance_score
}

/// Validate market resolution timestamp
pub fn validate_resolution_time(
    current_timestamp: i64,
    market_end_time: i64,
    resolution_window: i64,
) -> Result<bool> {
    if current_timestamp < market_end_time {
        return Ok(false); // Market hasn't ended yet
    }
    
    let max_resolution_time = market_end_time
        .checked_add(resolution_window)
        .ok_or(ProgramError::ArithmeticOverflow)?;
    
    Ok(current_timestamp <= max_resolution_time)
}

/// Calculate minimum bet amount based on market parameters
pub fn calculate_min_bet_amount(
    total_stakes: u64,
    min_bet_lamports: u64,
    dynamic_scaling: bool,
) -> u64 {
    if !dynamic_scaling {
        return min_bet_lamports;
    }
    
    // Scale minimum bet based on market size
    let scale_factor = (total_stakes / 10_000_000_000).max(1); // Scale per 10 SOL
    min_bet_lamports.saturating_mul(scale_factor).min(1_000_000_000) // Cap at 1 SOL
}

/// Validate oracle signature for market resolution
pub fn validate_oracle_signature(
    oracle_pubkey: &Pubkey,
    market_id: &Pubkey,
    outcome: bool,
    timestamp: i64,
    signature: &[u8; 64],
) -> Result<bool> {
    // Create message to verify
    let mut message = Vec::new();
    message.extend_from_slice(&market_id.to_bytes());
    message.push(if outcome { 1 } else { 0 });
    message.extend_from_slice(&timestamp.to_le_bytes());
    
    // In a real implementation, you would verify the signature here
    // For now, we'll do basic validation
    Ok(signature.len() == 64 && oracle_pubkey != &Pubkey::default())
}

/// Calculate market maker rewards
pub fn calculate_market_maker_rewards(
    provided_liquidity: u64,
    total_volume: u64,
    reward_rate_bps: u64,
) -> Result<u64> {
    if total_volume == 0 {
        return Ok(0);
    }
    
    let reward = (provided_liquidity as u128)
        .checked_mul(total_volume as u128)
        .ok_or(ProgramError::ArithmeticOverflow)?
        .checked_mul(reward_rate_bps as u128)
        .ok_or(ProgramError::ArithmeticOverflow)?
        .checked_div(10000 * 1_000_000_000) // Normalize to SOL
        .ok_or(ProgramError::ArithmeticOverflow)? as u64;
    
    Ok(reward)
}

/// Calculate price impact for large bets
pub fn calculate_price_impact(
    bet_amount: u64,
    current_stakes: u64,
    impact_threshold: u64,
) -> u64 {
    if bet_amount < impact_threshold {
        return 0;
    }
    
    let ratio = (bet_amount as u128 * 10000) / (current_stakes as u128).max(1);
    (ratio / 100).min(500) as u64 // Max 5% impact in basis points
}

/// Validate market category and subcategory
pub fn validate_market_category(category: u8, subcategory: u8) -> bool {
    match category {
        0 => subcategory <= 10, // Sports
        1 => subcategory <= 15, // Politics
        2 => subcategory <= 8,  // Economics
        3 => subcategory <= 12, // Entertainment
        4 => subcategory <= 20, // Crypto
        5 => subcategory <= 5,  // Weather
        _ => false,
    }
}

/// Calculate time-weighted average price
pub fn calculate_twap(
    price_history: &[(i64, u64)], // (timestamp, price)
    window_seconds: i64,
    current_time: i64,
) -> Option<u64> {
    if price_history.is_empty() {
        return None;
    }
    
    let start_time = current_time - window_seconds;
    let relevant_prices: Vec<_> = price_history
        .iter()
        .filter(|(timestamp, _)| *timestamp >= start_time)
        .collect();
    
    if relevant_prices.is_empty() {
        return None;
    }
    
    let mut weighted_sum = 0u128;
    let mut total_weight = 0u128;
    
    for i in 0..relevant_prices.len() {
        let (timestamp, price) = relevant_prices[i];
        let weight = if i == relevant_prices.len() - 1 {
            (current_time - timestamp) as u128
        } else {
            (relevant_prices[i + 1].0 - timestamp) as u128
        };
        
        weighted_sum += (*price as u128) * weight;
        total_weight += weight;
    }
    
    if total_weight == 0 {
        return None;
    }
    
    Some((weighted_sum / total_weight) as u64)
}

/// Generate market ID from parameters
pub fn generate_market_id(
    creator: &Pubkey,
    title_hash: &[u8; 32],
    end_time: i64,
    nonce: u64,
) -> Pubkey {
    let seeds = &[
        b"market",
        creator.as_ref(),
        title_hash,
        &end_time.to_le_bytes(),
        &nonce.to_le_bytes(),
    ];
    
    Pubkey::find_program_address(seeds, &crate::ID).0
}

/// Validate bet amount constraints
pub fn validate_bet_constraints(
    bet_amount: u64,
    min_bet: u64,
    max_bet: u64,
    user_balance: u64,
    market_cap: u64,
    current_stakes: u64,
) -> Result<()> {
    require!(bet_amount >= min_bet, PredictionMarketError::BetTooSmall);
    require!(bet_amount <= max_bet, PredictionMarketError::BetTooLarge);
    require!(bet_amount <= user_balance, PredictionMarketError::InsufficientBalance);
    
    let new_total = current_stakes.checked_add(bet_amount)
        .ok_or(ProgramError::ArithmeticOverflow)?;
    require!(new_total <= market_cap, PredictionMarketError::MarketCapExceeded);
    
    Ok(())
}

#[error_code]
pub enum PredictionMarketError {
    #[msg("Bet amount is too small")]
    BetTooSmall,
    #[msg("Bet amount is too large")]
    BetTooLarge,
    #[msg("Insufficient balance")]
    InsufficientBalance,
    #[msg("Market cap exceeded")]
    MarketCapExceeded,
}
```