```typescript
import { IdlAccounts, IdlTypes, Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

export type PredictionMarket = {
  "version": "0.1.0",
  "name": "prediction_market",
  "instructions": [
    {
      "name": "initializeMarket",
      "accounts": [
        {
          "name": "market",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "creator",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "title",
          "type": "string"
        },
        {
          "name": "description",
          "type": "string"
        },
        {
          "name": "category",
          "type": "string"
        },
        {
          "name": "endTime",
          "type": "i64"
        },
        {
          "name": "resolutionTime",
          "type": "i64"
        }
      ]
    },
    {
      "name": "placeBet",
      "accounts": [
        {
          "name": "market",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "bet",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "bettor",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "outcome",
          "type": "bool"
        }
      ]
    },
    {
      "name": "resolveMarket",
      "accounts": [
        {
          "name": "market",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "resolver",
          "isMut": false,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "outcome",
          "type": "bool"
        }
      ]
    },
    {
      "name": "claimWinnings",
      "accounts": [
        {
          "name": "market",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "bet",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "bettor",
          "isMut": true,
          "isSigner": true
        }
      ],
      "args": []
    },
    {
      "name": "cancelMarket",
      "accounts": [
        {
          "name": "market",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "creator",
          "isMut": false,
          "isSigner": true
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "market",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "creator",
            "type": "publicKey"
          },
          {
            "name": "title",
            "type": "string"
          },
          {
            "name": "description",
            "type": "string"
          },
          {
            "name": "category",
            "type": "string"
          },
          {
            "name": "endTime",
            "type": "i64"
          },
          {
            "name": "resolutionTime",
            "type": "i64"
          },
          {
            "name": "totalYesAmount",
            "type": "u64"
          },
          {
            "name": "totalNoAmount",
            "type": "u64"
          },
          {
            "name": "totalVolume",
            "type": "u64"
          },
          {
            "name": "totalBets",
            "type": "u64"
          },
          {
            "name": "status",
            "type": {
              "defined": "MarketStatus"
            }
          },
          {
            "name": "outcome",
            "type": {
              "option": "bool"
            }
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "resolvedAt",
            "type": {
              "option": "i64"
            }
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "bet",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "market",
            "type": "publicKey"
          },
          {
            "name": "bettor",
            "type": "publicKey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "outcome",
            "type": "bool"
          },
          {
            "name": "odds",
            "type": "f64"
          },
          {
            "name": "potentialPayout",
            "type": "u64"
          },
          {
            "name": "claimed",
            "type": "bool"
          },
          {
            "name": "placedAt",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "MarketStatus",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Active"
          },
          {
            "name": "Ended"
          },
          {
            "name": "Resolved"
          },
          {
            "name": "Cancelled"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "MarketNotActive",
      "msg": "Market is not active"
    },
    {
      "code": 6001,
      "name": "MarketEnded",
      "msg": "Market has ended"
    },
    {
      "code": 6002,
      "name": "MarketNotResolved",
      "msg": "Market is not resolved"
    },
    {
      "code": 6003,
      "name": "MarketAlreadyResolved",
      "msg": "Market is already resolved"
    },
    {
      "code": 6004,
      "name": "UnauthorizedResolver",
      "msg": "Unauthorized to resolve market"
    },
    {
      "code": 6005,
      "name": "InvalidBetAmount",
      "msg": "Invalid bet amount"
    },
    {
      "code": 6006,
      "name": "BetAlreadyClaimed",
      "msg": "Bet winnings already claimed"
    },
    {
      "code": 6007,
      "name": "LosingBet",
      "msg": "Cannot claim winnings for losing bet"
    },
    {
      "code": 6008,
      "name": "InvalidTimeRange",
      "msg": "Invalid time range for market"
    },
    {
      "code": 6009,
      "name": "MarketNotCancellable",
      "msg": "Market cannot be cancelled"
    },
    {
      "code": 6010,
      "name": "UnauthorizedCreator",
      "msg": "Unauthorized market creator"
    }
  ]
};

export const IDL: PredictionMarket = {
  "version": "0.1.0",
  "name": "prediction_market",
  "instructions": [
    {
      "name": "initializeMarket",
      "accounts": [
        {
          "name": "market",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "creator",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "title",
          "type": "string"
        },
        {
          "name": "description",
          "type": "string"
        },
        {
          "name": "category",
          "type": "string"
        },
        {
          "name": "endTime",
          "type": "i64"
        },
        {
          "name": "resolutionTime",
          "type": "i64"
        }
      ]
    },
    {
      "name": "placeBet",
      "accounts": [
        {
          "name": "market",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "bet",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "bettor",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "outcome",
          "type": "bool"
        }
      ]
    },
    {
      "name": "resolveMarket",
      "accounts": [
        {
          "name": "market",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "resolver",
          "isMut": false,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "outcome",
          "type": "bool"
        }
      ]
    },
    {
      "name": "claimWinnings",
      "accounts": [
        {
          "name": "market",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "bet",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "bettor",
          "isMut": true,
          "isSigner": true
        }
      ],
      "args": []
    },
    {
      "name": "cancelMarket",
      "accounts": [
        {
          "name": "market",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "creator",
          "isMut": false,
          "isSigner": true
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "market",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "creator",
            "type": "publicKey"
          },
          {
            "name": "title",
            "type": "string"
          },
          {
            "name": "description",
            "type": "string"
          },
          {
            "name": "category",
            "type": "string"
          },
          {
            "name": "endTime",
            "type": "i64"
          },
          {
            "name": "resolutionTime",
            "type": "i64"
          },
          {
            "name": "totalYesAmount",
            "type": "u64"
          },
          {
            "name": "totalNoAmount",
            "type": "u64"
          },
          {
            "name": "totalVolume",
            "type": "u64"
          },
          {
            "name": "totalBets",
            "type": "u64"
          },
          {
            "name": "status",
            "type": {
              "defined": "MarketStatus"
            }
          },
          {
            "name": "outcome",
            "type": {
              "option": "bool"
            }
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "resolvedAt",
            "type": {
              "option": "i64"
            }
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "bet",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "market",
            "type": "publicKey"
          },
          {
            "name": "bettor",
            "type": "publicKey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "outcome",
            "type": "bool"
          },
          {
            "name": "odds",
            "type": "f64"
          },
          {
            "name": "potentialPayout",
            "type": "u64"
          },
          {
            "name": "claimed",
            "type": "bool"
          },
          {
            "name": "placedAt",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "MarketStatus",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Active"
          },
          {
            "name": "Ended"
          },
          {
            "name": "Resolved"
          },
          {
            "name": "Cancelled"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "MarketNotActive",
      "msg": "Market is not active"
    },
    {
      "code": 6001,
      "name": "MarketEnded",
      "msg": "Market has ended"
    },
    {
      "code": 6002,
      "name": "MarketNotResolved",
      "msg": "Market is not resolved"
    },
    {
      "code": 6003,
      "name": "MarketAlreadyResolved",
      "msg": "Market is already resolved"
    },
    {
      "code": 6004,
      "name": "UnauthorizedResolver",
      "msg": "Unauthorized to resolve market"
    },
    {
      "code": 6005,
      "name": "InvalidBetAmount",
      "msg": "Invalid bet amount"
    },
    {
      "code": 6006,
      "name": "BetAlreadyClaimed",
      "msg": "Bet winnings already