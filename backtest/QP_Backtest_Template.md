# Quant Prime — YTD Backtest Template

## Google Sheets Structure

### Tab 1: 📊 DASHBOARD
**Combined overview across all strategies**

| Metric | Formula |
|--------|---------|
| **YTD Total Trades** | =COUNTA(Recoil!A:A)+COUNTA(Vertex!A:A)+COUNTA(Meridian!A:A)-3 |
| **YTD Win Rate** | =(total wins)/(total closed) |
| **YTD Total Pips** | =SUM of all result pips |
| **Best Performer** | Strategy with highest pips |
| **Worst Performer** | Strategy with lowest pips |

**Per-Strategy Summary Table:**
| Strategy | Trades | Wins | Losses | Win Rate | Total Pips | Avg RR |
|----------|--------|------|--------|----------|------------|--------|
| Recoil   | =formula | =formula | =formula | =formula | =formula | =formula |
| Vertex   | =formula | =formula | =formula | =formula | =formula | =formula |
| Meridian | =formula | =formula | =formula | =formula | =formula | =formula |

**Monthly Breakdown:**
| Month | Recoil Pips | Vertex Pips | Meridian Pips | Total |
|-------|-------------|-------------|---------------|-------|
| Jan   | =SUMIFS(...) | =SUMIFS(...) | =SUMIFS(...) | =SUM |
| Feb   | ... | ... | ... | ... |
| ... | ... | ... | ... | ... |

---

### Tab 2: ⚡ RECOIL DATA
**Columns:**

| Column | Header | Description | Example |
|--------|--------|-------------|---------|
| A | Date | Trade date | 2026-01-15 |
| B | Time | Entry time (UTC) | 14:32 |
| C | Pair | Trading pair | EURUSD |
| D | Timeframe | Chart TF | 3M |
| E | Direction | LONG/SHORT | LONG |
| F | Band | Volatility band (6/7/8) | 7 |
| G | Trend | BULL/BEAR/CONSOL | CONSOL |
| H | Entry | Entry price | 1.08765 |
| I | SL | Stop loss price | 1.08650 |
| J | TP | Take profit price | 1.08890 |
| K | SL Pips | Risk in pips | =ABS(H-I)*pip_mult |
| L | TP Pips | Reward in pips | =ABS(J-H)*pip_mult |
| M | RR | Risk:Reward ratio | =L/K |
| N | Risk Mult | Band × trend mult | 2.0 |
| O | Result | TP/SL/BE/OPEN | TP |
| P | Exit Price | Actual exit | 1.08890 |
| Q | Result Pips | +/- pips | =IF(E="LONG",(P-H),(H-P))*pip_mult |
| R | Notes | Optional notes | Clean setup |

**Conditional Formatting:**
- Column O: TP = Green, SL = Red, BE = Yellow, OPEN = Blue
- Column Q: Positive = Green, Negative = Red

---

### Tab 3: 🔷 VERTEX DATA
**Columns:**

| Column | Header | Description | Example |
|--------|--------|-------------|---------|
| A | Date | Trade date | 2026-01-15 |
| B | Time | Entry time (UTC) | 09:15 |
| C | Pair | Trading pair | XAUUSD |
| D | Timeframe | Chart TF | 3M |
| E | Direction | LONG/SHORT | SHORT |
| F | Rev Hour | Reversal hour triggered | H9 |
| G | Day | Mon/Tue/Wed/Thu/Fri | Tue |
| H | Sweep Type | HIGH/LOW swept | HIGH |
| I | Entry | Entry price | 2645.50 |
| J | SL | Stop loss (sweep extreme) | 2648.20 |
| K | TP | Equilibrium target | 2642.75 |
| L | Day H/L | Day high or low used | 2640.00 |
| M | SL Pips | Risk in pips | 27.0 |
| N | TP Pips | Reward in pips | 27.5 |
| O | RR | Risk:Reward ratio | 1.02 |
| P | Result | TP/SL/OPEN | TP |
| Q | Exit Price | Actual exit | 2642.75 |
| R | Result Pips | +/- pips | +27.5 |
| S | Notes | Optional notes | Clean engulf |

---

### Tab 4: 🌊 MERIDIAN DATA
**Columns:**

| Column | Header | Description | Example |
|--------|--------|-------------|---------|
| A | Date | Signal date | 2026-01-15 |
| B | Time | Signal time (UTC) | 10:45 |
| C | Pair | Trading pair | BTCUSD |
| D | Timeframe | Chart TF | 3M |
| E | Signal Type | VORTEX/AMD-GOLD/AMD-MSS | VORTEX |
| F | Direction | LONG/SHORT | LONG |
| G | Regime | PRIME/FAVORABLE/MARGINAL/DEGRADED | PRIME |
| H | EMA Bias | LONG/SHORT/NEUTRAL | LONG |
| I | LIQ Bias | LONG/SHORT/NEUTRAL | LONG |
| J | Suspension | ACTIVE/SUSPENDED | ACTIVE |
| K | Entry | Entry price | 64250 |
| L | SL | Manual SL placed | 63800 |
| M | TP | Manual TP placed | 65100 |
| N | SL Pips | Risk | 450 |
| O | TP Pips | Reward | 850 |
| P | RR | Risk:Reward | 1.89 |
| Q | Result | TP/SL/OPEN | TP |
| R | Exit Price | Actual exit | 65100 |
| S | Result Pips | +/- pips | +850 |
| T | Notes | Setup quality notes | Gold signal aligned |

---

### Tab 5: ⚙️ INPUTS
**Configurable Settings**

#### Global Settings
| Setting | Value | Notes |
|---------|-------|-------|
| Start Date | 2026-01-01 | Backtest start |
| End Date | 2026-07-20 | Backtest end |
| Account Size | £1000 | For position sizing reference |

#### Pair Settings
| Pair | Enabled | Pip Value | Spread | Notes |
|------|---------|-----------|--------|-------|
| EURUSD | TRUE | 0.0001 | 0.6 | Main forex |
| XAUUSD | TRUE | 0.1 | 2.0 | Gold |
| BTCUSD | TRUE | 1.0 | 50 | Bitcoin |
| GBPUSD | FALSE | 0.0001 | 0.8 | Optional |

#### Recoil Settings
| Setting | Value | Description |
|---------|-------|-------------|
| TP Mode | % of Body | Body/Range/R Multiple |
| TP % | 50 | Target percentage |
| SL Mode | Wick + Buffer | Wick+Buffer or FVG Gap |
| SL Buffer ATR | 3.0 | ATR multiplier for buffer |
| Band 6 Mult | 1.0 | Risk multiplier |
| Band 7 Mult | 2.0 | Risk multiplier |
| Band 8 Mult | 5.0 | Risk multiplier |
| With Trend Mult | 2.0 | Trend alignment |
| Against Trend Mult | 0.5 | Counter-trend |
| Consolidation Mult | 1.0 | No trend |
| TP1 Enabled | TRUE | Partial TP |
| TP1 % | 25 | Partial distance |
| TP1 Close % | 50 | Position to close |
| Move BE at TP1 | TRUE | SL to entry |

#### Vertex Settings
| Setting | Value | Description |
|---------|-------|-------------|
| Timezone | America/New_York | Reversal hour TZ |
| Pre-Window Min | 6 | Minutes before hour |
| Mon Hours | 2,3,9 | Reversal hours |
| Tue Hours | 2,5,9 | Reversal hours |
| Wed Hours | 4,5,9 | Reversal hours |
| Thu Hours | 6,7,8 | Reversal hours |
| Fri Hours | 2,4,6 | Reversal hours |
| LP Timeframe | 3 | LP detection TF |
| LP Left Bars | 2 | Pivot left |
| LP Right Bars | 1 | Pivot right |

#### Meridian Settings
| Setting | Value | Description |
|---------|-------|-------------|
| Regime TF1 | D | Daily regime |
| Regime TF2 | 180 | 3H regime |
| Regime TF3 | 30 | 30M regime |
| Regime TF4 | 3 | 3M regime |
| HTF Alignment | TRUE | Require 3D/3H align |
| Vortex Digits | 1,2 | Digit checks enabled |

---

### Tab 6: 📈 RECOIL STATS
**Auto-calculated from Recoil Data**

| Metric | Formula |
|--------|---------|
| Total Trades | =COUNTA(A:A)-1 |
| Wins | =COUNTIF(O:O,"TP") |
| Losses | =COUNTIF(O:O,"SL") |
| Breakeven | =COUNTIF(O:O,"BE") |
| Open | =COUNTIF(O:O,"OPEN") |
| Win Rate | =Wins/(Wins+Losses) |
| Total Pips | =SUM(Q:Q) |
| Avg Win Pips | =AVERAGEIF(Q:Q,">0") |
| Avg Loss Pips | =AVERAGEIF(Q:Q,"<0") |
| Profit Factor | =SUMIF(Q:Q,">0")/ABS(SUMIF(Q:Q,"<0")) |
| Max Drawdown | =MIN(running total) |
| Avg RR | =AVERAGE(M:M) |

**By Pair:**
| Pair | Trades | Win Rate | Pips |
|------|--------|----------|------|
| EURUSD | =COUNTIF | =formula | =SUMIFS |
| XAUUSD | =COUNTIF | =formula | =SUMIFS |
| BTCUSD | =COUNTIF | =formula | =SUMIFS |

**By Band:**
| Band | Trades | Win Rate | Pips |
|------|--------|----------|------|
| 6 | =COUNTIF | =formula | =SUMIFS |
| 7 | =COUNTIF | =formula | =SUMIFS |
| 8 | =COUNTIF | =formula | =SUMIFS |

**By Trend:**
| Trend | Trades | Win Rate | Pips |
|-------|--------|----------|------|
| BULL | =COUNTIF | =formula | =SUMIFS |
| BEAR | =COUNTIF | =formula | =SUMIFS |
| CONSOL | =COUNTIF | =formula | =SUMIFS |

---

### Tab 7: 📈 VERTEX STATS
**Auto-calculated from Vertex Data**

| Metric | Value |
|--------|-------|
| Total Trades | =COUNTA(A:A)-1 |
| Wins | =COUNTIF(P:P,"TP") |
| Losses | =COUNTIF(P:P,"SL") |
| Win Rate | =Wins/(Wins+Losses) |
| Total Pips | =SUM(R:R) |
| Avg RR | =AVERAGE(O:O) |
| Profit Factor | =formula |

**By Day:**
| Day | Trades | Win Rate | Pips |
|-----|--------|----------|------|
| Mon | =COUNTIF | =formula | =SUMIFS |
| Tue | =COUNTIF | =formula | =SUMIFS |
| Wed | =COUNTIF | =formula | =SUMIFS |
| Thu | =COUNTIF | =formula | =SUMIFS |
| Fri | =COUNTIF | =formula | =SUMIFS |

**By Reversal Hour:**
| Hour | Trades | Win Rate | Pips |
|------|--------|----------|------|
| H2 | =COUNTIF | =formula | =SUMIFS |
| H3 | =COUNTIF | =formula | =SUMIFS |
| ... | ... | ... | ... |

---

### Tab 8: 📈 MERIDIAN STATS
**Auto-calculated from Meridian Data**

| Metric | Value |
|--------|-------|
| Total Signals | =COUNTA(A:A)-1 |
| Wins | =COUNTIF(Q:Q,"TP") |
| Losses | =COUNTIF(Q:Q,"SL") |
| Win Rate | =Wins/(Wins+Losses) |
| Total Pips | =SUM(S:S) |

**By Signal Type:**
| Type | Trades | Win Rate | Pips |
|------|--------|----------|------|
| VORTEX | =COUNTIF | =formula | =SUMIFS |
| AMD-GOLD | =COUNTIF | =formula | =SUMIFS |
| AMD-MSS | =COUNTIF | =formula | =SUMIFS |

**By Regime:**
| Regime | Trades | Win Rate | Pips |
|--------|--------|----------|------|
| PRIME | =COUNTIF | =formula | =SUMIFS |
| FAVORABLE | =COUNTIF | =formula | =SUMIFS |
| MARGINAL | =COUNTIF | =formula | =SUMIFS |
| DEGRADED | =COUNTIF | =formula | =SUMIFS |

---

## Pip Multipliers Reference

| Symbol | Pip Size | Multiplier | Example |
|--------|----------|------------|---------|
| EURUSD | 0.0001 | 10000 | 1.0876 - 1.0866 = 10 pips |
| GBPUSD | 0.0001 | 10000 | Same as EUR |
| USDJPY | 0.01 | 100 | 150.50 - 150.40 = 10 pips |
| XAUUSD | 0.1 | 10 | 2650.5 - 2649.5 = 10 pips |
| BTCUSD | 1.0 | 1 | 65000 - 64990 = 10 pips |

---

## Data Entry Workflow

1. **Open TradingView** with indicator on chart
2. **Scroll to start date** (Jan 1, 2026)
3. **For each signal/trade:**
   - Note the date, time, pair, timeframe
   - Record entry, SL, TP from indicator
   - Track forward to see result
   - Log in appropriate data tab
4. **Move to next signal**, repeat
5. **Stats tabs auto-update** as you add data

---

## JSON Export Format (for live tracking integration)

The executor bridge stores trades in this format - your backtest data should match:

```json
{
  "id": "1720000000000_EURUSD_RECOIL",
  "timestamp": "2026-01-15T14:32:00.000Z",
  "date": "2026-01-15",
  "symbol": "EURUSD",
  "indicator": "RECOIL",
  "action": "OPEN",
  "direction": "LONG",
  "entry": 1.08765,
  "sl": 1.08650,
  "tp1": 1.08827,
  "tp2": 1.08890,
  "risk_mult": 2.0,
  "timeframe": "3",
  "style": "⚡ SCALP",
  "pips_risk": 11.5,
  "pips_tp1": 6.2,
  "pips_tp2": 12.5,
  "status": "closed",
  "result_pips": 12.5,
  "closed_at": "2026-01-15T15:45:00.000Z"
}
```

This format makes combining backtest + live data straightforward.
