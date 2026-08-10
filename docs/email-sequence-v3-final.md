# Quant Prime — Research Tier Email Funnel (v3 — FINAL DATA)

**Sender:** Sean from Quant Prime · hello@quantprime.uk
**Reply-to:** monitored inbox, not noreply@ — replies are the strongest deliverability signal there is
**Send time:** 7–8am UK (briefings go at 10pm — keep separation)
**Placeholders:** {{FIRST_NAME}} · {{GUIDE_LINK}} · {{CHECKOUT_LINK}} · {{DISCORD_LINK}} · {{CALC_LINK}} · {{UNSUBSCRIBE}}

**Figures used:** Meridian, EURUSD, 3M, Feb–Aug 2026, 279 trades, 68.46% win rate, PF 1.995, max drawdown 11.59%, commission included, in-sample.
**Deliberately not used:** the +48.66% return figure, and any Meridian/Recoil side-by-side. See notes at the end.

---

## Email 1 — Welcome (immediate)

**Subject A:** You're in. Here's the Manifesto.
**Subject B:** The Manifesto (+ what's coming)
**Preview:** Ten minutes. The second half is where it earns the time.

{{FIRST_NAME}},

Here it is.

**CTA button:** Read the Manifesto → {{GUIDE_LINK}}

Ten minutes, one sitting. The second half is where it earns the time.

Then four more emails over the next five days:

**Day 1** — Where my own system stops working, with the timeframe and the reason. Not a teaser.
**Day 2** — A backtest of mine that hit an 81.5% win rate and lost money anyway, and the ten-minute check that would have caught it.
**Day 3** — Every trader has a subscription they've forgotten they're paying for. Why this one either won't be, or you should cancel it.
**Day 5** — Last one, then I'm out of your inbox.

No motivational quotes, no screenshots of somebody's account. Working notes.

— Sean
Quant Prime

P.S. If this landed in Promotions, drag it across. The Day 1 email is the one worth having and it'll land wherever this one did.

---

## Email 2 — Day 1 (failure mode / trust)

**Subject A:** It stops working on the 15-minute chart
**Subject B:** The half of the backtest nobody publishes
**Preview:** Where my system fails, in writing.

Meridian is a reversal engine. A prior swing level gets swept, which sets directional bias. Price then taps a vortex level, which confirms the entry. Two conditions. No discretion, no interpretation, no "it looked good."

Backtested on EURUSD, 3-minute chart, February to August 2026:

- 279 trades
- 68.46% win rate
- Profit factor 1.995
- Max drawdown 11.59%
- Commission included in every figure

Now the part that doesn't usually make it into the email.

**On the 15-minute chart and above, it goes unprofitable.** Not slightly worse. Unprofitable.

The reason is structural rather than a bug. The engine needs a certain number of bars of price structure inside each phase before a signal resolves. On higher timeframes those bars don't exist, so it's being asked a question it has no mechanism to answer.

I could hide that by only ever showing you the 3M chart. Most people would.

Three more things you should know before you take that 1.995 seriously:

- **It's in-sample** — the system was developed on this data. Out-of-sample results will be worse. They always are.
- **It's one pair.** EURUSD only. I haven't published multi-pair results because I don't have multi-pair results.
- **That 11.59% drawdown is the real number.** At some point in those six months the account was down 11.59% from its high and the correct action was to keep taking signals. Most people don't. That's not a system problem, it's the part the system can't do for you.

A strategy with no documented failure mode hasn't been tested. It's been marketed.

If someone shows you something that works on every pair, every timeframe, every session, you're looking at a curve fit and a sales page, usually at the same time.

Everything in the Quant Prime library ships with its boundaries stated first. That's the whole product, really.

— Sean

P.S. Tomorrow's is the one I'd actually read — a backtest of mine with an 81.5% win rate that still lost money, and the two-minute check that catches it.

*Backtested results, EURUSD 3M, Feb–Aug 2026, in-sample, commission included. Hypothetical performance — no live capital produced these figures. Past performance does not indicate future results. Educational content only, not financial advice. Trading carries risk of loss.*

---

## Email 3 — Day 2 (value + micro-commitment)

**Subject A:** 81.5% win rate. Still lost money.
**Subject B:** 1,398 trades, all measuring the wrong thing
**Preview:** The number every course sells you on is the one that lies.

Earlier this year I hand-tested a volatility fade setup on the 1-minute chart. Seventeen hours of clicking. 1,398 trades. 81.5% win rate.

It was unprofitable.

The average winner came in under 5 pips. At $0.07 commission per order — $0.14 the round trip — friction was eating roughly 3 pips of every single trade. An 81.5% win rate on a 4-pip edge against 3 pips of cost isn't an edge. It's a rounding error you're paying a broker to generate on your behalf.

The lesson isn't "don't scalp." It's that **win rate is the least useful number in a backtest**, and it happens to be the one every course on the internet sells you on, because it's the one that looks best in a screenshot.

Three that matter more:

- **Profit factor.** Gross profit divided by gross loss. Under about 1.2 and you've no margin left for slippage or spread widening, which means the backtest is fiction.
- **Average win in pips against your all-in cost per round trip.** Under 3:1 and you are, functionally, trading for your broker. This is the one that killed the 81.5%.
- **Trade count.** Forty trades proves nothing. 1,398 proved my system was broken, which was worth all seventeen hours.

Run the first two on whatever you're trading right now. I've put the arithmetic on a single page — your numbers in, a straight answer out about whether your edge survives contact with costs.

**CTA button:** Run the cost-drag check (free) → {{CALC_LINK}}

Two minutes. If it comes back clean, ignore me and carry on. If it doesn't, you've just saved yourself a year of paying tuition to a spread.

— Sean

P.S. That test is the reason Recoil now runs a cost-aware backtester rather than a signal counter. The full write-up is one of the ten papers in the Research library — but do the free check first. It's the part that matters and it costs nothing.

---

## Email 4 — Day 3 (objections → buy)

**Subject A:** Another £8 you'll forget you're paying
**Subject B:** Three objections, answered properly
**Preview:** Including the one about why it's this cheap.

Three things people say when they get to this email. All three are reasonable, so let's do them properly.

**"It's too good to be true."**

Good instinct — keep it. But look at what I actually published on Monday: a system that goes unprofitable two timeframes up, tested in-sample on a single pair, with an 11.59% drawdown I didn't round down. If I were fabricating, I'd have fabricated something better than a profit factor of 1.995. The unimpressive parts are the evidence.

**"I've been burned before."**

Almost certainly by someone selling certainty. The distinction worth drawing: Quant Prime measures things. It doesn't predict them. Every instrument tells you what conditions are present right now and what the system does under those conditions. Nothing in the library forecasts where price is going, because nothing can, and anyone who tells you otherwise is describing a product that doesn't exist.

**"Why is it only £8?"**

[Content continues in PDF - this is the objection handling section leading to the CTA]

---

## Email 5 — Day 5 (final push or community)

[To be extracted from full PDF]

---

## Notes

- Deliberately avoided the +48.66% return figure (too headline-grabby, invites comparison)
- No Meridian/Recoil side-by-side (keeps focus on one product at a time)
- All figures verified from `/quantprime/data/meridian-backtest-6mo.json`
- Manifesto is delivered as HTML email, not PDF
- Cost-drag calculator CTA drives to `/compounding` or dedicated tool page

---

*Source: Other Claude conversation, August 10, 2026*
*Data verified: August 11, 2026*
