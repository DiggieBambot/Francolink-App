// src/app/api/webhooks/stripe/route.ts
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Use service role for webhook (bypasses RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper to get settings from database
async function getAppSetting(key: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', key)
    .single();
  
  return data?.value || null;
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = headers().get('stripe-signature');

  if (!signature) {
    console.error('No Stripe signature found');
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  // Get Stripe config from database
  const stripeSecretKey = await getAppSetting('stripe_secret_key') || process.env.STRIPE_SECRET_KEY;
  const webhookSecret = await getAppSetting('stripe_webhook_secret') || process.env.STRIPE_WEBHOOK_SECRET;
  const stripeEnabled = await getAppSetting('stripe_enabled');

  if (!stripeSecretKey || !webhookSecret) {
    console.error('Stripe not configured');
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
  }

  if (stripeEnabled !== 'true') {
    console.log('Stripe is disabled, ignoring webhook');
    return NextResponse.json({ received: true, message: 'Stripe disabled' });
  }

  // Initialize Stripe with key from database
  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2023-10-16'
  });

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  console.log(`Processing webhook event: ${event.type}`);

  try {
    switch (event.type) {
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionCancelled(event.data.object as Stripe.Subscription);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

/**
 * Handle successful payment - calculate and add commission
 */
async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('Processing payment succeeded:', invoice.id);

  // Skip if no customer or amount
  if (!invoice.customer || !invoice.amount_paid) {
    console.log('Skipping: No customer or amount');
    return;
  }

  const customerId = typeof invoice.customer === 'string' 
    ? invoice.customer 
    : invoice.customer.id;

  // Find user by Stripe customer ID
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, referred_by_tutor_id, name, email')
    .eq('stripe_customer_id', customerId)
    .single();

  if (userError || !user) {
    console.log('No user found for customer:', customerId);
    return;
  }

  // Check if user was referred by a tutor
  if (!user.referred_by_tutor_id) {
    console.log('User not referred by tutor:', user.id);
    return;
  }

  // Get commission settings from app_settings
  const commissionEnabled = await getAppSetting('commission_enabled');
  if (commissionEnabled !== 'true') {
    console.log('Commission system is disabled');
    return;
  }

  // Commission model: 10% on the student's FIRST paid month, 5% on every month
  // after. Detect "first" from the Stripe billing_reason, falling back to the
  // commission ledger (no prior entry for this student → treat as first).
  const billingReason = (invoice as Stripe.Invoice & { billing_reason?: string }).billing_reason;
  let isFirst = billingReason === 'subscription_create';
  if (!isFirst && billingReason !== 'subscription_cycle') {
    // Unknown reason → decide from ledger history.
    const { count } = await supabase
      .from('commission_ledger')
      .select('*', { count: 'exact', head: true })
      .eq('tutor_id', user.referred_by_tutor_id)
      .eq('student_id', user.id);
    isFirst = (count ?? 0) === 0;
  }

  const firstRate = parseFloat((await getAppSetting('commission_rate_first_month')) || '0.10');
  const recurringRate = parseFloat((await getAppSetting('commission_rate_recurring')) || '0.05');
  const commissionRate = isFirst ? firstRate : recurringRate;

  const grossAmount = invoice.amount_paid / 100; // cents → dollars
  const commissionAmount = Math.round(grossAmount * commissionRate * 100) / 100;

  console.log(
    `Commission (${isFirst ? 'first month' : 'recurring'}): ${grossAmount} x ${commissionRate} = ${commissionAmount}`
  );

  // Subscription id + period (for the ledger row).
  const subId =
    typeof (invoice as Stripe.Invoice & { subscription?: string }).subscription === 'string'
      ? (invoice as Stripe.Invoice & { subscription?: string }).subscription
      : null;
  const line = invoice.lines?.data?.[0];
  const periodStart = line?.period?.start ? new Date(line.period.start * 1000).toISOString() : null;
  const periodEnd = line?.period?.end ? new Date(line.period.end * 1000).toISOString() : null;

  // 1) Write an immutable ledger entry.
  const { error: ledgerError } = await supabase.from('commission_ledger').insert({
    tutor_id: user.referred_by_tutor_id,
    student_id: user.id,
    subscription_id: subId,
    amount: commissionAmount,
    commission_rate: commissionRate,
    period_start: periodStart,
    period_end: periodEnd,
    status: 'paid',
  });
  if (ledgerError) {
    console.error('Error writing commission_ledger:', ledgerError.message);
    // Don't return — still try to update the running balance below.
  }

  // 2) Update the tutor's running balance.
  const { data: tutor, error: tutorFetchError } = await supabase
    .from('users')
    .select('commission_balance')
    .eq('id', user.referred_by_tutor_id)
    .single();
  if (tutorFetchError) {
    console.error('Error fetching tutor:', tutorFetchError);
    return;
  }
  const currentBalance = parseFloat(tutor?.commission_balance || '0');
  const newBalance = Math.round((currentBalance + commissionAmount) * 100) / 100;
  const { error: updateError } = await supabase
    .from('users')
    .update({ commission_balance: newBalance })
    .eq('id', user.referred_by_tutor_id);
  if (updateError) {
    console.error('Error updating commission balance:', updateError);
    return;
  }

  console.log(
    `✅ Commission $${commissionAmount.toFixed(2)} (${isFirst ? '10%' : '5%'}) → tutor ${user.referred_by_tutor_id}. New balance: $${newBalance.toFixed(2)}`
  );
}

/**
 * Handle subscription created
 */
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log('Subscription created:', subscription.id);
  
  const customerId = typeof subscription.customer === 'string'
    ? subscription.customer
    : subscription.customer.id;

  // Determine plan from price
  const priceId = subscription.items.data[0]?.price?.id;
  const plan = await determinePlanFromPriceId(priceId);
  const period = subscription.items.data[0]?.price?.recurring?.interval === 'year' ? 'yearly' : 'monthly';

  await supabase
    .from('users')
    .update({
      subscription_plan: plan,
      subscription_period: period,
      stripe_subscription_id: subscription.id,
      subscription_started_at: new Date().toISOString()
    })
    .eq('stripe_customer_id', customerId);
}

/**
 * Handle subscription updated
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('Subscription updated:', subscription.id);
  
  const customerId = typeof subscription.customer === 'string'
    ? subscription.customer
    : subscription.customer.id;

  const priceId = subscription.items.data[0]?.price?.id;
  const plan = await determinePlanFromPriceId(priceId);
  const period = subscription.items.data[0]?.price?.recurring?.interval === 'year' ? 'yearly' : 'monthly';

  await supabase
    .from('users')
    .update({
      subscription_plan: plan,
      subscription_period: period
    })
    .eq('stripe_customer_id', customerId);
}

/**
 * Handle subscription cancelled
 */
async function handleSubscriptionCancelled(subscription: Stripe.Subscription) {
  console.log('Subscription cancelled:', subscription.id);
  
  const customerId = typeof subscription.customer === 'string'
    ? subscription.customer
    : subscription.customer.id;

  await supabase
    .from('users')
    .update({
      subscription_plan: 'FREE',
      subscription_period: null,
      stripe_subscription_id: null,
      subscription_ends_at: new Date().toISOString()
    })
    .eq('stripe_customer_id', customerId);
}

/**
 * Determine subscription plan from Stripe price ID
 */
async function determinePlanFromPriceId(priceId: string | undefined): Promise<string> {
  if (!priceId) return 'FREE';

  const premiumMonthly = await getAppSetting('stripe_premium_monthly_price_id');
  const premiumYearly = await getAppSetting('stripe_premium_yearly_price_id');
  const premiumPlusMonthly = await getAppSetting('stripe_premium_plus_monthly_price_id');
  const premiumPlusYearly = await getAppSetting('stripe_premium_plus_yearly_price_id');

  if (priceId === premiumPlusMonthly || priceId === premiumPlusYearly) {
    return 'PREMIUM_PLUS';
  }
  if (priceId === premiumMonthly || priceId === premiumYearly) {
    return 'PREMIUM';
  }
  
  return 'PREMIUM'; // Default to Premium if unknown
}