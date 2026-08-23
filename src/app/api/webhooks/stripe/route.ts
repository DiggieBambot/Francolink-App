// src/app/api/webhooks/stripe/route.ts
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { isLessonPlanSubscription } from '@/lib/credits/referral';
import { activateLessonPlan, endLessonPlan } from '@/lib/credits/subscription';

// Use service role for webhook (bypasses RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper to get settings from database.
//
// The category is part of the identity of a setting, not decoration: app_settings
// holds both features/stripe_enabled ("true", what the admin toggle writes) and a
// stale payments/stripe_enabled ("false"). Selecting on key alone matched both,
// and .single() answers a 2-row result with PGRST116 and null data — so this
// returned null for the one setting that gates every webhook. It survived only
// because null is not 'false'. Pinning the category makes the read mean what it says.
async function getAppSetting(
  category: string,
  key: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from('app_settings')
    .select('value')
    .eq('category', category)
    .eq('key', key)
    .maybeSingle();

  if (error) {
    console.error(`app_settings lookup failed for ${category}/${key}:`, error);
    return null;
  }
  return data?.value || null;
}

export async function POST(request: Request) {
  const body = await request.text();
  // Read straight off the Request. next/headers' headers() is async in Next 15+,
  // and calling .get() on the returned promise threw before any of this ran —
  // every webhook POST answered 500, so no Stripe event was ever processed.
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    console.error('No Stripe signature found');
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  // Get Stripe config from database
  const stripeSecretKey = await getAppSetting('payments', 'stripe_secret_key') || process.env.STRIPE_SECRET_KEY;
  const webhookSecret = await getAppSetting('payments', 'stripe_webhook_secret') || process.env.STRIPE_WEBHOOK_SECRET;
  const stripeEnabled = await getAppSetting('features', 'stripe_enabled');

  if (!stripeSecretKey || !webhookSecret) {
    console.error('Stripe not configured');
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
  }

  // Kill switch, not a feature flag: only an explicit 'false' turns webhooks
  // off. It used to require an explicit 'true', so a missing or mistyped
  // app_settings row silently dropped every event — and because the response
  // is a 200, Stripe reported success. A student could pay for a lesson and
  // have the booking quietly never confirm, with no error anywhere to find.
  if (stripeEnabled === 'false') {
    console.log('Stripe is disabled by app_settings.stripe_enabled=false, ignoring webhook');
    return NextResponse.json({ received: true, message: 'Stripe disabled' });
  }

  // Initialize Stripe with key from database.
  //
  // apiVersion only shapes outbound API calls, and this route makes none — the
  // single Stripe call is webhooks.constructEvent, which is an HMAC check over
  // the raw body and is version-independent. The shape of event.data.object is
  // set by the *endpoint's* pinned version in the Stripe dashboard (2024-04-10),
  // not by this. So this line was only ever typing the client, and the pinned
  // '2023-10-16' had drifted far enough from the installed SDK (stripe@20.3.1,
  // which expects 2026-01-28.clover) to fail the type check.
  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2026-01-28.clover',
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
      // Lesson bookings are one-off payments, not subscriptions. They carry
      // metadata.kind === 'lesson_booking' so they never touch the plan logic.
      // A delayed payment method (bank debit, some wallets) completes the
      // session while payment_status is still 'unpaid', so handleCheckoutCompleted
      // leaves the slot held. Stripe reports the outcome later, and until now
      // nothing listened: the student paid and the hold expired anyway.
      // Same session object, same handler — the pending_payment guard makes the
      // second arrival a no-op when the card path already confirmed it.
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      // A delayed payment that fails leaves the slot held until it expires on
      // its own. Releasing it is the same operation as an expiry.
      case 'checkout.session.async_payment_failed':
      case 'checkout.session.expired':
        await handleCheckoutExpired(event.data.object as Stripe.Checkout.Session);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        // A lesson plan ending is not the same operation as a self-study one:
        // unused credits have to be expired and the referral bounty reviewed.
        if (sub.metadata?.kind === 'lesson_subscription' || await isLessonPlanSubscription(sub.id)) {
          await endLessonPlan(sub);
          break;
        }
        await handleSubscriptionCancelled(sub);
        break;
      }

      // A failed renewal pauses new grants but leaves granted credits alone,
      // so lessons already booked still go ahead.
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
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

  // Live lesson plans do NOT pay a recurring percentage. About half of a
  // lesson plan's revenue is already committed to the teaching tutor's wages,
  // so skimming another 5% every month turns professional annual from 32%
  // margin into 25% -- silently, with nothing in the system reporting it.
  // Referral on lesson plans is a one-time bounty instead, awarded from
  // awardReferralBounty() when the student completes their first lesson.
  const invoiceSubId =
    typeof (invoice as Stripe.Invoice & { subscription?: string }).subscription === 'string'
      ? (invoice as Stripe.Invoice & { subscription?: string }).subscription!
      : null;

  if (await isLessonPlanSubscription(invoiceSubId)) {
    console.log('Lesson plan invoice - referral is a one-time bounty, not a percentage');
    return;
  }

  // Get commission settings from app_settings
  const commissionEnabled = await getAppSetting('commissions', 'commission_enabled');
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

  const firstRate = parseFloat((await getAppSetting('commissions', 'commission_rate_first_month')) || '0.10');
  const recurringRate = parseFloat((await getAppSetting('commissions', 'commission_rate_recurring')) || '0.05');
  const commissionRate = isFirst ? firstRate : recurringRate;

  const grossAmount = invoice.amount_paid / 100; // cents → dollars
  const commissionAmount = Math.round(grossAmount * commissionRate * 100) / 100;

  console.log(
    `Commission (${isFirst ? 'first month' : 'recurring'}): ${grossAmount} x ${commissionRate} = ${commissionAmount}`
  );

  // Period for the ledger row. The subscription id was resolved above as
  // invoiceSubId, for the lesson-plan check.
  const subId = invoiceSubId;
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

  const premiumMonthly = await getAppSetting('payments', 'stripe_premium_monthly_price_id');
  const premiumYearly = await getAppSetting('payments', 'stripe_premium_yearly_price_id');
  const premiumPlusMonthly = await getAppSetting('payments', 'stripe_premium_plus_monthly_price_id');
  const premiumPlusYearly = await getAppSetting('payments', 'stripe_premium_plus_yearly_price_id');

  if (priceId === premiumPlusMonthly || priceId === premiumPlusYearly) {
    return 'PREMIUM_PLUS';
  }
  if (priceId === premiumMonthly || priceId === premiumYearly) {
    return 'PREMIUM';
  }
  
  return 'PREMIUM'; // Default to Premium if unknown
}
/* ------------------------------------------------------------------ bookings */

/**
 * Confirms a paid lesson and provisions the room.
 *
 * Idempotent: Stripe retries webhooks, and a second delivery must not create a
 * second room or re-send notifications. The status guard is what makes that
 * safe — only a booking still in `pending_payment` is acted on.
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  // A lesson plan: write user_subscriptions and grant the first week now, so
  // the student can book the moment they land back on the site.
  if (session.metadata?.kind === 'lesson_subscription') {
    if (session.payment_status !== 'paid') {
      console.log('[webhook] lesson plan checkout not yet paid:', session.id);
      return;
    }
    await activateLessonPlan(session);
    return;
  }

  if (session.metadata?.kind !== 'lesson_booking') return; // a self-study subscription

  const bookingId = session.metadata?.booking_id || session.client_reference_id;
  if (!bookingId) {
    console.error('[webhook] lesson_booking with no booking_id', session.id);
    return;
  }

  // Only confirm if money actually moved. `complete` sessions can still be
  // unpaid for async payment methods.
  if (session.payment_status !== 'paid') {
    console.log('[webhook] checkout complete but unpaid, leaving held:', bookingId);
    return;
  }

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, tutor_id, student_id, status, room_session_id')
    .eq('id', bookingId)
    .maybeSingle();

  if (!booking) {
    console.error('[webhook] no such booking', bookingId);
    return;
  }
  if (booking.status !== 'pending_payment') {
    // Already handled — a retry, or an admin got there first.
    console.log('[webhook] booking already settled:', bookingId, booking.status);
    return;
  }

  // One shared room per tutor/student pair; reused across their lessons.
  let roomId = booking.room_session_id as string | null;
  if (!roomId) {
    try {
      const { getOrCreateLessonSpace } = await import('@/lib/lessons/lesson-space');
      const space = await getOrCreateLessonSpace(booking.tutor_id, booking.student_id);
      roomId = space.id;
    } catch (e) {
      // A missing room must not lose a paid booking — confirm anyway and let
      // an admin or the next room visit sort it out.
      console.error('[webhook] room provisioning failed for', bookingId, e);
    }
  }

  const { error } = await supabase
    .from('bookings')
    .update({
      status: 'confirmed',
      stripe_payment_intent_id:
        typeof session.payment_intent === 'string' ? session.payment_intent : null,
      room_session_id: roomId,
      expires_at: null,
    })
    .eq('id', bookingId)
    // Guard against a concurrent retry flipping it twice.
    .eq('status', 'pending_payment');

  if (error) {
    console.error('[webhook] confirming booking failed', bookingId, error);
    return;
  }

  // Connect the pair so the room and homework tools see the relationship.
  await supabase
    .from('tutor_students')
    .upsert(
      {
        tutor_id: booking.tutor_id,
        student_id: booking.student_id,
        status: 'active',
      },
      { onConflict: 'tutor_id,student_id' }
    )
    .then(
      () => {},
      (e: unknown) => console.error('[webhook] linking tutor and student failed', e)
    );

  console.log('[webhook] booking confirmed:', bookingId);
}

/** Releases the slot when a student abandons checkout. */
async function handleCheckoutExpired(session: Stripe.Checkout.Session) {
  if (session.metadata?.kind !== 'lesson_booking') return;
  const bookingId = session.metadata?.booking_id || session.client_reference_id;
  if (!bookingId) return;

  await supabase
    .from('bookings')
    .update({ status: 'expired' })
    .eq('id', bookingId)
    .eq('status', 'pending_payment');

  console.log('[webhook] booking hold released:', bookingId);
}

/**
 * A renewal that failed. The plan goes past_due, which stops the weekly grant
 * without touching credits already issued -- a student mid-week keeps the
 * lessons they were promised while the card is sorted out.
 */
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const subId =
    typeof (invoice as Stripe.Invoice & { subscription?: string }).subscription === 'string'
      ? (invoice as Stripe.Invoice & { subscription?: string }).subscription!
      : null;

  if (!subId) return;

  const { error } = await supabase
    .from('user_subscriptions')
    .update({ status: 'past_due' })
    .eq('stripe_subscription_id', subId)
    .eq('status', 'active');

  if (error) {
    console.error('[webhook] marking plan past_due failed', subId, error);
    return;
  }

  console.log('[webhook] lesson plan past_due:', subId);
}
