# Brevo Setup Guide - Quant Prime Email Funnel

## Overview
- **Domain auth**: ✅ Already done (quantprime.uk DKIM verified)
- **Senders**: ✅ Already created (noreply@, hello@, support@)
- **What's left**: Create templates, automation flow, wire website

---

## Step 1: Create a Contact List

1. Go to **Brevo Dashboard** → **Contacts** → **Lists**
2. Click **Create a list**
3. Name it: `Manifesto Optins`
4. Save

---

## Step 2: Create the 5 Email Templates

Go to **Campaigns** → **Templates** → **Create a template**

### Template 1: Welcome (Manifesto Delivery)

**Name**: `Research Funnel - 01 Welcome`
**Subject**: `You're in. Here's the Manifesto.`
**From**: `Sean from Quant Prime` / `hello@quantprime.uk`

**Content** (paste this HTML or use their drag-drop editor):

```
Hey {{contact.FIRSTNAME}},

Here it is.

👉 [Read the Manifesto](https://quantprime.uk/assets/quant-prime-manifesto.html)

Ten minutes, one sitting. The second half is where it earns the time.

Then four more emails over the next five days:

• Day 1 — Where my own system stops working, with the timeframe and the reason. Not a teaser.
• Day 2 — A backtest of mine that hit an 81.5% win rate and lost money anyway, and the ten-minute check that would have caught it.
• Day 3 — Every trader has a subscription they've forgotten they're paying for. Why this one either won't be, or you should cancel it.
• Day 5 — Last one, then I'm out of your inbox.

No motivational quotes, no screenshots of somebody's account. Working notes.

— Sean
Quant Prime

P.S. If this landed in Promotions, drag it across. The Day 1 email is the one worth having and it'll land wherever this one did.
```

---

### Template 2: Day 1 (Failure Mode)

**Name**: `Research Funnel - 02 Day1 Failure`
**Subject**: `It stops working on the 15-minute chart`
**From**: `Sean from Quant Prime` / `hello@quantprime.uk`

**Content**:

```
Meridian is a reversal engine. A prior swing level gets swept, which sets directional bias. Price then taps a vortex level, which confirms the entry. Two conditions. No discretion, no interpretation, no "it looked good."

Backtested on EURUSD, 3-minute chart, February to August 2026:

• 279 trades
• 68.46% win rate
• Profit factor 1.995
• Max drawdown 11.59%
• Commission included in every figure

Now the part that doesn't usually make it into the email.

**On the 15-minute chart and above, it goes unprofitable.** Not slightly worse. Unprofitable.

The reason is structural rather than a bug. The engine needs a certain number of bars of price structure inside each phase before a signal resolves. On higher timeframes those bars don't exist, so it's being asked a question it has no mechanism to answer.

I could hide that by only ever showing you the 3M chart. Most people would.

Three more things you should know before you take that 1.995 seriously:

1. **It's in-sample** — the system was developed on this data. Out-of-sample results will be worse. They always are.

2. **It's one pair.** EURUSD only. I haven't published multi-pair results because I don't have multi-pair results.

3. **That 11.59% drawdown is the real number.** At some point in those six months the account was down 11.59% from its high and the correct action was to keep taking signals. Most people don't. That's not a system problem, it's the part the system can't do for you.

A strategy with no documented failure mode hasn't been tested. It's been marketed.

If someone shows you something that works on every pair, every timeframe, every session, you're looking at a curve fit and a sales page, usually at the same time.

Everything in the Quant Prime library ships with its boundaries stated first. That's the whole product, really.

— Sean

P.S. Tomorrow's is the one I'd actually read — a backtest of mine with an 81.5% win rate that still lost money, and the two-minute check that catches it.

---
*Backtested results, EURUSD 3M, Feb–Aug 2026, in-sample, commission included. Hypothetical performance — no live capital produced these figures. Past performance does not indicate future results. Educational content only, not financial advice. Trading carries risk of loss.*
```

---

### Template 3: Day 2 (81.5% Story)

**Name**: `Research Funnel - 03 Day2 WinRate`
**Subject**: `81.5% win rate. Still lost money.`
**From**: `Sean from Quant Prime` / `hello@quantprime.uk`

**Content**:

```
Earlier this year I hand-tested a volatility fade setup on the 1-minute chart. Seventeen hours of clicking. 1,398 trades. 81.5% win rate.

It was unprofitable.

The average winner came in under 5 pips. At $0.07 commission per order — $0.14 the round trip — friction was eating roughly 3 pips of every single trade. An 81.5% win rate on a 4-pip edge against 3 pips of cost isn't an edge. It's a rounding error you're paying a broker to generate on your behalf.

The lesson isn't "don't scalp." It's that **win rate is the least useful number in a backtest**, and it happens to be the one every course on the internet sells you on, because it's the one that looks best in a screenshot.

Three that matter more:

**1. Profit factor.** Gross profit divided by gross loss. Under about 1.2 and you've no margin left for slippage or spread widening, which means the backtest is fiction.

**2. Average win in pips against your all-in cost per round trip.** Under 3:1 and you are, functionally, trading for your broker. This is the one that killed the 81.5%.

**3. Trade count.** Forty trades proves nothing. 1,398 proved my system was broken, which was worth all seventeen hours.

Run the first two on whatever you're trading right now. I've put the arithmetic on a single page — your numbers in, a straight answer out about whether your edge survives contact with costs.

👉 [Run the cost-drag check (free)](https://quantprime.uk/compounding)

Two minutes. If it comes back clean, ignore me and carry on. If it doesn't, you've just saved yourself a year of paying tuition to a spread.

— Sean

P.S. That test is the reason Recoil now runs a cost-aware backtester rather than a signal counter. The full write-up is one of the ten papers in the Research library — but do the free check first. It's the part that matters and it costs nothing.
```

---

### Template 4: Day 3 (Objections)

**Name**: `Research Funnel - 04 Day3 Objections`
**Subject**: `Another £8 you'll forget you're paying`
**From**: `Sean from Quant Prime` / `hello@quantprime.uk`

**Content**:

```
Three things people say when they get to this email. All three are reasonable, so let's do them properly.

**"It's too good to be true."**

Good instinct — keep it. But look at what I actually published on Monday: a system that goes unprofitable two timeframes up, tested in-sample on a single pair, with an 11.59% drawdown I didn't round down. If I were fabricating, I'd have fabricated something better than a profit factor of 1.995. The unimpressive parts are the evidence.

**"I've been burned before."**

Almost certainly by someone selling certainty. The distinction worth drawing: Quant Prime measures things. It doesn't predict them. Every instrument tells you what conditions are present right now and what the system does under those conditions. Nothing in the library forecasts where price is going, because nothing can, and anyone who tells you otherwise is describing a product that doesn't exist.

**"Why is it only £8?"**

Because I'm not selling transformation. I'm selling ten research papers, a daily briefing, and a Discord server. That's worth about £8. If it's worth more to you after a month, upgrade. If it isn't, cancel. The button is in your dashboard and it works on the first click.

The real answer: I'd rather have 1,000 people paying £8 who actually use the tools than 50 people paying £97 who bought a dream and blame me when they don't wake up rich.

£8/month. Everything in the Research library. Daily briefings at 10pm. Cancel whenever.

👉 [Start Research Tier — £8/month](https://quantprime.uk/checkout?tier=research)

— Sean

P.S. If you're not ready, that's fine. Tomorrow's the last email, then I'm out of your inbox. If you'd rather just hang out in the free community, the Discord link is at the bottom.
```

---

### Template 5: Day 5 (Final)

**Name**: `Research Funnel - 05 Day5 Final`
**Subject**: `Last one`
**From**: `Sean from Quant Prime` / `hello@quantprime.uk`

**Content**:

```
This is the last email.

If you've read the Manifesto and the four emails this week, you know more about how I think about trading than most people who've paid for courses. That was the point.

Two options from here:

**Option 1: Research Tier (£8/month)**
- 10 research papers (entries, market structure, psychology, the lot)
- Daily briefings at 10pm UK (Mon-Fri)
- Private Discord access
- Marketplace access

👉 [Start Research — £8/month](https://quantprime.uk/checkout?tier=research)

**Option 2: Free Community**
If you're not ready to pay anything, join the free Discord. No pitch, no upsell loop, just traders talking about markets.

👉 [Join Free Discord](https://discord.gg/EAHKwd7HvX)

Either way, thanks for reading. Most people don't make it past email one.

— Sean
Quant Prime
```

---

## Step 3: Create the Automation Flow

1. Go to **Automation** → **Create a workflow**
2. Name it: `Research Funnel - Manifesto Sequence`
3. Click **Create workflow**

### Set the Trigger
- Select **"A contact is added to a list"**
- Choose list: `Manifesto Optins`

### Add the Email Steps

**Step 1**: Send email → Select `Research Funnel - 01 Welcome` → **No delay** (immediate)

**Step 2**: Add **Wait** → `1 day`

**Step 3**: Send email → Select `Research Funnel - 02 Day1 Failure`

**Step 4**: Add **Wait** → `1 day`

**Step 5**: Send email → Select `Research Funnel - 03 Day2 WinRate`

**Step 6**: Add **Wait** → `1 day`

**Step 7**: Send email → Select `Research Funnel - 04 Day3 Objections`

**Step 8**: Add **Wait** → `2 days` (so it arrives Day 5, not Day 4)

**Step 9**: Send email → Select `Research Funnel - 05 Day5 Final`

### Set Send Time
For each email step, click the settings and set:
- **Send at best time**: OFF
- **Send at specific time**: `07:30` (UK time)

### Activate
Click **Activate workflow** when ready.

---

## Step 4: Get Your Brevo API Key

1. Go to **SMTP & API** → **API Keys**
2. Click **Generate a new API key**
3. Name it: `Quant Prime Website`
4. Copy the key (starts with `xkeysib-`)

---

## Step 5: Wire the Website Opt-in

Add this to your opt-in form handler (or give to Max to wire):

**Endpoint**: `POST https://api.brevo.com/v3/contacts`

**Headers**:
```
api-key: YOUR_API_KEY_HERE
Content-Type: application/json
```

**Body**:
```json
{
  "email": "user@example.com",
  "attributes": {
    "FIRSTNAME": "John"
  },
  "listIds": [LIST_ID_HERE],
  "updateEnabled": true
}
```

Replace:
- `YOUR_API_KEY_HERE` with your API key
- `LIST_ID_HERE` with the ID of your "Manifesto Optins" list (find it in Contacts → Lists → click the list → the ID is in the URL)

---

## Step 6: Test It

1. Add yourself to the "Manifesto Optins" list manually in Brevo
2. Check that Email 1 arrives immediately
3. Wait for Day 1 email (or speed up in automation settings for testing)

---

## Quick Reference

| Item | Value |
|------|-------|
| Welcome sender | hello@quantprime.uk |
| Briefing sender | noreply@quantprime.uk |
| Support sender | support@quantprime.uk |
| Sequence timing | Immediate → +1d → +2d → +3d → +5d |
| Send time | 07:30 UK |
| List name | Manifesto Optins |

---

## What Max Can Wire (When You're Ready)

Once you have the API key and list ID, tell Max and he can:
1. Update `/js/optin-overlay.js` to push to Brevo on form submit
2. Update `/free-guide.html` form to push to Brevo
3. Add purchase tracking (tag customers to suppress prospect emails)

---

*Created: Aug 11, 2026*
