# CHANGELOG — PROP-X Pro Sportsbook & Bovada 10x Casino Terminal

All notable changes, architectural decisions, and feature evolutions for the PROP-X platform are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.2.0] - 2026-10-26: Live TV Simulcast Matrix & 10x Bovada Casino Suite

### Added
* **Live Multi-Game TV Browser (`src/components/LiveTvBrowser.tsx`)**:
  * Multi-screen simulcast matrix supporting **1 Screen (Focus View)**, **Dual Split (2 Screens side-by-side)**, and **Quad Matrix (4 Screens 2x2 Grid)**.
  * 6 Pre-configured live broadcast channels (NBA TV HD, Sky Sports Premier League, ESL Pro League CS2, NFL RedZone, ESPN Grand Slam, Red Bull 24/7 Action).
  * **Custom Live Stream Ingest**: Integrated URL parser to stream any YouTube Live, Twitch stream, or HLS/MP4 URL directly into any selected screen slot.
  * In-stream quick bet bar to wager on the exact game playing on screen without switching tabs.
  * Independent audio mute/unmute and live TV scorebug overlay per video tile.
* **Complete Bovada 10x Casino Suite (`src/components/casino/`)**:
  * **Live European Roulette (`RouletteGame.tsx`)**: Single-zero 2.7% house edge wheel with canvas ball drop animation, inside numbers (35:1), dozens (2:1), red/black, even/odd, and hot/cold number ribbon.
  * **Mega 777 Apex Deluxe Video Slots (`SlotMachineGame.tsx`)**: 5-reel, 3-row slot machine with center payline detection, animated spinning reels, and live **$2.48M Super Progressive Jackpot** ticker.
  * **Macau Live Baccarat (`BaccaratGame.tsx`)**: Punto Banco table with Player (1:1), Banker (0.95:1 with 5% commission), and Tie (8:1) bets, natural 8/9 detection, and live roadmap bead plate.
  * **Jacks or Better Video Poker (`VideoPokerGame.tsx`)**: 5-card draw Vegas poker with interactive card hold toggles, draw card replacement, and 9/6 full-pay table featuring 800x Royal Flush.
  * **High-Roller Rocket Crash (`CrashGame.tsx`)**: Exponential multiplier curve climbing past 100x+ with live cashout execution and multiplayer spectator lobby.
* **Unified ACID Casino Ledger Logging**:
  * Added `CASINO_BET` and `CASINO_WIN` transaction types to `WalletContext.tsx`.
  * Automatic double-entry transaction record for every spin, deal, roll, and flight.
* **One-Click Source Code Export**:
  * Direct "DOWNLOAD ZIP" action in the terminal header serving `propx-terminal-v1.0.0.zip`.

---

## [1.1.0] - 2026-10-15: Broadcast Telemetry & Initial Table Game Integration

### Added
* **Live Match Video Stream Prototype (`src/components/LiveMatchStreamPlayer.tsx`)**:
  * High-definition sports broadcast canvas rendering with stadium hardwood/pitch textures, ball physics, and simulated player positions.
  * Camera angle switcher: Broadcast TV, Courtside, and Tactical 2D Radar.
  * Broadcast TV scorebug overlay with period, clock, and team scores.
* **Vegas VIP Blackjack 21 (`src/components/casino/BlackjackGame.tsx`)**:
  * Initial table game implementation with Deal, Hit, Stand, and Double Down.
  * Natural Blackjack 3:2 payout and dealer standing on soft 17.
* **Casino Lobby Hub (`src/components/casino/CasinoLobby.tsx`)**:
  * Dedicated casino navigation tab with hourly and daily Hot Drop Jackpot countdowns.

---

## [1.0.0] - 2026-10-15: Core Quantitative Sportsbook & Atomic Ledger

### Added
* **Multi-Strategy Betting Engine (`src/utils/oddsEngine.ts`)**:
  * **Multi-Leg Parlay Compounding**: Real-time multiplier calculation ($\prod \text{odds}_i$) across single and multi-sport tickets.
  * **Dynamic Net Present Value (NPV) Auto-Cashout**:
    $$\text{Cashout Value} = \frac{\text{Potential Payout}}{\text{Current Live Odds}} \times (1 - \text{House Margin})$$
  * **Quarter-Kelly Criterion Staking**: Optimal bankroll fraction equation ($f^* = \frac{b \cdot p - q}{b} \times 0.25$) with model win-edge adjustments.
  * **Arbitrage / Hedge Calculator**: Calculates exact opposing wager to secure risk-free profit across outcomes.
  * **Multi-Format Odds Formatter**: Seamless cycle between Decimal (`2.45x`), American (`+145`, `-120`), and Fractional (`29/20`).
* **Atomic Vault & Double-Entry Ledger (`src/context/WalletContext.tsx`)**:
  * Row-level locking simulation separating **Available Balance** from **In-Play Locked Funds** to eliminate double-spending race conditions.
  * Double-entry audit ledger recording every transaction (`BET_PLACE`, `BET_WIN`, `CASHOUT`, `DEPOSIT`, `RESET`) with CSV export.
* **High-Frequency Live Feed Simulator (`src/context/LiveFeedContext.tsx`)**:
  * Multi-sport real-time ticker covering NBA, Premier League, NFL, Tennis, and CS2 Esports.
  * Live visual flash ticks (emerald up-tick, rose down-tick on odds drift).
  * Web Audio API tactile feedback for ticks, bet placements, and cashouts.
* **Pro Slip Builder (`src/components/ProSlipBuilder.tsx`)**:
  * Compound multiplier preview, quick stake buttons ($10, $50, $100, $250, MAX, Kelly), and optimistic UI ticket execution.
* **Settlement Cron & Admin Engine (`src/components/SettlementCronModal.tsx`)**:
  * Simulation of `POST /api/bets/settle` pipeline to resolve games and disburse winnings.
* **Active Positions & Cashout Desk (`src/components/ActiveBetsHedging.tsx`)**:
  * Real-time position tracking with dynamic cashout and profit/loss indicators.

---

## 📁 Packaged Source Code Hierarchy (33 Files)

```
propx-terminal-v1.0.0.zip
├── .env.example
├── .gitignore
├── CHANGELOG.md
├── index.html
├── metadata.json
├── package.json
├── tsconfig.json
├── vite.config.ts
└── src/
    ├── App.tsx
    ├── main.tsx
    ├── index.css
    ├── types/
    │   └── betting.ts
    ├── utils/
    │   ├── audioFx.ts
    │   └── oddsEngine.ts
    ├── context/
    │   ├── LiveFeedContext.tsx
    │   └── WalletContext.tsx
    └── components/
        ├── TerminalHeader.tsx
        ├── LiveTvBrowser.tsx
        ├── LiveOddsTerminal.tsx
        ├── LiveMatchStreamPlayer.tsx
        ├── ProSlipBuilder.tsx
        ├── ActiveBetsHedging.tsx
        ├── AuditLedger.tsx
        ├── SettlementCronModal.tsx
        ├── StrategyGuide.tsx
        ├── DepositModal.tsx
        └── casino/
            ├── CasinoLobby.tsx
            ├── RouletteGame.tsx
            ├── SlotMachineGame.tsx
            ├── BlackjackGame.tsx
            ├── BaccaratGame.tsx
            ├── VideoPokerGame.tsx
            └── CrashGame.tsx
```
