// src/app/api/commissions/withdraw/route.ts
//
// POST { amount } — a tutor asks to be paid.
//
// This used to subtract the amount from users.commission_balance and record
// nothing else. The admin payouts queue lists tutors by balance, so a tutor who
// withdrew vanished from it and was never paid: the money was simply gone.
//
// Now it files a request (commission_payouts, status 'requested') and leaves
// the balance alone. The admin pays by hand from Admin → Pricing → Commission,
// and marking it paid is what takes the money off the balance.
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { getCommissionConfig } from '@/lib/settings';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const amount = Math.round(Number(body?.amount) * 100) / 100;

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    const settings = await getCommissionConfig();

    if (!settings.enabled) {
      return NextResponse.json(
        { error: 'Commission system is currently disabled' },
        { status: 400 }
      );
    }

    if (amount < settings.minPayoutAmount) {
      return NextResponse.json(
        { error: `Minimum payout amount is $${settings.minPayoutAmount}` },
        { status: 400 }
      );
    }

    const db = createServiceClient();

    const { data: tutor, error: tutorError } = await db
      .from('users')
      .select('commission_balance, payout_details')
      .eq('id', user.id)
      .single();

    if (tutorError) throw tutorError;

    const currentBalance = Number(tutor.commission_balance) || 0;

    if (amount > currentBalance) {
      return NextResponse.json(
        { error: `Insufficient balance. Available: $${currentBalance.toFixed(2)}` },
        { status: 400 }
      );
    }

    const method = (tutor.payout_details as { method?: string } | null)?.method;
    if (!method) {
      return NextResponse.json(
        { error: 'Add your payout details first, so we know where to send the money.' },
        { status: 400 }
      );
    }

    const { count: open } = await db
      .from('commission_payouts')
      .select('id', { count: 'exact', head: true })
      .eq('tutor_id', user.id)
      .eq('status', 'requested');

    if ((open ?? 0) > 0) {
      return NextResponse.json(
        { error: 'You already have a withdrawal request in progress.' },
        { status: 409 }
      );
    }

    // payout_method may be a constrained enum ('stripe'|'paypal'|'bank_transfer');
    // same fallback as the admin payouts route.
    const row = { tutor_id: user.id, amount, status: 'requested' };
    let { error: insertError } = await db.from('commission_payouts').insert({ ...row, payout_method: method });
    if (insertError) {
      ({ error: insertError } = await db.from('commission_payouts').insert({ ...row, payout_method: 'bank_transfer' }));
    }
    if (insertError) throw insertError;

    return NextResponse.json({
      success: true,
      message: 'Withdrawal request submitted successfully',
    });
  } catch (error) {
    console.error('Error requesting withdrawal:', error);
    return NextResponse.json(
      { error: 'Failed to process withdrawal request' },
      { status: 500 }
    );
  }
}
