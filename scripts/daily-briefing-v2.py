#!/usr/bin/env python3
"""
Quant Prime Daily Market Briefing v2
=====================================
Generates:
1. Full JSON data for Market Intelligence dashboard
2. AI-powered analysis per instrument + tomorrow's outlook
3. Economic calendar events
4. Short teaser email with CTA to dashboard

Run: python3 daily-briefing-v2.py [--send] [--test] [--no-ai]
  --send: Send teaser email via Brevo
  --test: Send to test email only
  --no-ai: Skip AI analysis (faster, cheaper)

Cron: 0 22 * * 1-5 /usr/bin/python3 /path/to/daily-briefing-v2.py --send
"""

import os
import sys
import json
from datetime import datetime, timedelta
from pathlib import Path
import urllib.request
import urllib.error
import urllib.parse

# ═══════════════════════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════════

# Try importing required packages
def install_packages():
    try:
        import yfinance
        import pandas
        import anthropic
    except ImportError:
        print("Installing required packages...")
        os.system("pip3 install yfinance pandas anthropic --user -q")

install_packages()

import yfinance as yf
import pandas as pd

# API Keys from environment (set in .env or system environment)
# Load .env if exists
env_path = Path(__file__).parent / '.env'
if env_path.exists():
    with open(env_path) as f:
        for line in f:
            if '=' in line and not line.startswith('#'):
                key, value = line.strip().split('=', 1)
                os.environ[key] = value

BREVO_API_KEY = os.environ.get('BREVO_API_KEY', '')
ANTHROPIC_API_KEY = os.environ.get('ANTHROPIC_API_KEY', '')
SUPABASE_SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_KEY', '')

# Paths
BASE_DIR = Path(__file__).parent.parent
INTEL_DIR = BASE_DIR / 'research' / 'intel' / 'daily'
WEEKLY_DIR = BASE_DIR / 'research' / 'intel' / 'weekly'

# Email settings
FROM_EMAIL = 'noreply@quantprime.uk'
FROM_NAME = 'Quant Prime'
DASHBOARD_URL = 'https://quantprime.uk/research/intel/'
SUPABASE_URL = 'https://pjqwnqhnuxwinwxdritp.supabase.co'

# Full instrument list - ORDERED by popularity
INSTRUMENTS = [
    # === TOP TIER ===
    ('GC=F',      {'name': 'XAU/USD', 'type': 'commodity', 'pip': 0.01}),
    ('EURUSD=X',  {'name': 'EUR/USD', 'type': 'forex', 'pip': 0.0001}),
    ('^IXIC',     {'name': 'NAS100', 'type': 'index', 'pip': 1}),
    ('^GSPC',     {'name': 'SPX500', 'type': 'index', 'pip': 0.01}),
    ('^DJI',      {'name': 'US30', 'type': 'index', 'pip': 1}),
    
    # === MAJOR FOREX ===
    ('GBPUSD=X',  {'name': 'GBP/USD', 'type': 'forex', 'pip': 0.0001}),
    ('USDJPY=X',  {'name': 'USD/JPY', 'type': 'forex', 'pip': 0.01}),
    ('AUDUSD=X',  {'name': 'AUD/USD', 'type': 'forex', 'pip': 0.0001}),
    ('USDCAD=X',  {'name': 'USD/CAD', 'type': 'forex', 'pip': 0.0001}),
    ('USDCHF=X',  {'name': 'USD/CHF', 'type': 'forex', 'pip': 0.0001}),
    ('NZDUSD=X',  {'name': 'NZD/USD', 'type': 'forex', 'pip': 0.0001}),
    
    # === CROSS PAIRS ===
    ('EURGBP=X',  {'name': 'EUR/GBP', 'type': 'forex', 'pip': 0.0001}),
    ('EURJPY=X',  {'name': 'EUR/JPY', 'type': 'forex', 'pip': 0.01}),
    ('GBPJPY=X',  {'name': 'GBP/JPY', 'type': 'forex', 'pip': 0.01}),
    ('AUDJPY=X',  {'name': 'AUD/JPY', 'type': 'forex', 'pip': 0.01}),
    ('EURAUD=X',  {'name': 'EUR/AUD', 'type': 'forex', 'pip': 0.0001}),
    ('GBPAUD=X',  {'name': 'GBP/AUD', 'type': 'forex', 'pip': 0.0001}),
    ('EURCAD=X',  {'name': 'EUR/CAD', 'type': 'forex', 'pip': 0.0001}),
    ('CADJPY=X',  {'name': 'CAD/JPY', 'type': 'forex', 'pip': 0.01}),
    ('CHFJPY=X',  {'name': 'CHF/JPY', 'type': 'forex', 'pip': 0.01}),
    
    # === COMMODITIES ===
    ('SI=F',      {'name': 'XAG/USD', 'type': 'commodity', 'pip': 0.001}),
    ('CL=F',      {'name': 'WTI Oil', 'type': 'commodity', 'pip': 0.01}),
    ('BZ=F',      {'name': 'Brent', 'type': 'commodity', 'pip': 0.01}),
    ('NG=F',      {'name': 'Nat Gas', 'type': 'commodity', 'pip': 0.001}),
    
    # === INDICES ===
    ('^FTSE',     {'name': 'UK100', 'type': 'index', 'pip': 0.1}),
    ('^GDAXI',    {'name': 'GER40', 'type': 'index', 'pip': 0.1}),
    ('^N225',     {'name': 'JPN225', 'type': 'index', 'pip': 1}),
    ('^HSI',      {'name': 'HK50', 'type': 'index', 'pip': 1}),
    
    # === CRYPTO ===
    ('BTC-USD',   {'name': 'BTC/USD', 'type': 'crypto', 'pip': 1}),
    ('ETH-USD',   {'name': 'ETH/USD', 'type': 'crypto', 'pip': 0.01}),
]

# Colors
COLORS = {
    'gold': '#c9a84c',
    'cyan': '#00abff',
    'prime': '#1a9956',
    'good': '#2d8abf',
    'meh': '#d4940a',
    'skip': '#c43030',
    'bullish': '#16864a',
    'bearish': '#b82828',
}

# ═══════════════════════════════════════════════════════════════════════════════
# CALCULATIONS
# ═══════════════════════════════════════════════════════════════════════════════

def calc_atr(df, period=14):
    high = df['High']
    low = df['Low']
    close = df['Close'].shift(1)
    
    tr1 = high - low
    tr2 = abs(high - close)
    tr3 = abs(low - close)
    
    tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
    return tr.rolling(window=period).mean()

def calc_adx(df, period=14):
    high = df['High']
    low = df['Low']
    
    plus_dm = high.diff()
    minus_dm = -low.diff()
    
    plus_dm[plus_dm < 0] = 0
    minus_dm[minus_dm < 0] = 0
    plus_dm[(plus_dm < minus_dm)] = 0
    minus_dm[(minus_dm < plus_dm)] = 0
    
    atr = calc_atr(df, period)
    
    plus_di = 100 * (plus_dm.ewm(span=period, adjust=False).mean() / atr)
    minus_di = 100 * (minus_dm.ewm(span=period, adjust=False).mean() / atr)
    
    dx = 100 * abs(plus_di - minus_di) / (plus_di + minus_di)
    adx = dx.ewm(span=period, adjust=False).mean()
    
    return adx.fillna(0)

def calc_ema(series, period):
    return series.ewm(span=period, adjust=False).mean()

def calc_regime_score(atr_current, atr_avg, adx_value):
    if atr_avg == 0:
        ratio = 1.0
    else:
        ratio = atr_current / atr_avg
    
    if 0.85 < ratio < 1.2:
        v_score = 40.0
    elif 0.7 < ratio < 1.4:
        v_score = 20.0
    else:
        v_score = 0.0
    
    t_score = min(adx_value, 50.0)
    return v_score + t_score

def get_regime_label(score):
    if score > 70:
        return 'Prime'
    elif score > 55:
        return 'Favourable'
    elif score > 40:
        return 'Marginal'
    else:
        return 'Degraded'

def get_bias(df):
    ema26 = calc_ema(df['Close'], 26).iloc[-1]
    ema80 = calc_ema(df['Close'], 80).iloc[-1]
    ema233 = calc_ema(df['Close'], 233).iloc[-1]
    
    if ema233 < ema80 < ema26:
        return 'BULLISH', 'Trend'
    elif ema233 > ema80 > ema26:
        return 'BEARISH', 'Trend'
    else:
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
        
        df_daily = ticker.history(period='5d', interval='1d')
        df_4h = ticker.history(period='60d', interval='1h')
        
        if not df_4h.empty and len(df_4h) > 200:
            df_4h = df_4h.resample('4h').agg({
                'Open': 'first',
                'High': 'max',
                'Low': 'min',
                'Close': 'last',
                'Volume': 'sum'
            }).dropna()
        else:
            df_4h = ticker.history(period='100d', interval='1d')
        
        if df_daily.empty or df_4h.empty or len(df_4h) < 50:
            return None
        
        today = df_daily.iloc[-1]
        
        atr = calc_atr(df_4h, 14)
        atr_current = atr.iloc[-1]
        atr_avg = atr.rolling(50).mean().iloc[-1]
        
        adx = calc_adx(df_4h, 14)
        adx_current = adx.iloc[-1]
        
        regime_score = calc_regime_score(atr_current, atr_avg, adx_current)
        regime_label = get_regime_label(regime_score)
        
        bias, market_type = get_bias(df_4h)
        
        open_price = today['Open']
        close_price = today['Close']
        high_price = today['High']
        low_price = today['Low']
        
        pip_size = info['pip']
        range_pips = (high_price - low_price) / pip_size
        
        change = close_price - open_price
        change_pct = (change / open_price) * 100
        
        return {
            'symbol': symbol,
            'name': info['name'],
            'type': info['type'],
            'open': float(open_price),
            'close': float(close_price),
            'high': float(high_price),
            'low': float(low_price),
            'range_pips': float(range_pips),
            'change': float(change),
            'change_pct': float(change_pct),
            'regime_score': float(regime_score),
            'regime': regime_label,
            'bias': bias,
            'market_type': market_type,
            'atr': float(atr_current),
            'adx': float(adx_current),
        }
    except Exception as e:
        print(f"Error fetching {symbol}: {e}")
        return None

def fetch_all_data():
    """Fetch data for all instruments"""
    results = []
    for symbol, info in INSTRUMENTS:
        print(f"  Fetching {info['name']}...")
        data = fetch_instrument_data(symbol, info)
        if data:
            results.append(data)
    return results

# ═══════════════════════════════════════════════════════════════════════════════
# ECONOMIC CALENDAR
# ═══════════════════════════════════════════════════════════════════════════════

def fetch_economic_events():
    """Fetch upcoming economic events from Forex Factory or similar"""
    events = []
    
    try:
        # Try to get events from Investing.com economic calendar (free)
        # This is a simplified version - in production you'd want a proper API
        today = datetime.now()
        tomorrow = today + timedelta(days=1)
        
        # Fallback to common scheduled events (you can expand this)
        day_of_week = tomorrow.strftime('%A')
        
        common_events = {
            'Monday': [
                {'time': '13:30', 'name': 'Manufacturing PMI', 'currency': 'USD', 'impact': 'medium'},
            ],
            'Tuesday': [
                {'time': '07:00', 'name': 'UK CPI', 'currency': 'GBP', 'impact': 'high'},
                {'time': '13:30', 'name': 'Trade Balance', 'currency': 'USD', 'impact': 'medium'},
            ],
            'Wednesday': [
                {'time': '07:00', 'name': 'UK Employment', 'currency': 'GBP', 'impact': 'high'},
                {'time': '13:30', 'name': 'CPI', 'currency': 'USD', 'impact': 'high'},
                {'time': '19:00', 'name': 'FOMC Minutes', 'currency': 'USD', 'impact': 'high'},
            ],
            'Thursday': [
                {'time': '12:00', 'name': 'ECB Interest Rate Decision', 'currency': 'EUR', 'impact': 'high'},
                {'time': '13:30', 'name': 'Unemployment Claims', 'currency': 'USD', 'impact': 'medium'},
            ],
            'Friday': [
                {'time': '13:30', 'name': 'Non-Farm Payrolls', 'currency': 'USD', 'impact': 'high'},
                {'time': '13:30', 'name': 'Unemployment Rate', 'currency': 'USD', 'impact': 'high'},
            ],
        }
        
        # Get events for tomorrow (if it's a weekday)
        if day_of_week in common_events:
            events = common_events[day_of_week]
        
        # Also try to fetch from a free API
        try:
            url = "https://nfs.faireconomy.media/ff_calendar_thisweek.json"
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=10) as response:
                calendar_data = json.loads(response.read().decode())
                
                tomorrow_str = tomorrow.strftime('%Y-%m-%d')
                for event in calendar_data:
                    if event.get('date', '').startswith(tomorrow_str):
                        impact = event.get('impact', '').lower()
                        if impact not in ['high', 'medium', 'low']:
                            impact = 'medium'
                        events.append({
                            'time': event.get('time', ''),
                            'name': event.get('title', event.get('event', '')),
                            'currency': event.get('country', ''),
                            'impact': impact,
                        })
        except Exception as e:
            print(f"  Calendar API fallback used: {e}")
        
    except Exception as e:
        print(f"Error fetching economic events: {e}")
    
    # Sort by impact (high first) then time
    impact_order = {'high': 0, 'medium': 1, 'low': 2}
    events.sort(key=lambda x: (impact_order.get(x['impact'], 2), x['time']))
    
    return events[:10]  # Limit to 10 most important

# ═══════════════════════════════════════════════════════════════════════════════
# AI ANALYSIS (Claude)
# ═══════════════════════════════════════════════════════════════════════════════

def generate_ai_analysis(instruments, economic_events, use_ai=True):
    """Generate AI-powered analysis and tomorrow's outlook using Claude"""
    
    if not use_ai or not ANTHROPIC_API_KEY:
        # Return placeholder if no AI
        return {
            'outlook': {
                'date': (datetime.now() + timedelta(days=1)).strftime('%A, %d %b'),
                'html': '<p>AI analysis is generating. Check back shortly for tomorrow\'s market outlook.</p>'
            },
            'instrument_analyses': {}
        }
    
    try:
        import anthropic
        client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
        
        # Prepare market summary for prompt
        bullish = [i for i in instruments if i['bias'] == 'BULLISH']
        bearish = [i for i in instruments if i['bias'] == 'BEARISH']
        prime = [i for i in instruments if i['regime'] == 'Prime']
        
        top_movers = sorted(instruments, key=lambda x: abs(x['change_pct']), reverse=True)[:5]
        
        # Build the prompt
        prompt = f"""You are a professional market analyst for Quant Prime, a quantitative trading research firm.

Based on today's market data, write tomorrow's outlook in a concise, actionable format.

TODAY'S MARKET SUMMARY:
- Total instruments analyzed: {len(instruments)}
- Bullish bias: {len(bullish)} instruments
- Bearish bias: {len(bearish)} instruments  
- Prime regime (optimal conditions): {len(prime)} instruments

TOP MOVERS TODAY:
{chr(10).join([f"- {m['name']}: {'+' if m['change_pct'] >= 0 else ''}{m['change_pct']:.2f}% ({m['bias']}, {m['regime']})" for m in top_movers])}

PRIME REGIME INSTRUMENTS (best trading conditions):
{chr(10).join([f"- {p['name']}: {p['bias']} bias, {p['change_pct']:.2f}% today" for p in prime]) if prime else "- None currently in Prime regime"}

UPCOMING ECONOMIC EVENTS:
{chr(10).join([f"- {e['time']} {e['currency']}: {e['name']} ({e['impact']} impact)" for e in economic_events[:5]]) if economic_events else "- No major events scheduled"}

Write a brief (150-200 words) outlook for tomorrow covering:
1. Key pairs/instruments to watch
2. Risk events to be aware of
3. 2-3 specific setups or themes developing

Format as HTML with <p> tags and a <ul> list for key points. Be specific, not generic. Use trader language. No intro fluff - get straight to the analysis."""

        message = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=500,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        
        outlook_html = message.content[0].text
        
        # Generate individual instrument analyses for top movers
        instrument_analyses = {}
        
        for inst in top_movers[:5]:
            try:
                inst_prompt = f"""Write a 2-sentence analysis for {inst['name']}:
- Current: {inst['close']:.5f if inst['type'] == 'forex' and 'JPY' not in inst['name'] else inst['close']:.2f}
- Change: {inst['change_pct']:.2f}%
- Bias: {inst['bias']}
- Regime: {inst['regime']} (score: {inst['regime_score']:.0f})
- ADX: {inst['adx']:.1f}
- Range: {inst['range_pips']:.0f} pips

Focus on actionable context. What should a trader know? Format as plain text, no HTML."""

                inst_msg = client.messages.create(
                    model="claude-3-5-sonnet-20241022",
                    max_tokens=100,
                    messages=[{"role": "user", "content": inst_prompt}]
                )
                
                instrument_analyses[inst['name']] = f"<p>{inst_msg.content[0].text}</p>"
                
            except Exception as e:
                print(f"  Error generating analysis for {inst['name']}: {e}")
        
        return {
            'outlook': {
                'date': (datetime.now() + timedelta(days=1)).strftime('%A, %d %b'),
                'html': outlook_html
            },
            'instrument_analyses': instrument_analyses
        }
        
    except Exception as e:
        print(f"Error generating AI analysis: {e}")
        return {
            'outlook': {
                'date': (datetime.now() + timedelta(days=1)).strftime('%A, %d %b'),
                'html': '<p>AI analysis temporarily unavailable. Market data is still current.</p>'
            },
            'instrument_analyses': {}
        }

# ═══════════════════════════════════════════════════════════════════════════════
# DATA GENERATION
# ═══════════════════════════════════════════════════════════════════════════════

def generate_briefing_json(instruments, economic_events, ai_analysis, date_str):
    """Generate the full JSON data file for the dashboard"""
    
    # Add AI analysis to individual instruments
    for inst in instruments:
        inst['analysis'] = ai_analysis.get('instrument_analyses', {}).get(inst['name'], '')
    
    # Calculate summary stats
    bullish_count = sum(1 for i in instruments if i['bias'] == 'BULLISH')
    bearish_count = len(instruments) - bullish_count
    prime_count = sum(1 for i in instruments if i['regime'] == 'Prime')
    avg_range = sum(i['range_pips'] for i in instruments) / len(instruments) if instruments else 0
    
    # Find biggest mover
    biggest_mover = max(instruments, key=lambda x: abs(x['change_pct'])) if instruments else None
    
    data = {
        'date': date_str,
        'generated_at': datetime.now().isoformat(),
        'summary': {
            'total': len(instruments),
            'bullish': bullish_count,
            'bearish': bearish_count,
            'prime': prime_count,
            'avg_range': round(avg_range),
            'biggest_mover': biggest_mover['name'] if biggest_mover else None,
            'biggest_mover_pct': biggest_mover['change_pct'] if biggest_mover else 0,
        },
        'economic_events': economic_events,
        'outlook': ai_analysis.get('outlook', {}),
        'instruments': instruments,
    }
    
    return data

def save_briefing_json(data, date_str):
    """Save JSON to file and update index"""
    INTEL_DIR.mkdir(parents=True, exist_ok=True)
    
    iso_date = datetime.now().strftime('%Y-%m-%d')
    filename = f"{iso_date}.json"
    filepath = INTEL_DIR / filename
    
    with open(filepath, 'w') as f:
        json.dump(data, f, indent=2)
    
    # Also save as latest.json
    with open(INTEL_DIR / 'latest.json', 'w') as f:
        json.dump(data, f, indent=2)
    
    # Update index
    index_path = INTEL_DIR / 'index.json'
    index = []
    if index_path.exists():
        try:
            with open(index_path) as f:
                index = json.load(f)
        except:
            index = []
    
    new_entry = {
        'date': date_str,
        'filename': filename,
        'iso_date': iso_date,
        'instruments': len(data['instruments']),
    }
    
    index = [i for i in index if i.get('filename') != filename]
    index.insert(0, new_entry)
    index = index[:90]
    
    with open(index_path, 'w') as f:
        json.dump(index, f, indent=2)
    
    print(f"✓ Saved JSON: {filepath}")
    return filepath

# ═══════════════════════════════════════════════════════════════════════════════
# TEASER EMAIL
# ═══════════════════════════════════════════════════════════════════════════════

def generate_teaser_email(data, date_str):
    """Generate short teaser email with CTA to dashboard"""
    
    summary = data['summary']
    outlook = data.get('outlook', {}).get('html', '')[:200] + '...' if data.get('outlook', {}).get('html') else ''
    
    # Top 3 highlights
    instruments = data['instruments']
    top_movers = sorted(instruments, key=lambda x: abs(x['change_pct']), reverse=True)[:3]
    
    movers_html = ""
    for m in top_movers:
        sign = '+' if m['change_pct'] >= 0 else ''
        color = COLORS['bullish'] if m['change_pct'] >= 0 else COLORS['bearish']
        movers_html += f'''
        <tr>
            <td style="padding:8px 12px;font-weight:600;color:#1a1a1a;">{m['name']}</td>
            <td style="padding:8px 12px;text-align:right;font-family:monospace;color:{color};font-weight:600;">{sign}{m['change_pct']:.2f}%</td>
            <td style="padding:8px 12px;text-align:right;color:#666;">{m['regime']}</td>
        </tr>'''
    
    html = f'''<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Daily Briefing | Quant Prime</title>
</head>
<body style="margin:0;padding:0;background:#ffffff;font-family:-apple-system,system-ui,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff">
    <tr><td align="center" style="padding:24px 16px;">
    
    <table width="480" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;">
    <tr><td>
        
        <!-- Header -->
        <div style="text-align:center;margin-bottom:24px;">
            <div style="font-size:10px;font-weight:700;letter-spacing:0.15em;color:{COLORS['gold']};margin-bottom:6px;">QUANT PRIME</div>
            <h1 style="margin:0;font-size:22px;font-weight:700;color:#1a1a1a;">Daily Market Briefing</h1>
            <div style="font-size:13px;color:#666;margin-top:4px;">{date_str}</div>
        </div>
        
        <!-- Quick Stats -->
        <div style="background:#f8f8f8;border-radius:12px;padding:16px;margin-bottom:20px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="text-align:center;">
                <tr>
                    <td style="padding:8px;">
                        <div style="font-size:24px;font-weight:700;color:{COLORS['bullish']};">{summary['bullish']}</div>
                        <div style="font-size:11px;color:#888;">Bullish</div>
                    </td>
                    <td style="padding:8px;">
                        <div style="font-size:24px;font-weight:700;color:{COLORS['bearish']};">{summary['bearish']}</div>
                        <div style="font-size:11px;color:#888;">Bearish</div>
                    </td>
                    <td style="padding:8px;">
                        <div style="font-size:24px;font-weight:700;color:{COLORS['prime']};">{summary['prime']}</div>
                        <div style="font-size:11px;color:#888;">Prime</div>
                    </td>
                    <td style="padding:8px;">
                        <div style="font-size:24px;font-weight:700;color:{COLORS['gold']};">{summary['avg_range']}</div>
                        <div style="font-size:11px;color:#888;">Avg Pips</div>
                    </td>
                </tr>
            </table>
        </div>
        
        <!-- Top Movers -->
        <div style="margin-bottom:20px;">
            <div style="font-size:11px;font-weight:700;letter-spacing:0.1em;color:#888;margin-bottom:10px;">TOP MOVERS</div>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa;border-radius:8px;">
                {movers_html}
            </table>
        </div>
        
        <!-- CTA Button -->
        <div style="text-align:center;margin:24px 0;">
            <a href="{DASHBOARD_URL}" style="display:inline-block;padding:14px 32px;background:{COLORS['gold']};color:#1a1a1a;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px;">
                View Full Briefing →
            </a>
            <div style="font-size:12px;color:#999;margin-top:10px;">
                30 instruments • AI analysis • Tomorrow's outlook
            </div>
        </div>
        
        <!-- Footer -->
        <div style="text-align:center;padding-top:20px;border-top:1px solid #eee;font-size:11px;color:#888;">
            <p>Quant Prime · Research Tier</p>
            <p><a href="{{{{unsubscribe}}}}" style="color:#888;">Unsubscribe</a></p>
        </div>
        
    </td></tr>
    </table>
    
    </td></tr>
    </table>
</body>
</html>'''
    
    return html

# ═══════════════════════════════════════════════════════════════════════════════
# SENDING
# ═══════════════════════════════════════════════════════════════════════════════

def get_recipients():
    """Get Research+ tier emails from Supabase"""
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
    
    recipients.add('clandestineascendancy.tmp@gmail.com')  # Backup
    return list(recipients)

def send_via_brevo(html, subject, recipients):
    """Send email via Brevo API"""
    if not BREVO_API_KEY:
        print("ERROR: BREVO_API_KEY not set")
        return False
    
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
            print(f"✓ Teaser email sent! Message ID: {result.get('messageId', 'N/A')}")
            return True
    except urllib.error.HTTPError as e:
        print(f"ERROR: {e.code} - {e.read().decode()}")
        return False

# ═══════════════════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════════════════

def main():
    print("=" * 60)
    print("QUANT PRIME DAILY BRIEFING v2")
    print("=" * 60)
    
    use_ai = '--no-ai' not in sys.argv
    
    # Date
    now = datetime.now()
    date_str = now.strftime("%d %b %Y").upper()
    
    # Fetch market data
    print("\n📊 Fetching market data...")
    instruments = fetch_all_data()
    
    if not instruments:
        print("ERROR: No data fetched!")
        return 1
    
    print(f"\n✓ Got data for {len(instruments)} instruments")
    
    # Fetch economic events
    print("\n📅 Fetching economic events...")
    economic_events = fetch_economic_events()
    print(f"✓ Got {len(economic_events)} upcoming events")
    
    # Generate AI analysis
    if use_ai:
        print("\n🤖 Generating AI analysis...")
        ai_analysis = generate_ai_analysis(instruments, economic_events, use_ai=True)
        print("✓ AI analysis complete")
    else:
        print("\n⚠️ Skipping AI analysis (--no-ai flag)")
        ai_analysis = generate_ai_analysis(instruments, economic_events, use_ai=False)
    
    # Generate and save JSON
    print("\n💾 Saving briefing data...")
    briefing_data = generate_briefing_json(instruments, economic_events, ai_analysis, date_str)
    save_briefing_json(briefing_data, date_str)
    
    # Generate teaser email
    print("\n📧 Generating teaser email...")
    teaser_html = generate_teaser_email(briefing_data, date_str)
    
    # Save preview
    preview_path = Path(__file__).parent / 'teaser-preview.html'
    with open(preview_path, 'w') as f:
        f.write(teaser_html)
    print(f"✓ Teaser preview: {preview_path}")
    
    # Send if requested
    if '--send' in sys.argv:
        print("\n📤 Getting recipients...")
        recipients = get_recipients()
        print(f"✓ Found {len(recipients)} recipients")
        
        print("\n📤 Sending teaser email...")
        subject = f"📊 Daily Briefing · {date_str}"
        send_via_brevo(teaser_html, subject, recipients)
        
    elif '--test' in sys.argv:
        print("\n--test mode: Sending to test email only")
        subject = f"📊 [TEST] Daily Briefing · {date_str}"
        send_via_brevo(teaser_html, subject, ['clandestineascendancy.tmp@gmail.com'])
    else:
        print("\nRun with --send to send to all members, or --test for test email only")
    
    print("\n" + "=" * 60)
    print("✓ COMPLETE")
    print("=" * 60)
    print(f"\nDashboard: {DASHBOARD_URL}")
    return 0

if __name__ == '__main__':
    sys.exit(main())
