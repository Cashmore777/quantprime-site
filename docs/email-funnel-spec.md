# Quant Prime Email Funnel Spec

*Source: Cash's Claude conversation, August 2026*

## Funnel Flow

**Linktree buttons:** Learn More, Free Guide, The Framework, Our Results, Compounding Potential, Products

**Canonical order:** Free Guide → Framework → Results → Compounding → Products → Discord

**Tailored paths:** Entry page loads first → opt-in overlay → remaining pages in canonical order (skipping seen)

**Psychological arc:** Curiosity → Credibility → Proof → Desire → Purchase

---

## Opt-in & Tracking

- Overlay on entry page (not separate page)
- Capture: Name + Email only (NO phone)
- Browser timezone captured silently
- Single identity per email (all events attached)
- Track: "last page seen" + "time since last event"
- Instant PDF email fires immediately on opt-in

---

## Deliverability (Priority #1)

- SPF, DKIM, DMARC on dedicated subdomain (mail.quantprime.uk)
- Domain/IP warm-up (ramp volume over weeks)
- Instant email: plain, personal, 1-2 links max
- Ongoing list hygiene + complaint/bounce monitoring

---

## Discord Layer

**Two invite points:**
1. Clickable Discord logo inside PDF
2. "Join free community" banner on Products page

**Products page popup captures:** Discord username + email + name
- Links Discord identity to email record
- Critical for tracking conversions

**RULE:** Buyers → DASHBOARD (not Discord). Discord offered later as perk.

---

## Re-engagement Sequences (5 total)

Based on "furthest unseen persuasion beat":

| Sequence | Theme |
|----------|-------|
| Left before Framework | How it works |
| Left before Results | Proof/track record |
| Left before Compounding | Your future |
| Left before Products | The tools/offer |
| Saw Products, didn't buy | Discord + soft offer |

**Each sequence = 4 emails:**
1. Curiosity gap (what they missed)
2. One concrete proof point
3. Social proof
4. Urgency/final nudge

**Cadence:** +4h → +6h → +24h → +72h (gentle start)

---

## Auto-Stop Rule (CRITICAL)

- User returns to site → cancel active sequence → re-evaluate position → start new sequence if needed
- Joining Discord or purchasing → exits prospect web entirely
- Same pattern reused for value ladder

---

## Member Value Ladder

**Tiers:** Free Discord → Research (£8) → Recoil (£28) → Terminal (£58) → Full Suite (£88)

**Per-tier lifecycle:**
- Instant welcome email
- Daily market perception email (mystique, not cringey)
- 2x/week mission/aspirations emails
- Weekly newsletter (Research+) - all pairs, commodities, indices

**Upgrade nudges (near renewal):**
- Price-delta framing: "You pay £8, Recoil is £28, difference is £20"
- List trivial things £20 buys
- Justify why this £20 is best spend (ROI)
- Repeat at each rung

---

## Tech Stack

| Layer | Role |
|-------|------|
| Site + tracking | Pages, opt-in, events, timezone capture |
| Automation platform | EXECUTOR - flows, state, sends, auto-stop, branching |
| OpenClaw | BRAIN - drafts copy, analyzes, generates newsletter, flags issues |
| Delivery infra | SPF/DKIM/DMARC, warm-up, hygiene |

**Platform options:** ActiveCampaign, Customer.io, GoHighLevel
**Test:** "Can it cancel sequence mid-flight on event and branch on tag?"
**Avoid:** Mailchimp (weak conditional logic)

**RULE:** AI drafts → Platform sends. OpenClaw NEVER in sending path.

---

## Key Principles

1. Tracking spine built first, rock-solid
2. Single identity per email, all events attached
3. Auto-stop on any state change
4. Buyers → Dashboard, prospects → Discord
5. Platform handles send-time optimization natively
6. AI writes INTO platform, never sends FROM it
