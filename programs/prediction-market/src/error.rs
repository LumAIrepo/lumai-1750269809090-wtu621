```rust
use anchor_lang::prelude::*;

#[error_code]
pub enum PredictionMarketError {
    #[msg("Market is not active")]
    MarketNotActive,
    
    #[msg("Market has already been resolved")]
    MarketAlreadyResolved,
    
    #[msg("Market resolution time has not passed")]
    MarketNotExpired,
    
    #[msg("Invalid market outcome")]
    InvalidOutcome,
    
    #[msg("Insufficient funds for bet")]
    InsufficientFunds,
    
    #[msg("Bet amount must be greater than zero")]
    InvalidBetAmount,
    
    #[msg("Market has no liquidity")]
    NoLiquidity,
    
    #[msg("Invalid odds calculation")]
    InvalidOdds,
    
    #[msg("User has no position in this market")]
    NoPosition,
    
    #[msg("Position already claimed")]
    PositionAlreadyClaimed,
    
    #[msg("Only market creator can resolve")]
    UnauthorizedResolver,
    
    #[msg("Oracle signature verification failed")]
    InvalidOracleSignature,
    
    #[msg("Market creation fee not paid")]
    MarketFeeNotPaid,
    
    #[msg("Invalid market duration")]
    InvalidMarketDuration,
    
    #[msg("Market title too long")]
    MarketTitleTooLong,
    
    #[msg("Market description too long")]
    MarketDescriptionTooLong,
    
    #[msg("Invalid number of outcomes")]
    InvalidOutcomeCount,
    
    #[msg("Outcome label too long")]
    OutcomeLabelTooLong,
    
    #[msg("Minimum bet amount not met")]
    BetBelowMinimum,
    
    #[msg("Maximum bet amount exceeded")]
    BetAboveMaximum,
    
    #[msg("Market is paused")]
    MarketPaused,
    
    #[msg("Invalid market category")]
    InvalidCategory,
    
    #[msg("Slippage tolerance exceeded")]
    SlippageExceeded,
    
    #[msg("Liquidity pool imbalanced")]
    LiquidityImbalanced,
    
    #[msg("Invalid price feed")]
    InvalidPriceFeed,
    
    #[msg("Oracle data stale")]
    StaleOracleData,
    
    #[msg("Withdrawal not allowed yet")]
    WithdrawalNotAllowed,
    
    #[msg("Invalid fee percentage")]
    InvalidFeePercentage,
    
    #[msg("Treasury account mismatch")]
    TreasuryMismatch,
    
    #[msg("Invalid program authority")]
    InvalidAuthority,
    
    #[msg("Account already initialized")]
    AccountAlreadyInitialized,
    
    #[msg("Account not initialized")]
    AccountNotInitialized,
    
    #[msg("Invalid account owner")]
    InvalidAccountOwner,
    
    #[msg("Arithmetic overflow")]
    ArithmeticOverflow,
    
    #[msg("Arithmetic underflow")]
    ArithmeticUnderflow,
    
    #[msg("Division by zero")]
    DivisionByZero,
    
    #[msg("Invalid token mint")]
    InvalidTokenMint,
    
    #[msg("Token account not found")]
    TokenAccountNotFound,
    
    #[msg("Insufficient token balance")]
    InsufficientTokenBalance,
    
    #[msg("Invalid token program")]
    InvalidTokenProgram,
    
    #[msg("Market capacity exceeded")]
    MarketCapacityExceeded,
    
    #[msg("User betting limit exceeded")]
    UserBettingLimitExceeded,
    
    #[msg("Invalid time parameters")]
    InvalidTimeParameters,
    
    #[msg("Market locked for betting")]
    MarketLocked,
    
    #[msg("Invalid resolution data")]
    InvalidResolutionData,
    
    #[msg("Consensus not reached")]
    ConsensusNotReached,
    
    #[msg("Invalid validator signature")]
    InvalidValidatorSignature,
    
    #[msg("Validator not authorized")]
    ValidatorNotAuthorized,
    
    #[msg("Dispute period active")]
    DisputePeriodActive,
    
    #[msg("Dispute period expired")]
    DisputePeriodExpired,
    
    #[msg("Invalid dispute evidence")]
    InvalidDisputeEvidence,
    
    #[msg("Dispute already submitted")]
    DisputeAlreadySubmitted,
    
    #[msg("No dispute to resolve")]
    NoDisputeToResolve,
    
    #[msg("Invalid market metadata")]
    InvalidMarketMetadata,
    
    #[msg("Market tags limit exceeded")]
    MarketTagsLimitExceeded,
    
    #[msg("Invalid market image URL")]
    InvalidMarketImageUrl,
    
    #[msg("Market verification failed")]
    MarketVerificationFailed,
    
    #[msg("Invalid referral code")]
    InvalidReferralCode,
    
    #[msg("Referral reward already claimed")]
    ReferralRewardClaimed,
    
    #[msg("Self-referral not allowed")]
    SelfReferralNotAllowed,
    
    #[msg("Invalid reward calculation")]
    InvalidRewardCalculation,
    
    #[msg("Reward pool depleted")]
    RewardPoolDepleted,
    
    #[msg("Invalid staking parameters")]
    InvalidStakingParameters,
    
    #[msg("Staking period not completed")]
    StakingPeriodNotCompleted,
    
    #[msg("Invalid governance proposal")]
    InvalidGovernanceProposal,
    
    #[msg("Voting period not active")]
    VotingPeriodNotActive,
    
    #[msg("Already voted on proposal")]
    AlreadyVoted,
    
    #[msg("Insufficient voting power")]
    InsufficientVotingPower,
    
    #[msg("Proposal execution failed")]
    ProposalExecutionFailed,
    
    #[msg("Invalid emergency action")]
    InvalidEmergencyAction,
    
    #[msg("Emergency mode not active")]
    EmergencyModeNotActive,
    
    #[msg("Circuit breaker triggered")]
    CircuitBreakerTriggered,
    
    #[msg("Rate limit exceeded")]
    RateLimitExceeded,
    
    #[msg("Invalid signature")]
    InvalidSignature,
    
    #[msg("Signature expired")]
    SignatureExpired,
    
    #[msg("Nonce already used")]
    NonceAlreadyUsed,
    
    #[msg("Invalid nonce")]
    InvalidNonce,
    
    #[msg("Account frozen")]
    AccountFrozen,
    
    #[msg("Feature not enabled")]
    FeatureNotEnabled,
    
    #[msg("Maintenance mode active")]
    MaintenanceModeActive,
    
    #[msg("Version mismatch")]
    VersionMismatch,
    
    #[msg("Invalid configuration")]
    InvalidConfiguration,
    
    #[msg("Configuration locked")]
    ConfigurationLocked,
    
    #[msg("Invalid admin action")]
    InvalidAdminAction,
    
    #[msg("Admin privileges required")]
    AdminPrivilegesRequired,
    
    #[msg("Invalid multisig operation")]
    InvalidMultisigOperation,
    
    #[msg("Multisig threshold not met")]
    MultisigThresholdNotMet,
    
    #[msg("Invalid cross-program invocation")]
    InvalidCrossProgram,
    
    #[msg("Program upgrade required")]
    ProgramUpgradeRequired,
    
    #[msg("Data migration required")]
    DataMigrationRequired,
    
    #[msg("Invalid data format")]
    InvalidDataFormat,
    
    #[msg("Data corruption detected")]
    DataCorruption,
    
    #[msg("Backup operation failed")]
    BackupOperationFailed,
    
    #[msg("Recovery operation failed")]
    RecoveryOperationFailed,
    
    #[msg("Invalid recovery key")]
    InvalidRecoveryKey,
    
    #[msg("Recovery period expired")]
    RecoveryPeriodExpired,
    
    #[msg("Security check failed")]
    SecurityCheckFailed,
    
    #[msg("Audit trail incomplete")]
    AuditTrailIncomplete,
    
    #[msg("Compliance check failed")]
    ComplianceCheckFailed,
    
    #[msg("Regulatory restriction")]
    RegulatoryRestriction,
    
    #[msg("Geographic restriction")]
    GeographicRestriction,
    
    #[msg("Age verification required")]
    AgeVerificationRequired,
    
    #[msg("KYC verification required")]
    KycVerificationRequired,
    
    #[msg("Account suspended")]
    AccountSuspended,
    
    #[msg("Transaction limit exceeded")]
    TransactionLimitExceeded,
    
    #[msg("Daily limit exceeded")]
    DailyLimitExceeded,
    
    #[msg("Monthly limit exceeded")]
    MonthlyLimitExceeded,
    
    #[msg("Risk assessment failed")]
    RiskAssessmentFailed,
    
    #[msg("Fraud detection triggered")]
    FraudDetectionTriggered,
    
    #[msg("Suspicious activity detected")]
    SuspiciousActivityDetected,
    
    #[msg("Anti-money laundering check failed")]
    AmlCheckFailed,
    
    #[msg("Sanctions list match")]
    SanctionsListMatch,
    
    #[msg("Invalid jurisdiction")]
    InvalidJurisdiction,
    
    #[msg("License verification failed")]
    LicenseVerificationFailed,
    
    #[msg("Terms of service not accepted")]
    TermsNotAccepted,
    
    #[msg("Privacy policy not accepted")]
    PrivacyPolicyNotAccepted,
    
    #[msg("Cookie consent required")]
    CookieConsentRequired,
    
    #[msg("Data retention period expired")]
    DataRetentionExpired,
    
    #[msg("Right to be forgotten requested")]
    RightToBeForgotten,
    
    #[msg("Data portability requested")]
    DataPortabilityRequested,
    
    #[msg("Consent withdrawn")]
    ConsentWithdrawn,
    
    #[msg("Processing purpose invalid")]
    ProcessingPurposeInvalid,
    
    #[msg("Legal basis insufficient")]
    LegalBasisInsufficient,
    
    #[msg("Data subject rights violation")]
    DataSubjectRightsViolation,
    
    #[msg("Cross-border transfer restricted")]
    CrossBorderTransferRestricted,
    
    #[msg("Adequacy decision required")]
    AdequacyDecisionRequired,
    
    #[msg("Standard contractual clauses required")]
    StandardContractualClausesRequired,
    
    #[msg("Binding corporate rules required")]
    BindingCorporateRulesRequired,
    
    #[msg("Certification required")]
    CertificationRequired,
    
    #[msg("Code of conduct violation")]
    CodeOfConductViolation,
    
    #[msg("Professional standards violation")]
    ProfessionalStandardsViolation,
    
    #[msg("Ethical guidelines violation")]
    EthicalGuidelinesViolation,
    
    #[msg("Conflict of interest detected")]
    ConflictOfInterestDetected,
    
    #[msg("Insider trading suspected")]
    InsiderTradingSuspected,
    
    #[msg("Market manipulation detected")]
    MarketManipulationDetected,
    
    #[msg("Wash trading detected")]
    WashTradingDetected,
    
    #[msg("Front running detected")]
    FrontRunningDetected,
    
    #[msg("Pump and dump scheme detected")]
    PumpAndDumpDetected,
    
    #[msg("Coordinated attack detected")]
    CoordinatedAttackDetected,
    
    #[msg("Bot activity detected")]
    BotActivityDetected,
    
    #[msg("Sybil attack detected")]
    SybilAttackDetected,
    
    #[msg("Eclipse attack detected")]
    EclipseAttackDetected,
    
    #[msg("51% attack detected")]
    FiftyOnePercentAttackDetected,
    
    #[msg("Double spending attempt")]
    DoubleSpendingAttempt,
    
    #[msg("Replay attack detected")]
    ReplayAttackDetected,
    
    #[msg("Man in the middle attack")]
    ManInTheMiddleAttack,
    
    #[msg("DNS spoofing detected")]
    DnsSpoofingDetected,
    
    #[msg("Phishing attempt detected")]
    PhishingAttemptDetected,
    
    #[msg("Social engineering detected")]
    SocialEngineeringDetected,
    
    #[msg("Credential stuffing detected")]
    CredentialStuffingDetected,
    
    #[msg("Brute force attack detected")]
    BruteForceAttackDetected,
    
    #[msg("Dictionary attack detected")]
    DictionaryAttackDetected,
    
    #[msg("Rainbow table attack detected")]
    RainbowTableAttackDetected,
    
    #[msg("SQL injection attempt")]
    SqlInjectionAttempt,
    
    #[msg("Cross-site scripting attempt")]
    CrossSiteScriptingAttempt,
    
    #[msg("Cross-site request forgery")]
    CrossSiteRequestForgery,
    
    #[msg("Buffer overflow attempt")]
    BufferOverflowAttempt,
    
    #[msg("Integer overflow attempt")]
    IntegerOverflowAttempt,
    
    #[msg("Format string attack")]
    FormatStringAttack,
    
    #[msg("Race condition detected")]
    RaceConditionDetected,
    
    #[msg("Time of check time of use")]
    TimeOfCheckTimeOfUse,
    
    #[msg("Privilege escalation attempt")]
    PrivilegeEscalationAttempt,
    
    #[msg("Unauthorized access attempt")]
    UnauthorizedAccessAttempt,
    
    #[msg("Data exfiltration detected")]
    DataExfiltrationDetected,
    
    #[msg("Malware detected")]
    MalwareDetected,
    
    #[msg("Virus detected")]
    VirusDetected,
    
    #[msg("Trojan detected")]
    TrojanDetected,
    
    #[msg("Rootkit detected")]
    RootkitDetected,
    
    #[msg("Spyware detected")]
    SpywareDetected,
    
    #[msg("Adware detected")]
    AdwareDetected,
    
    #[msg("Ransomware detected")]
    RansomwareDetected,
    
    #[msg("Keylogger detected")]
    KeyloggerDetected,
    
    #[msg("Screen scraper detected")]
    ScreenScraperDetected,
    
    #[msg("Network scanner detected")]
    NetworkScannerDetected,
    
    #[msg("Port scanner detected")]
    PortScannerDetected,
    
    #[msg("Vulnerability scanner detected")]
    VulnerabilityScannerDetected,
    
    #[msg("Penetration testing detected")]
    PenetrationTestingDetected,
    
    #[msg("Red team exercise detected")]
    RedTeamExerciseDetected,
    
    #[msg("