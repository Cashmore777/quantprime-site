#!/usr/bin/env python3
"""
Quant Prime Weekly Market Report
================================
Generates comprehensive weekly analysis:
- Full week summary per instrument
- News events that impacted markets
- Lessons learned / key takeaways
- Next week outlook

Run: python3 weekly-briefing.py [--send] [--test]

Cron: 0 20 * * 0 /usr/bin/python3 /path/to/weekly-briefing.py --send
(Sundays at 8pm UK)
"""

import os
import sys
import json
from datetime import datetime, timedelta
from pathlib import Path
import urllib.request
import urllib.error

# ═══════════════════════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════════

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

BASE_DIR = Path(__file__).parent.parent
WEEKLY_DIR = BASE_DIR / 'research' / 'intel' / 'weekly'
DASHBOARD_URL = 'https://quantprime.uk/research/intel/'
SUPABASE_URL = 'https://pjqwnqhnuxwinwxdritp.supabase.co'

FROM_EMAIL = 'noreply@quantprime.uk'
FROM_NAME = 'Quant Prime'

# Top instruments for weekly analysis
TOP_INSTRUMENTS = [
    ('GC=F', 'XAU/USD', 'Gold'),
    ('EURUSD=X', 'EUR/USD', 'Euro'),
    ('GBPUSD=X', 'GBP/USD', 'Cable'),
    ('^IXIC', 'NAS100', 'Nasdaq'),
    ('^GSPC', 'SPX500', 'S&P'),
    ('USDJPY=X', 'USD/JPY', 'Yen'),
    ('BTC-USD', 'BTC/USD', 'Bitcoin'),
    ('CL=F', 'WTI Oil', 'Crude'),
]

COLORS = {
    'gold': '#c9a84c',
    'bullish': '#16864a',
    'bearish': '#b82828',
}

# ═══════════════════════════════════════════════════════════════════════════════
# DATA FETCHING
# ═══════════════════════════════════════════════════════════════════════════════

def fetch_weekly_data(symbol, name):
    """Fetch weekly performance for an instrument"""
    try:
        ticker = yf.Ticker(symbol)
        df = ticker.history(period='7d', interval='1d')
        
        if df.empty or len(df) < 2:
            return None
        
        # Week open/close
        week_open = df['Open'].iloc[0]
        week_close = df['Close'].iloc[-1]
        week_high = df['High'].max()
        week_low = df['Low'].min()
        
        # Daily changes
        daily_changes = []
        for i, (date, row) in enumerate(df.iterrows()):
            if i > 0:
                prev_close = df['Close'].iloc[i-1]
                change_pct = ((row['Close'] - prev_close) / prev_close) * 100
            else:
                change_pct = ((row['Close'] - row['Open']) / row['Open']) * 100
            
            daily_changes.append({
                'date': date.strftime('%a'),
                'change_pct': change_pct,
            })
        
        # Week total change
        week_change = ((week_close - week_open) / week_open) * 100
        
        # Volatility (average daily range as %)
        daily_ranges = ((df['High'] - df['Low']) / df['Low']) * 100
        avg_volatility = daily_ranges.mean()
        
        return {
            'symbol': symbol,
            'name': name,
            'open': float(week_open),
            'close': float(week_close),
            'high': float(week_high),
            'low': float(week_low),
            'change_pct': float(week_change),
            'daily_changes': daily_changes,
            'volatility': float(avg_volatility),
        }
    
    except Exception as e:
        print(f"  Error fetching {name}: {e}")
        return None

def fetch_all_weekly():
    """Fetch weekly data for all top instruments"""
    results = []
    for symbol, name, label in TOP_INSTRUMENTS:
        print(f"  Fetching {name}...")
        data = fetch_weekly_data(symbol, name)
        if data:
            data['label'] = label
            results.append(data)
    return results

# ═══════════════════════════════════════════════════════════════════════════════
# AI ANALYSIS
# ═══════════════════════════════════════════════════════════════════════════════

def generate_weekly_analysis(instruments):
    """Generate comprehensive weekly analysis with Claude"""
    
    if not ANTHROPIC_API_KEY:
        return {
            'summary': '<p>Weekly analysis requires AI configuration.</p>',
            'instrument_analyses': {},
            'lessons': '<p>Key lessons will appear here.</p>',
            'outlook': '<p>Next week outlook will appear here.</p>',
        }
    
    try:
        import anthropic
        client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
        
        # Build instrument summary
        inst_summary = "\n".join([
            f"- {i['name']}: {'+' if i['change_pct'] >= 0 else ''}{i['change_pct']:.2f}% (High: {i['high']:.2f}, Low: {i['low']:.2f})"
            for i in instruments
        ])
        
        prompt = f"""You are a senior market analyst at Quant Prime. Write a comprehensive weekly market report.

THIS WEEK'S PERFORMANCE:
{inst_summary}

Write a detailed weekly report covering:

1. **WEEK SUMMARY** (100 words) - What defined this week across markets? Any major themes?

2. **INSTRUMENT DEEP DIVES** - For each major instrument, write 2-3 sentences about:
   - What drove the move
   - Key levels tested/broken
   - Trader takeaways

3. **LESSONS LEARNED** (50 words) - 2-3 bullet points of lessons from this week

4. **NEXT WEEK OUTLOOK** (100 words) - Key events, levels to watch, what to expect

Format everything as HTML with proper headings (<h3>) and lists. Be specific and actionable. This is for active traders who need real insights, not generic commentary."""

        message = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=2000,
            messages=[{"role": "user", "content": prompt}]
        )
        
        full_html = message.content[0].text
        
        return {
            'full_analysis': full_html,
        }
        
    except Exception as e:
        print(f"Error generating weekly analysis: {e}")
        return {'full_analysis': '<p>Analysis generation failed. Market data is still available.</p>'}

# ═══════════════════════════════════════════════════════════════════════════════
# SAVE & SEND
# ═══════════════════════════════════════════════════════════════════════════════

def save_weekly_report(instruments, ai_analysis):
    """Save weekly report JSON"""
    WEEKLY_DIR.mkdir(parents=True, exist_ok=True)
    
    now = datetime.now()
    week_ending = now.strftime('%Y-%m-%d')
    week_label = f"Week ending {now.strftime('%d %b %Y')}"
    
    data = {
        'week_ending': week_ending,
        'week_label': week_label,
        'generated_at': now.isoformat(),
        'instruments': instruments,
        'analysis': ai_analysis,
    }
    
    # Save dated file
    filepath = WEEKLY_DIR / f"{week_ending}.json"
    with open(filepath, 'w') as f:
        json.dump(data, f, indent=2)
    
    # Save as latest
    with open(WEEKLY_DIR / 'latest.json', 'w') as f:
        json.dump(data, f, indent=2)
    
    # Update index
    index_path = WEEKLY_DIR / 'index.json'
    index = []
    if index_path.exists():
        try:
            with open(index_path) as f:
                index = json.load(f)
        except:
            index = []
    
    new_entry = {
        'date': week_ending,
        'title': week_label,
    }
    
    index = [i for i in index if i.get('date') != week_ending]
    index.insert(0, new_entry)
    index = index[:52]  # Keep 1 year
    
    with open(index_path, 'w') as f:
        json.dump(index, f, indent=2)
    
    print(f"✓ Saved weekly report: {filepath}")
    return data

def generate_teaser_email(data):
    """Generate weekly email teaser"""
    week_label = data['week_label']
    instruments = data['instruments']
    
    # Build instrument rows
    rows_html = ""
    for inst in sorted(instruments, key=lambda x: abs(x['change_pct']), reverse=True)[:6]:
        sign = '+' if inst['change_pct'] >= 0 else ''
        color = COLORS['bullish'] if inst['change_pct'] >= 0 else COLORS['bearish']
        rows_html += f'''
        <tr>
            <td style="padding:10px 12px;font-weight:600;color:#1a1a1a;">{inst['name']}</td>
            <td style="padding:10px 12px;text-align:right;font-family:monospace;font-weight:700;color:{color};">{sign}{inst['change_pct']:.2f}%</td>
        </tr>'''
    
    html = f'''<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Weekly Report | Quant Prime</title>
</head>
<body style="margin:0;padding:0;background:#ffffff;font-family:-apple-system,system-ui,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff">
    <tr><td align="center" style="padding:24px 16px;">
    
    <table width="480" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;">
    <tr><td>
        
        <!-- Header -->
        <div style="text-align:center;margin-bottom:24px;">
            <div style="font-size:10px;font-weight:700;letter-spacing:0.15em;color:{COLORS['gold']};margin-bottom:6px;">QUANT PRIME</div>
            <h1 style="margin:0;font-size:22px;font-weight:700;color:#1a1a1a;">Weekly Market Report</h1>
            <div style="font-size:13px;color:#666;margin-top:4px;">{week_label}</div>
        </div>
        
        <!-- This Week Performance -->
        <div style="margin-bottom:24px;">
            <div style="font-size:11px;font-weight:700;letter-spacing:0.1em;color:#888;margin-bottom:10px;">THIS WEEK'S PERFORMANCE</div>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa;border-radius:10px;">
                {rows_html}
            </table>
        </div>
        
        <!-- CTA -->
        <div style="text-align:center;margin:24px 0;">
            <a href="{DASHBOARD_URL}?tab=weekly" style="display:inline-block;padding:14px 32px;background:{COLORS['gold']};color:#1a1a1a;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px;">
                Read Full Analysis →
            </a>
            <div style="font-size:12px;color:#999;margin-top:10px;">
                Deep dives • Lessons learned • Next week outlook
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

def get_recipients():
    """Get Research+ tier emails"""
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
            print(f"Warning: Could not fetch {tier}: {e}")
    
    recipients.add('clandestineascendancy.tmp@gmail.com')
    return list(recipients)

def send_via_brevo(html, subject, recipients):
    """Send via Brevo"""
    if not BREVO_API_KEY:
        print("ERROR: No Brevo API key")
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
            print(f"✓ Weekly email sent! ID: {result.get('messageId')}")
            return True
    except urllib.error.HTTPError as e:
        print(f"ERROR: {e.code} - {e.read().decode()}")
        return False

# ═══════════════════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════════════════

def main():
    print("=" * 60)
    print("QUANT PRIME WEEKLY REPORT")
    print("=" * 60)
    
    print("\n📊 Fetching weekly data...")
    instruments = fetch_all_weekly()
    
    if not instruments:
        print("ERROR: No data!")
        return 1
    
    print(f"\n✓ Got {len(instruments)} instruments")
    
    print("\n🤖 Generating analysis...")
    ai_analysis = generate_weekly_analysis(instruments)
    
    print("\n💾 Saving report...")
    report_data = save_weekly_report(instruments, ai_analysis)
    
    print("\n📧 Generating email...")
    email_html = generate_teaser_email(report_data)
    
    preview_path = Path(__file__).parent / 'weekly-preview.html'
    with open(preview_path, 'w') as f:
        f.write(email_html)
    print(f"✓ Preview: {preview_path}")
    
    if '--send' in sys.argv:
        print("\n📤 Sending...")
        recipients = get_recipients()
        print(f"✓ {len(recipients)} recipients")
        week_label = report_data['week_label']
        send_via_brevo(email_html, f"📊 {week_label}", recipients)
    elif '--test' in sys.argv:
        send_via_brevo(email_html, "[TEST] Weekly Report", ['clandestineascendancy.tmp@gmail.com'])
    
    print("\n" + "=" * 60)
    print("✓ COMPLETE")
    print("=" * 60)
    return 0

if __name__ == '__main__':
    sys.exit(main())
