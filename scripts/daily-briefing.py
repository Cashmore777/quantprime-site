#!/usr/bin/env python3
"""
Quant Prime Daily Market Briefing
Generates daily email with market data for Research tier members.

Run: python3 daily-briefing.py [--send] [--test]
  --send: Actually send via Brevo API
  --test: Send to test email only

Cron: 0 22 * * 1-5 /usr/bin/python3 /path/to/daily-briefing.py --send
"""

import os
import sys
import json
from datetime import datetime, timedelta
from pathlib import Path

# Try importing required packages
try:
    import yfinance as yf
    import pandas as pd
except ImportError:
    print("Installing required packages...")
    os.system("pip3 install yfinance pandas --user -q")
    import yfinance as yf
    import pandas as pd

# ═══════════════════════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════════

# Full instrument list - ORDERED by popularity/trading volume
INSTRUMENTS = [
    # === TOP TIER (Most Popular) ===
    ('GC=F',      {'name': 'XAU/USD', 'type': 'commodity', 'pip': 0.01}),     # Gold - #1
    ('EURUSD=X',  {'name': 'EUR/USD', 'type': 'forex', 'pip': 0.0001}),       # Most traded forex
    ('^IXIC',     {'name': 'NAS100', 'type': 'index', 'pip': 1}),             # Tech index
    ('^GSPC',     {'name': 'SPX500', 'type': 'index', 'pip': 0.01}),          # S&P 500
    ('^DJI',      {'name': 'US30', 'type': 'index', 'pip': 1}),               # Dow Jones
    
    # === MAJOR FOREX ===
    ('GBPUSD=X',  {'name': 'GBP/USD', 'type': 'forex', 'pip': 0.0001}),       # Cable
    ('USDJPY=X',  {'name': 'USD/JPY', 'type': 'forex', 'pip': 0.01}),         # Gopher
    ('AUDUSD=X',  {'name': 'AUD/USD', 'type': 'forex', 'pip': 0.0001}),       # Aussie
    ('USDCAD=X',  {'name': 'USD/CAD', 'type': 'forex', 'pip': 0.0001}),       # Loonie
    ('USDCHF=X',  {'name': 'USD/CHF', 'type': 'forex', 'pip': 0.0001}),       # Swissie
    ('NZDUSD=X',  {'name': 'NZD/USD', 'type': 'forex', 'pip': 0.0001}),       # Kiwi
    
    # === CROSS PAIRS ===
    ('EURGBP=X',  {'name': 'EUR/GBP', 'type': 'forex', 'pip': 0.0001}),
    ('EURJPY=X',  {'name': 'EUR/JPY', 'type': 'forex', 'pip': 0.01}),
    ('GBPJPY=X',  {'name': 'GBP/JPY', 'type': 'forex', 'pip': 0.01}),         # Beast
    ('AUDJPY=X',  {'name': 'AUD/JPY', 'type': 'forex', 'pip': 0.01}),
    ('EURAUD=X',  {'name': 'EUR/AUD', 'type': 'forex', 'pip': 0.0001}),
    ('GBPAUD=X',  {'name': 'GBP/AUD', 'type': 'forex', 'pip': 0.0001}),
    ('EURCAD=X',  {'name': 'EUR/CAD', 'type': 'forex', 'pip': 0.0001}),
    ('CADJPY=X',  {'name': 'CAD/JPY', 'type': 'forex', 'pip': 0.01}),
    ('CHFJPY=X',  {'name': 'CHF/JPY', 'type': 'forex', 'pip': 0.01}),
    
    # === COMMODITIES ===
    ('SI=F',      {'name': 'XAG/USD', 'type': 'commodity', 'pip': 0.001}),    # Silver
    ('CL=F',      {'name': 'WTI Oil', 'type': 'commodity', 'pip': 0.01}),     # Crude Oil
    ('BZ=F',      {'name': 'Brent', 'type': 'commodity', 'pip': 0.01}),       # Brent Oil
    ('NG=F',      {'name': 'Nat Gas', 'type': 'commodity', 'pip': 0.001}),    # Natural Gas
    
    # === GLOBAL INDICES ===
    ('^FTSE',     {'name': 'UK100', 'type': 'index', 'pip': 0.1}),            # FTSE 100
    ('^GDAXI',    {'name': 'GER40', 'type': 'index', 'pip': 0.1}),            # DAX
    ('^N225',     {'name': 'JPN225', 'type': 'index', 'pip': 1}),             # Nikkei
    ('^HSI',      {'name': 'HK50', 'type': 'index', 'pip': 1}),               # Hang Seng
    
    # === CRYPTO (if available) ===
    ('BTC-USD',   {'name': 'BTC/USD', 'type': 'crypto', 'pip': 1}),           # Bitcoin
    ('ETH-USD',   {'name': 'ETH/USD', 'type': 'crypto', 'pip': 0.01}),        # Ethereum
]

# Load .env file if exists
env_path = Path(__file__).parent / '.env'
if env_path.exists():
    with open(env_path) as f:
        for line in f:
            if '=' in line and not line.startswith('#'):
                key, value = line.strip().split('=', 1)
                os.environ[key] = value

# Brevo API
BREVO_API_KEY = os.environ.get('BREVO_API_KEY', '')
FROM_EMAIL = 'cash@themoneyprinter.uk'
FROM_NAME = 'Quant Prime'

# Colors matching QP theme
COLORS = {
    'gold': '#c9a84c',
    'cyan': '#00abff',
    'bg': '#fafafa',
    'surface': '#ffffff',
    'text1': '#1a1a1a',
    'text2': '#666666',
    'text3': '#999999',
    'prime': '#1a9956',
    'good': '#2d8abf',
    'meh': '#d4940a',
    'skip': '#c43030',
    'bullish': '#16864a',
    'bearish': '#b82828',
}

# ═══════════════════════════════════════════════════════════════════════════════
# CALCULATIONS (matching Pine Script logic)
# ═══════════════════════════════════════════════════════════════════════════════

def calc_atr(df, period=14):
    """Calculate Average True Range"""
    high = df['High']
    low = df['Low']
    close = df['Close'].shift(1)
    
    tr1 = high - low
    tr2 = abs(high - close)
    tr3 = abs(low - close)
    
    tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
    return tr.rolling(window=period).mean()

def calc_adx(df, period=14):
    """Calculate Average Directional Index"""
    high = df['High']
    low = df['Low']
    close = df['Close']
    
    # Calculate +DM and -DM
    plus_dm = high.diff()
    minus_dm = -low.diff()
    
    plus_dm[plus_dm < 0] = 0
    minus_dm[minus_dm < 0] = 0
    
    # Where +DM > -DM, -DM = 0 and vice versa
    plus_dm[(plus_dm < minus_dm)] = 0
    minus_dm[(minus_dm < plus_dm)] = 0
    
    # Calculate TR
    tr = calc_atr(df, 1) * 1  # Get raw TR
    
    # Smooth with Wilder's method (EMA with alpha = 1/period)
    atr = calc_atr(df, period)
    
    # Calculate +DI and -DI
    plus_di = 100 * (plus_dm.ewm(span=period, adjust=False).mean() / atr)
    minus_di = 100 * (minus_dm.ewm(span=period, adjust=False).mean() / atr)
    
    # Calculate DX and ADX
    dx = 100 * abs(plus_di - minus_di) / (plus_di + minus_di)
    adx = dx.ewm(span=period, adjust=False).mean()
    
    return adx.fillna(0)

def calc_ema(series, period):
    """Calculate Exponential Moving Average"""
    return series.ewm(span=period, adjust=False).mean()

def calc_regime_score(atr_current, atr_avg, adx_value):
    """
    Calculate regime score (matching Pine Script logic)
    ATR ratio scoring + ADX scoring
    """
    if atr_avg == 0:
        ratio = 1.0
    else:
        ratio = atr_current / atr_avg
    
    # Volatility score
    if 0.85 < ratio < 1.2:
        v_score = 40.0  # Perfect volatility
    elif 0.7 < ratio < 1.4:
        v_score = 20.0  # Acceptable
    else:
        v_score = 0.0   # Too extreme
    
    # Trend score (ADX capped at 50)
    t_score = min(adx_value, 50.0)
    
    return v_score + t_score

def get_regime_label(score):
    """Convert score to label"""
    if score > 70:
        return 'Prime'
    elif score > 55:
        return 'Favourable'
    elif score > 40:
        return 'Marginal'
    else:
        return 'Degraded'

def get_bias(df):
    """
    Determine market bias based on EMA order
    Bullish: 233 < 80 < 26 (stacked bottom to top)
    Bearish: 233 > 80 > 26 (stacked top to bottom)
    """
    close = df['Close'].iloc[-1]
    ema26 = calc_ema(df['Close'], 26).iloc[-1]
    ema80 = calc_ema(df['Close'], 80).iloc[-1]
    ema233 = calc_ema(df['Close'], 233).iloc[-1]
    
    if ema233 < ema80 < ema26:
        return 'BULLISH', 'Trend'
    elif ema233 > ema80 > ema26:
        return 'BEARISH', 'Trend'
    else:
        # Consolidation - check EMA8 vs EMA26 for bias
        ema8 = calc_ema(df['Close'], 8).iloc[-1]
        if ema8 > ema26:
            return 'BULLISH', 'Range'
        else:
            return 'BEARISH', 'Range'

# ═══════════════════════════════════════════════════════════════════════════════
# DATA FETCHING
# ═══════════════════════════════════════════════════════════════════════════════

def fetch_instrument_data(symbol, info):
    """Fetch and analyze data for a single instrument"""
    try:
        ticker = yf.Ticker(symbol)
        
        # Get DAILY data for today's open/close (accurate daily change)
        df_daily = ticker.history(period='5d', interval='1d')
        
        # Get 4H data for regime/bias calculations (closer to 3H)
        df_4h = ticker.history(period='60d', interval='1h')
        
        # Resample hourly to 4H for indicator calculations
        if not df_4h.empty and len(df_4h) > 200:
            df_4h = df_4h.resample('4h').agg({
                'Open': 'first',
                'High': 'max',
                'Low': 'min',
                'Close': 'last',
                'Volume': 'sum'
            }).dropna()
        else:
            # Fallback to daily if hourly not available
            df_4h = ticker.history(period='100d', interval='1d')
        
        if df_daily.empty or df_4h.empty or len(df_4h) < 50:
            return None
        
        # TODAY's data from daily candle (for open/close/change)
        today = df_daily.iloc[-1]
        
        # Calculate indicators on 4H data (for regime/bias)
        atr = calc_atr(df_4h, 14)
        atr_current = atr.iloc[-1]
        atr_avg = atr.rolling(50).mean().iloc[-1]
        
        adx = calc_adx(df_4h, 14)
        adx_current = adx.iloc[-1]
        
        # Regime (from 4H)
        regime_score = calc_regime_score(atr_current, atr_avg, adx_current)
        regime_label = get_regime_label(regime_score)
        
        # Bias (from 4H EMAs)
        bias, market_type = get_bias(df_4h)
        
        # Price data - USE TODAY'S DAILY CANDLE
        open_price = today['Open']      # Today's open
        close_price = today['Close']    # Current price (or today's close)
        high_price = today['High']      # Today's high
        low_price = today['Low']        # Today's low
        
        # Calculate pip range (today's range)
        pip_size = info['pip']
        range_pips = (high_price - low_price) / pip_size
        
        # Daily change = FROM TODAY'S OPEN to current price
        change = close_price - open_price
        change_pct = (change / open_price) * 100
        
        return {
            'symbol': symbol,
            'name': info['name'],
            'type': info['type'],
            'open': open_price,
            'close': close_price,
            'high': high_price,
            'low': low_price,
            'range_pips': range_pips,
            'change': change,
            'change_pct': change_pct,
            'regime_score': regime_score,
            'regime': regime_label,
            'bias': bias,
            'market_type': market_type,
            'atr': atr_current,
            'adx': adx_current,
        }
    except Exception as e:
        print(f"Error fetching {symbol}: {e}")
        return None

def fetch_all_data():
    """Fetch data for all instruments (maintains order)"""
    results = []
    for symbol, info in INSTRUMENTS:
        print(f"Fetching {info['name']}...")
        data = fetch_instrument_data(symbol, info)
        if data:
            results.append(data)
    return results

def fetch_market_news():
    """Fetch top market headlines from Yahoo Finance"""
    try:
        import urllib.request
        import re
        
        # Get Yahoo Finance homepage for market news
        url = "https://finance.yahoo.com/"
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        
        with urllib.request.urlopen(req, timeout=10) as response:
            html = response.read().decode('utf-8', errors='ignore')
        
        # Extract headlines (simple regex for title tags in news items)
        # Look for common headline patterns
        headlines = []
        
        # Try to find headline text in the HTML
        patterns = [
            r'<h3[^>]*>([^<]{20,100})</h3>',
            r'"title":"([^"]{20,100})"',
        ]
        
        # Words to filter out (countdowns, cookies, UI elements)
        skip_words = ['cookie', 'close in', 'closes in', 'opens in', 'market close', 'market open', 'minutes', 'hours left', 'sign in', 'log in']
        
        for pattern in patterns:
            matches = re.findall(pattern, html)
            for match in matches[:10]:
                clean = match.strip()
                # Skip if contains any filter words
                if any(skip in clean.lower() for skip in skip_words):
                    continue
                if clean and len(clean) > 20:
                    headlines.append(clean)
                    if len(headlines) >= 3:
                        break
            if len(headlines) >= 3:
                break
        
        return headlines[:3] if headlines else ["Markets active across major pairs", "Volatility remains elevated", "Key levels in focus"]
    except Exception as e:
        print(f"News fetch error: {e}")
        return ["Markets active across major pairs", "Volatility remains elevated", "Key levels in focus"]

# ═══════════════════════════════════════════════════════════════════════════════
# EMAIL TEMPLATE
# ═══════════════════════════════════════════════════════════════════════════════

def generate_html(data, date_str, headlines=None):
    """Generate HTML email matching QP aesthetic - MOBILE FIRST"""
    
    if headlines is None:
        headlines = []
    
    # Calculate summary stats
    bullish_count = sum(1 for d in data if d['bias'] == 'BULLISH')
    bearish_count = len(data) - bullish_count
    
    regime_counts = {}
    for d in data:
        regime_counts[d['regime']] = regime_counts.get(d['regime'], 0) + 1
    
    # Find biggest movers
    sorted_by_change = sorted(data, key=lambda x: abs(x['change_pct']), reverse=True)
    top_mover = sorted_by_change[0] if sorted_by_change else None
    
    # Average range
    avg_range = sum(d['range_pips'] for d in data) / len(data) if data else 0
    
    # Build instrument cards (mobile-friendly, detailed)
    cards_html = ""
    for d in data:
        # Regime color
        regime_colors = {
            'Prime': COLORS['prime'],
            'Favourable': COLORS['good'],
            'Marginal': COLORS['meh'],
            'Degraded': COLORS['skip'],
        }
        regime_color = regime_colors.get(d['regime'], COLORS['text3'])
        
        # Bias color and arrow - make it clear this is DAILY BIAS
        bias_color = COLORS['bullish'] if d['bias'] == 'BULLISH' else COLORS['bearish']
        bias_arrow = '▲' if d['bias'] == 'BULLISH' else '▼'
        bias_text = 'Long' if d['bias'] == 'BULLISH' else 'Short'
        
        # Format prices based on type
        if d['type'] == 'forex':
            decimals = 3 if 'JPY' in d['name'] else 5
            price_fmt = f"{d['close']:.{decimals}f}"
            high_fmt = f"{d['high']:.{decimals}f}"
            low_fmt = f"{d['low']:.{decimals}f}"
        else:
            price_fmt = f"{d['close']:.2f}"
            high_fmt = f"{d['high']:.2f}"
            low_fmt = f"{d['low']:.2f}"
        
        # Change formatting
        change_sign = '+' if d['change_pct'] >= 0 else ''
        change_color = COLORS['bullish'] if d['change_pct'] >= 0 else COLORS['bearish']
        
        cards_html += f'''
        <div style="background: linear-gradient(145deg, #ffffff 0%, #fafafa 100%); border-radius: 14px; padding: 18px; margin-bottom: 14px; box-shadow: 0 4px 16px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.03); border: 1px solid rgba(0,0,0,0.04); position: relative; overflow: hidden;">
            <!-- Premium accent line -->
            <div style="position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, {regime_color}, {regime_color}88);"></div>
            
            <!-- Header: Pair + Regime Badge -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding-top: 4px;">
                <div style="font-size: 18px; font-weight: 700; color: #1a1a1a; letter-spacing: -0.01em;">{d['name']}</div>
                <span style="padding: 5px 12px; border-radius: 6px; font-size: 10px; font-weight: 700; letter-spacing: 0.03em; background: linear-gradient(135deg, {regime_color}25, {regime_color}15); color: {regime_color}; border: 1px solid {regime_color}30;">{d['regime']}</span>
            </div>
            
            <!-- Daily Bias Label -->
            <div style="margin-bottom: 14px; padding: 8px 12px; background: linear-gradient(135deg, {bias_color}10, {bias_color}05); border-radius: 8px; border: 1px solid {bias_color}20;">
                <span style="font-size: 10px; color: #888; font-weight: 600; letter-spacing: 0.05em;">DAILY BIAS</span>
                <span style="font-size: 13px; font-weight: 700; color: {bias_color}; margin-left: 8px;">{bias_arrow} {bias_text}</span>
            </div>
            
            <!-- Current Price Row -->
            <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 14px;">
                <div>
                    <div style="font-size: 9px; color: #999; letter-spacing: 0.08em; font-weight: 600; margin-bottom: 4px;">CURRENT</div>
                    <span style="font-family: 'SF Mono', Monaco, monospace; font-size: 22px; font-weight: 700; color: #1a1a1a; letter-spacing: -0.02em;">{price_fmt}</span>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 9px; color: #999; letter-spacing: 0.08em; font-weight: 600; margin-bottom: 4px;">TODAY</div>
                    <span style="font-size: 18px; font-weight: 700; color: {change_color};">{change_sign}{d['change_pct']:.2f}%</span>
                </div>
            </div>
            
            <!-- High / Low / Range - Table layout for email compatibility -->
            <table style="width: 100%; background-color: #f5f5f5 !important; border-radius: 10px; border-collapse: collapse;">
                <tr>
                    <td style="width: 33%; text-align: center; padding: 10px 8px; border-right: 1px solid #e0e0e0;">
                        <div style="font-size: 8px; color: #999 !important; letter-spacing: 0.1em; font-weight: 700; margin-bottom: 4px;">HIGH</div>
                        <div style="font-family: monospace; font-size: 11px; color: #1a1a1a !important; font-weight: 600;">{high_fmt}</div>
                    </td>
                    <td style="width: 33%; text-align: center; padding: 10px 8px; border-right: 1px solid #e0e0e0;">
                        <div style="font-size: 8px; color: #999 !important; letter-spacing: 0.1em; font-weight: 700; margin-bottom: 4px;">LOW</div>
                        <div style="font-family: monospace; font-size: 11px; color: #1a1a1a !important; font-weight: 600;">{low_fmt}</div>
                    </td>
                    <td style="width: 33%; text-align: center; padding: 10px 8px;">
                        <div style="font-size: 8px; color: #999 !important; letter-spacing: 0.1em; font-weight: 700; margin-bottom: 4px;">RANGE</div>
                        <div style="font-family: monospace; font-size: 11px; color: #c9a84c !important; font-weight: 700;">{d['range_pips']:.0f} pips</div>
                    </td>
                </tr>
            </table>
        </div>
        '''
    
    # Top mover formatting
    mover_html = ""
    if top_mover:
        mover_sign = '+' if top_mover['change_pct'] >= 0 else ''
        mover_color = COLORS['bullish'] if top_mover['change_pct'] >= 0 else COLORS['bearish']
        mover_name = top_mover['name']
        mover_pct = f"{mover_sign}{top_mover['change_pct']:.2f}%"
        mover_html = f'''<div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: #fafafa; border-radius: 8px; margin-bottom: 14px;">
                <div>
                    <div style="font-size: 10px; color: #999;">BIGGEST MOVER</div>
                    <div style="font-size: 14px; font-weight: 600; color: #1a1a1a;">{mover_name}</div>
                </div>
                <div style="font-size: 18px; font-weight: 700; color: {mover_color};">{mover_pct}</div>
            </div>'''
    
    # Headlines HTML
    headlines_items = ""
    if headlines:
        for h in headlines[:3]:
            headlines_items += f'<div style="font-size: 12px; color: #666; margin-bottom: 6px; padding-left: 12px; border-left: 2px solid #c9a84c;">{h}</div>'
    
    headlines_section = ""
    if headlines_items:
        headlines_section = f'''<div style="background: #ffffff; border-radius: 10px; padding: 14px; margin-bottom: 16px;">
            <div style="font-size: 10px; font-weight: 700; letter-spacing: 0.1em; color: #999; margin-bottom: 10px;">MARKET PULSE</div>
            {headlines_items}
        </div>'''
    
    html = f'''
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="light only">
    <meta name="supported-color-schemes" content="light only">
    <title>Quant Prime Daily Briefing</title>
    <style>
        :root {{ color-scheme: light only; }}
        @media (prefers-color-scheme: dark) {{
            body, table, td, div {{ background-color: #ffffff !important; color: #1a1a1a !important; }}
        }}
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #ffffff; font-family: -apple-system, system-ui, sans-serif; color: #1a1a1a;">
    <!-- Wrapper table - FORCE LIGHT MODE -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="background-color: #ffffff !important;">
    <tr><td align="center" bgcolor="#ffffff" style="padding: 20px 0; background-color: #ffffff !important;">
    
    <!-- Container Table - FORCE LIGHT -->
    <table width="400" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="max-width: 400px; margin: 0 auto; background-color: #ffffff !important;">
    <tr><td bgcolor="#ffffff" style="padding: 24px 16px; background-color: #ffffff !important;">
        
        <!-- Premium Header - Dark Mode Safe -->
        <div style="text-align: center; margin-bottom: 24px; padding: 20px; background-color: #ffffff !important; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.06);">
            <div style="font-size: 10px; font-weight: 800; letter-spacing: 0.2em; color: #c9a84c !important; margin-bottom: 8px;">QUANT PRIME</div>
            <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #1a1a1a !important; letter-spacing: -0.02em;">Daily Briefing</h1>
            <div style="font-size: 12px; color: #666666 !important; margin-top: 6px; font-weight: 500;">{date_str}</div>
            <div style="width: 40px; height: 3px; background-color: #c9a84c; margin: 12px auto 0; border-radius: 2px;"></div>
        </div>
        
        <!-- Market Summary Card - Premium -->
        <div style="background: linear-gradient(145deg, #ffffff 0%, #f9f9f9 100%); border-radius: 16px; padding: 20px; margin-bottom: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.8); border: 1px solid rgba(201,168,76,0.15);">
            <div style="font-size: 9px; font-weight: 800; letter-spacing: 0.15em; color: #c9a84c; margin-bottom: 14px; text-transform: uppercase;">Today's Snapshot</div>
            
            <!-- Bias Summary -->
            <div style="display: flex; justify-content: space-between; margin-bottom: 14px;">
                <div style="flex: 1;">
                    <div style="font-size: 11px; color: {COLORS['text3']};">Market Bias</div>
                    <div style="font-size: 16px; font-weight: 600; color: {COLORS['text1']};">
                        <span style="color: {COLORS['bullish']};">{bullish_count} Bullish</span> · <span style="color: {COLORS['bearish']};">{bearish_count} Bearish</span>
                    </div>
                </div>
            </div>
            
            <!-- Key Stats Grid - Dark Mode Safe -->
            <div style="display: flex; gap: 8px; margin-bottom: 14px;">
                <div style="flex: 1; background-color: #f5f5f5 !important; border-radius: 8px; padding: 10px; text-align: center;">
                    <div style="font-size: 20px; font-weight: 700; color: {COLORS['prime']} !important;">{regime_counts.get('Prime', 0)}</div>
                    <div style="font-size: 9px; color: #666666 !important;">Prime</div>
                </div>
                <div style="flex: 1; background-color: #f5f5f5 !important; border-radius: 8px; padding: 10px; text-align: center;">
                    <div style="font-size: 20px; font-weight: 700; color: {COLORS['good']} !important;">{regime_counts.get('Favourable', 0)}</div>
                    <div style="font-size: 9px; color: #666666 !important;">Favourable</div>
                </div>
                <div style="flex: 1; background-color: #f5f5f5 !important; border-radius: 8px; padding: 10px; text-align: center;">
                    <div style="font-size: 20px; font-weight: 700; color: {COLORS['meh']} !important;">{regime_counts.get('Marginal', 0)}</div>
                    <div style="font-size: 9px; color: #666666 !important;">Marginal</div>
                </div>
                <div style="flex: 1; background-color: #f5f5f5 !important; border-radius: 8px; padding: 10px; text-align: center;">
                    <div style="font-size: 20px; font-weight: 700; color: {COLORS['skip']} !important;">{regime_counts.get('Degraded', 0)}</div>
                    <div style="font-size: 9px; color: #666666 !important;">Degraded</div>
                </div>
            </div>
            
            <!-- Top Mover -->
            {mover_html}
            
            <!-- Average Range -->
            <div style="font-size: 12px; color: {COLORS['text2']};">
                <span style="color: {COLORS['text3']};">Avg Range:</span> <strong>{avg_range:.0f} pips</strong> across {len(data)} pairs
            </div>
        </div>
        
        <!-- Market Headlines -->
        {headlines_section}
        
        <!-- Section Header -->
        <div style="font-size: 10px; font-weight: 700; letter-spacing: 0.1em; color: {COLORS['text3']}; margin-bottom: 10px; padding-left: 4px;">INSTRUMENT BREAKDOWN</div>
        
        <!-- Instrument Cards -->
        {cards_html}
        
        <!-- Regime Explanation - Premium -->
        <div style="margin-top: 24px; padding: 20px; background: linear-gradient(145deg, #ffffff 0%, #f9f9f9 100%); border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.8); border: 1px solid rgba(0,0,0,0.04);">
            <div style="font-size: 9px; font-weight: 800; letter-spacing: 0.15em; color: #c9a84c; margin-bottom: 14px;">UNDERSTANDING REGIME SCORES</div>
            
            <div style="font-size: 12px; color: #555; line-height: 1.7; margin-bottom: 14px;">
                Regime scores measure <strong style="color: #1a1a1a;">trading conditions</strong> based on two key factors:
            </div>
            
            <div style="font-size: 11px; color: #666; margin-bottom: 10px; padding: 10px 12px; background: linear-gradient(90deg, rgba(201,168,76,0.08), transparent); border-radius: 8px; border-left: 3px solid #c9a84c;">
                <strong style="color: #1a1a1a;">Volatility (ATR Ratio)</strong> — Is price movement within normal range? Scores highest when ATR is 85-120% of its 50-period average.
            </div>
            
            <div style="font-size: 11px; color: #666; margin-bottom: 16px; padding: 10px 12px; background: linear-gradient(90deg, rgba(201,168,76,0.08), transparent); border-radius: 8px; border-left: 3px solid #c9a84c;">
                <strong style="color: #1a1a1a;">Trend Strength (ADX)</strong> — How strong is the directional movement? Higher ADX = stronger trend.
            </div>
            
            <!-- Regime descriptions - stacked for mobile -->
            <div style="font-size: 11px;">
                <div style="padding: 8px 10px; margin-bottom: 6px; background-color: #f8f8f8 !important; border-radius: 6px; border-left: 3px solid {COLORS['prime']};">
                    <span style="color: {COLORS['prime']} !important; font-weight: 700;">Prime (70+)</span>
                    <span style="color: #666 !important;"> — Optimal. Trade confidently.</span>
                </div>
                <div style="padding: 8px 10px; margin-bottom: 6px; background-color: #f8f8f8 !important; border-radius: 6px; border-left: 3px solid {COLORS['good']};">
                    <span style="color: {COLORS['good']} !important; font-weight: 700;">Favourable (55-70)</span>
                    <span style="color: #666 !important;"> — Good. Proceed normally.</span>
                </div>
                <div style="padding: 8px 10px; margin-bottom: 6px; background-color: #f8f8f8 !important; border-radius: 6px; border-left: 3px solid {COLORS['meh']};">
                    <span style="color: {COLORS['meh']} !important; font-weight: 700;">Marginal (40-55)</span>
                    <span style="color: #666 !important;"> — Caution. Reduce size.</span>
                </div>
                <div style="padding: 8px 10px; background-color: #f8f8f8 !important; border-radius: 6px; border-left: 3px solid {COLORS['skip']};">
                    <span style="color: {COLORS['skip']} !important; font-weight: 700;">Degraded (&lt;40)</span>
                    <span style="color: #666 !important;"> — Poor. Consider avoiding.</span>
                </div>
            </div>
            
            <div style="font-size: 10px; color: #999; margin-top: 14px; padding-top: 12px; border-top: 1px solid #eee; font-style: italic;">
                Daily Bias is determined by EMA alignment on the 4H timeframe. This is directional context, not a trade signal.
            </div>
        </div>
        
        <!-- Footer -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 28px;">
        <tr><td align="center" style="padding: 20px; background-color: #1a1a1a; border-radius: 14px;">
            <div style="font-size: 10px; font-weight: 700; letter-spacing: 0.15em; color: #c9a84c; margin-bottom: 10px;">QUANT PRIME</div>
            <a href="https://quantprime.uk/dashboard" style="display: inline-block; padding: 10px 24px; background-color: #c9a84c; color: #1a1a1a; font-size: 12px; font-weight: 700; text-decoration: none; border-radius: 8px;">Open Dashboard</a>
            <div style="font-size: 10px; color: #888888; margin-top: 14px;">
                Research Tier · <a href="{{{{unsubscribe}}}}" style="color: #888888;">Unsubscribe</a>
            </div>
        </td></tr>
        </table>
        
    </td></tr>
    </table>
    </td></tr>
    </table>
</body>
</html>
'''
    return html

# ═══════════════════════════════════════════════════════════════════════════════
# SENDING
# ═══════════════════════════════════════════════════════════════════════════════

def send_via_brevo(html, subject, recipients):
    """Send email via Brevo API"""
    if not BREVO_API_KEY:
        print("ERROR: BREVO_API_KEY not set")
        return False
    
    import urllib.request
    import urllib.error
    
    url = "https://api.brevo.com/v3/smtp/email"
    
    payload = {
        "sender": {"name": FROM_NAME, "email": FROM_EMAIL},
        "to": [{"email": email} for email in recipients],
        "subject": subject,
        "htmlContent": html,
    }
    
    data = json.dumps(payload).encode('utf-8')
    
    req = urllib.request.Request(url, data=data)
    req.add_header('accept', 'application/json')
    req.add_header('api-key', BREVO_API_KEY)
    req.add_header('content-type', 'application/json')
    
    try:
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode())
            print(f"✓ Email sent! Message ID: {result.get('messageId', 'N/A')}")
            return True
    except urllib.error.HTTPError as e:
        print(f"ERROR: {e.code} - {e.read().decode()}")
        return False

def save_to_archive(html, date_str):
    """Save email to dashboard archive + update index"""
    archive_dir = Path(__file__).parent.parent / 'dashboard' / 'data' / 'briefings'
    archive_dir.mkdir(parents=True, exist_ok=True)
    
    filename = f"briefing-{date_str.replace(' ', '-')}.html"
    filepath = archive_dir / filename
    
    with open(filepath, 'w') as f:
        f.write(html)
    
    # Update index.json for dashboard
    index_path = archive_dir / 'index.json'
    index = []
    if index_path.exists():
        try:
            with open(index_path) as f:
                index = json.load(f)
        except:
            index = []
    
    # Add new briefing to front of list
    new_entry = {
        'date': date_str,
        'filename': filename,
        'timestamp': datetime.now().isoformat()
    }
    
    # Remove duplicate if exists
    index = [i for i in index if i['filename'] != filename]
    index.insert(0, new_entry)
    
    # Keep last 90 days
    index = index[:90]
    
    with open(index_path, 'w') as f:
        json.dump(index, f, indent=2)
    
    # Also save as "latest.html" for easy dashboard access
    latest_path = archive_dir / 'latest.html'
    with open(latest_path, 'w') as f:
        f.write(html)
    
    print(f"✓ Saved to archive: {filepath}")
    return filepath


def get_recipients():
    """Get Research+ tier member emails from Supabase"""
    import urllib.request
    
    SUPABASE_URL = 'https://pjqwnqhnuxwinwxdritp.supabase.co'
    SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqcXducWhudXh3aW53eGRyaXRwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDkyNjg0MiwiZXhwIjoyMTAwNTAyODQyfQ.r5_bRHQtec8iP1M5WtTkGwHwLVvm8F-zFu-2mqqcjVk'
    
    # Tiers that get daily briefing
    tiers = ['research', 'recoil', 'terminal', 'suite', 'ascension', 'admin']
    recipients = set()
    
    for tier in tiers:
        url = f"{SUPABASE_URL}/rest/v1/profiles?tier=eq.{tier}&select=email"
        req = urllib.request.Request(url)
        req.add_header('apikey', SUPABASE_SERVICE_KEY)
        req.add_header('Authorization', f'Bearer {SUPABASE_SERVICE_KEY}')
        
        try:
            with urllib.request.urlopen(req, timeout=10) as response:
                data = json.loads(response.read().decode())
                for profile in data:
                    if profile.get('email'):
                        recipients.add(profile['email'])
        except Exception as e:
            print(f"Warning: Could not fetch {tier} tier: {e}")
    
    # Always include test email as backup
    recipients.add('clandestineascendancy.tmp@gmail.com')
    
    return list(recipients)

# ═══════════════════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════════════════

def main():
    print("=" * 60)
    print("QUANT PRIME DAILY BRIEFING GENERATOR")
    print("=" * 60)
    
    # Date
    now = datetime.now()
    date_str = now.strftime("%d %b %Y").upper()
    
    # Fetch data
    print("\nFetching market data...")
    data = fetch_all_data()
    
    if not data:
        print("ERROR: No data fetched!")
        return 1
    
    print(f"\n✓ Got data for {len(data)} instruments")
    
    # Fetch market headlines
    print("\nFetching market headlines...")
    headlines = fetch_market_news()
    print(f"✓ Got {len(headlines)} headlines")
    
    # Generate HTML
    print("\nGenerating email...")
    html = generate_html(data, date_str, headlines)
    
    # Save preview
    preview_path = Path(__file__).parent / 'briefing-preview.html'
    with open(preview_path, 'w') as f:
        f.write(html)
    print(f"✓ Preview saved: {preview_path}")
    
    # Archive
    save_to_archive(html, date_str)
    
    # Send if requested
    if '--send' in sys.argv:
        print("\nGetting recipients...")
        recipients = get_recipients()
        print(f"✓ Found {len(recipients)} recipients")
        
        print("\nSending via Brevo...")
        subject = f"Daily Briefing · {date_str}"
        send_via_brevo(html, subject, recipients)
    elif '--test' in sys.argv:
        print("\n--test mode: Preview saved, not sending")
    else:
        print("\nRun with --send to send via Brevo, or --test for preview only")
    
    print("\n" + "=" * 60)
    print("DONE")
    print("=" * 60)
    return 0

if __name__ == '__main__':
    sys.exit(main())
