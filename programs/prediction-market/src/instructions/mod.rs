```rust
use anchor_lang::prelude::*;

pub mod create_market;
pub mod place_bet;
pub mod resolve_market;
pub mod claim_winnings;
pub mod initialize_platform;
pub mod update_market;
pub mod cancel_bet;
pub mod add_liquidity;
pub mod remove_liquidity;

pub use create_market::*;
pub use place_bet::*;
pub use resolve_market::*;
pub use claim_winnings::*;
pub use initialize_platform::*;
pub use update_market::*;
pub use cancel_bet::*;
pub use add_liquidity::*;
pub use remove_liquidity::*;

#[derive(Accounts)]
pub struct Initialize {}
```