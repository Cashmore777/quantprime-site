// Quant Prime - Stripe Webhook Handler (Supabase Edge Function)
// Zero AI cost - pure event processing

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts"

// Tier configuration
const STRIPE_PRICE_TO_TIER: Record<string, string> = {
  'price_1Txkaq15x1S5u1oiJwZrI1Hd': 'research',  // Research monthly
  'price_1TxtAV15x1S5u1oincg7WIy7': 'research',  // Research annual
  'price_1Txkc115x1S5u1oiwzO6XDl3': 'recoil',    // Recoil monthly
  'price_1TxtBf15x1S5u1oiypqG6pNI': 'recoil',    // Recoil annual
  'price_1Txkcl15x1S5u1oiOzoawxOp': 'terminal',  // Terminal monthly
  'price_1TxtCS15x1S5u1oi64nFXWGL': 'terminal',  // Terminal annual
  'price_1TxkdT15x1S5u1oiqElyXsjn': 'suite',     // Suite monthly
  'price_1TxtD215x1S5u1oibAsDD4ua': 'suite',     // Suite annual
}

const TIER_RANK: Record<string, number> = {
  'free': 0,
  'research': 1,
  'recoil': 2,
  'terminal': 3,
  'suite': 4
}

const TIER_FEATURES: Record<string, any> = {
  'free': { chatAllowance: 0, indicatorAccess: false, researchAccess: false },
  'research': { chatAllowance: 10, indicatorAccess: true, researchAccess: true },
  'recoil': { chatAllowance: 50, indicatorAccess: true, researchAccess: true },
  'terminal': { chatAllowance: 100, indicatorAccess: true, researchAccess: true },
  'suite': { chatAllowance: -1, indicatorAccess: true, researchAccess: true },
}

// Brevo list IDs per tier
const TIER_LIST_ID: Record<string, number> = {
  'research': 7,
  'recoil': 9,
  'terminal': 10,
  'suite': 11
}

const WINBACK_LIST_TRIAL = 12
const WINBACK_LIST_MEMBER = 13

// Verify Stripe signature
async function verifySignature(payload: string, signature: string, secret: string): Promise<boolean> {
  const elements = signature.split(',')
  const sigHash: Record<string, string> = {}
  
  for (const el of elements) {
    const [key, value] = el.split('=')
    sigHash[key] = value
  }
  
  const timestamp = sigHash['t']
  const expectedSig = sigHash['v1']
  
  if (!timestamp || !expectedSig) return false
  
  // Check timestamp (5 min tolerance)
  const currentTime = Math.floor(Date.now() / 1000)
  if (Math.abs(currentTime - parseInt(timestamp)) > 300) return false
  
  // Compute signature
  const signedPayload = `${timestamp}.${payload}`
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(signedPayload))
  const computedSig = Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
  
  return computedSig === expectedSig
}

// Get tier from subscription
function getTierFromSubscription(subscription: any): string {
  if (!subscription.items?.data?.length) return 'free'
  
  let highestTier = 'free'
  let highestRank = 0
  
  for (const item of subscription.items.data) {
    const priceId = item.price?.id
    if (priceId && STRIPE_PRICE_TO_TIER[priceId]) {
      const tier = STRIPE_PRICE_TO_TIER[priceId]
      const rank = TIER_RANK[tier] || 0
      if (rank > highestRank) {
        highestTier = tier
        highestRank = rank
      }
    }
  }
  
  return highestTier
}

// Sync to Brevo
async function syncToBrevo(email: string, attributes: Record<string, any>) {
  const brevoKey = Deno.env.get('BREVO_API_KEY')
  if (!brevoKey) {
    console.error('[Brevo] No API key')
    return
  }
  
  try {
    const res = await fetch(`https://api.brevo.com/v3/contacts/${encodeURIComponent(email)}`, {
      method: 'PUT',
      headers: {
        'api-key': brevoKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ attributes })
    })
    
    if (res.status === 404) {
      // Create contact
      await fetch('https://api.brevo.com/v3/contacts', {
        method: 'POST',
        headers: {
          'api-key': brevoKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, attributes, updateEnabled: true })
      })
    }
    
    console.log('[Brevo] Synced:', email)
  } catch (e) {
    console.error('[Brevo] Error:', e)
  }
}

// Add contact to Brevo list
async function addToBrevoList(email: string, listId: number) {
  const brevoKey = Deno.env.get('BREVO_API_KEY')
  if (!brevoKey || !listId) return
  
  try {
    await fetch(`https://api.brevo.com/v3/contacts/lists/${listId}/contacts/add`, {
      method: 'POST',
      headers: {
        'api-key': brevoKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ emails: [email] })
    })
    console.log(`[Brevo] Added ${email} to list ${listId}`)
  } catch (e) {
    console.error('[Brevo] Add to list error:', e)
  }
}

// Remove contact from Brevo list
async function removeFromBrevoList(email: string, listId: number) {
  const brevoKey = Deno.env.get('BREVO_API_KEY')
  if (!brevoKey || !listId) return
  
  try {
    await fetch(`https://api.brevo.com/v3/contacts/lists/${listId}/contacts/remove`, {
      method: 'POST',
      headers: {
        'api-key': brevoKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ emails: [email] })
    })
    console.log(`[Brevo] Removed ${email} from list ${listId}`)
  } catch (e) {
    console.error('[Brevo] Remove from list error:', e)
  }
}

// Update Brevo lists on tier change
async function updateBrevoLists(email: string, oldTier: string, newTier: string) {
  // Remove from old tier list
  const oldListId = TIER_LIST_ID[oldTier]
  if (oldListId) {
    await removeFromBrevoList(email, oldListId)
  }
  
  // Add to new tier list
  const newListId = TIER_LIST_ID[newTier]
  if (newListId) {
    await addToBrevoList(email, newListId)
  }
}

serve(async (req) => {
  // Only accept POST
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }
  
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
  const signature = req.headers.get('stripe-signature')
  const payload = await req.text()
  
  // Verify signature
  if (webhookSecret && signature) {
    const valid = await verifySignature(payload, signature, webhookSecret)
    if (!valid) {
      console.error('[Stripe] Invalid signature')
      return new Response('Invalid signature', { status: 401 })
    }
  }
  
  // Parse event
  let event: any
  try {
    event = JSON.parse(payload)
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }
  
  console.log(`[Stripe] Event: ${event.type} (${event.id})`)
  
  // Create Supabase client with service role
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )
  
  // Log event
  await supabase.from('stripe_events').insert({
    event_id: event.id,
    event_type: event.type,
    data: event.data,
    status: 'received'
  }).catch(() => {})
  
  // Process event
  try {
    switch (event.type) {
      case 'customer.subscription.created': {
        const sub = event.data.object
        const email = sub.customer_email
        const tier = getTierFromSubscription(sub)
        const features = TIER_FEATURES[tier]
        
        console.log(`[Stripe] New subscription: ${email} → ${tier}`)
        
        // Update profile
        if (email) {
          await supabase.from('profiles')
            .update({
              tier,
              tier_since: new Date().toISOString(),
              sub_status: 'active',
              stripe_customer_id: sub.customer,
              stripe_subscription_id: sub.id,
              chat_allowance: features.chatAllowance,
              indicator_access: features.indicatorAccess,
              research_access: features.researchAccess
            })
            .eq('email', email)
          
          // Sync to Brevo
          await syncToBrevo(email, {
            TIER: tier.toUpperCase(),
            TIER_RANK: TIER_RANK[tier],
            SUB_STATUS: 'active',
            STRIPE_CUSTOMER_ID: sub.customer
          })
          
          // Add to tier list (new sub = from free)
          await updateBrevoLists(email, 'free', tier)
          
          // Log tier change
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', email)
            .single()
          
          if (profile) {
            await supabase.from('tier_changes').insert({
              user_id: profile.id,
              email,
              old_tier: 'free',
              new_tier: tier,
              trigger_source: 'stripe_webhook',
              trigger_event_id: event.id
            })
          }
        }
        break
      }
      
      case 'customer.subscription.updated': {
        const sub = event.data.object
        const email = sub.customer_email
        const tier = getTierFromSubscription(sub)
        const cancelPending = !!sub.cancel_at_period_end
        const features = TIER_FEATURES[tier]
        
        console.log(`[Stripe] Subscription updated: ${email} → ${tier}`)
        
        if (email) {
          // Get current tier
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, tier')
            .eq('email', email)
            .single()
          
          const oldTier = profile?.tier || 'free'
          
          // Update profile
          await supabase.from('profiles')
            .update({
              tier,
              sub_status: 'active',
              cancel_pending: cancelPending,
              chat_allowance: features.chatAllowance,
              indicator_access: features.indicatorAccess,
              research_access: features.researchAccess,
              ...(oldTier !== tier ? { tier_since: new Date().toISOString() } : {})
            })
            .eq('email', email)
          
          // Sync to Brevo
          await syncToBrevo(email, {
            TIER: tier.toUpperCase(),
            TIER_RANK: TIER_RANK[tier],
            SUB_STATUS: 'active',
            CANCEL_PENDING: cancelPending
          })
          
          // Log tier change if changed
          if (oldTier !== tier && profile) {
            await supabase.from('tier_changes').insert({
              user_id: profile.id,
              email,
              old_tier: oldTier,
              new_tier: tier,
              trigger_source: 'stripe_webhook',
              trigger_event_id: event.id
            })
            
            // Update Brevo lists (remove from old, add to new)
            await updateBrevoLists(email, oldTier, tier)
          }
        }
        break
      }
      
      case 'customer.subscription.deleted': {
        const sub = event.data.object
        const email = sub.customer_email
        
        console.log(`[Stripe] Subscription cancelled: ${email}`)
        
        if (email) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, tier')
            .eq('email', email)
            .single()
          
          const oldTier = profile?.tier || 'free'
          
          // Drop to free
          await supabase.from('profiles')
            .update({
              tier: 'free',
              tier_since: new Date().toISOString(),
              sub_status: 'cancelled',
              chat_allowance: 0,
              indicator_access: false,
              research_access: false
            })
            .eq('email', email)
          
          // Sync to Brevo
          await syncToBrevo(email, {
            TIER: 'FREE',
            TIER_RANK: 0,
            SUB_STATUS: 'cancelled'
          })
          
          // Log tier change
          if (profile) {
            await supabase.from('tier_changes').insert({
              user_id: profile.id,
              email,
              old_tier: oldTier,
              new_tier: 'free',
              trigger_source: 'stripe_webhook',
              trigger_event_id: event.id
            })
          }
          
          // Remove from tier list
          const oldListId = TIER_LIST_ID[oldTier]
          if (oldListId) {
            await removeFromBrevoList(email, oldListId)
          }
          
          // Add to winback list (trial if cancelled within 7 days, otherwise member)
          const subCreated = new Date(sub.created * 1000)
          const daysSinceCreated = (Date.now() - subCreated.getTime()) / (1000 * 60 * 60 * 24)
          const winbackList = daysSinceCreated <= 7 ? WINBACK_LIST_TRIAL : WINBACK_LIST_MEMBER
          await addToBrevoList(email, winbackList)
        }
        break
      }
      
      case 'invoice.payment_failed': {
        const invoice = event.data.object
        const email = invoice.customer_email
        
        console.log(`[Stripe] Payment failed: ${email}`)
        
        if (email) {
          await supabase.from('profiles')
            .update({ sub_status: 'past_due' })
            .eq('email', email)
          
          await syncToBrevo(email, { SUB_STATUS: 'past_due' })
        }
        break
      }
      
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object
        const email = invoice.customer_email
        
        if (invoice.billing_reason === 'subscription_cycle' || 
            invoice.billing_reason === 'subscription_update') {
          console.log(`[Stripe] Payment succeeded: ${email}`)
          
          if (email) {
            await supabase.from('profiles')
              .update({ sub_status: 'active' })
              .eq('email', email)
            
            await syncToBrevo(email, { SUB_STATUS: 'active' })
          }
        }
        break
      }
      
      case 'charge.refunded': {
        const charge = event.data.object
        const email = charge.billing_details?.email
        
        console.log(`[Stripe] Refund: ${email}`)
        
        if (email) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, tier')
            .eq('email', email)
            .single()
          
          // Drop to free, suppress sales for 90 days
          await supabase.from('profiles')
            .update({
              tier: 'free',
              sub_status: 'none',
              chat_allowance: 0,
              indicator_access: false,
              research_access: false,
              sales_suppressed_until: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
            })
            .eq('email', email)
          
          await syncToBrevo(email, {
            TIER: 'FREE',
            TIER_RANK: 0,
            SUB_STATUS: 'none'
          })
          
          if (profile) {
            await supabase.from('tier_changes').insert({
              user_id: profile.id,
              email,
              old_tier: profile.tier,
              new_tier: 'free',
              trigger_source: 'stripe_webhook',
              trigger_event_id: event.id,
              metadata: { reason: 'refund' }
            })
          }
        }
        break
      }
    }
    
    // Mark as processed
    await supabase.from('stripe_events')
      .update({ status: 'processed' })
      .eq('event_id', event.id)
    
  } catch (e) {
    console.error('[Stripe] Processing error:', e)
    await supabase.from('stripe_events')
      .update({ status: 'error', error: String(e) })
      .eq('event_id', event.id)
  }
  
  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
