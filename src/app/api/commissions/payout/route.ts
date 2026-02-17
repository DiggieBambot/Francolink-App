// src/app/api/commissions/payout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

// POST: Request a payout
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { amount, payout_method = 'stripe' } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    // Get commission settings for minimum payout
    const { data: settings } = await supabase
      .from('commission_settings')
      .select('min_payout_amount')
      .single();

    const minPayout = settings?.min_payout_amount || 50;

    if (amount < minPayout) {
      return NextResponse.json(
        { error: `Minimum payout amount is $${minPayout}` },
        { status: 400 }
      );
    }

    // Calculate available balance
    const { data: ledger } = await supabase
      .from('commission_ledger')
      .select('commission_amount, status')
      .eq('tutor_id', user.id);

    const { data: existingPayouts } = await supabase
      .from('commission_payouts')
      .select('amount, status')
      .eq('tutor_id', user.id)
      .in('status', ['requested', 'processing']);

    const totalApproved = ledger?.reduce((sum, entry) => 
      entry.status === 'approved' ? sum + parseFloat(entry.commission_amount) : sum, 0) || 0;

    const pendingPayouts = existingPayouts?.reduce((sum, payout) => 
      sum + parseFloat(payout.amount), 0) || 0;

    const availableBalance = totalApproved - pendingPayouts;

    if (amount > availableBalance) {
      return NextResponse.json(
        { error: `Insufficient balance. Available: $${availableBalance.toFixed(2)}` },
        { status: 400 }
      );
    }

    // Create payout request
    const { data: payout, error: payoutError } = await supabase
      .from('commission_payouts')
      .insert({
        tutor_id: user.id,
        amount,
        payout_method,
        status: 'requested'
      })
      .select()
      .single();

    if (payoutError) throw payoutError;

    return NextResponse.json({ 
      success: true, 
      payout,
      message: 'Payout request submitted successfully'
    });
  } catch (error) {
    console.error('Error requesting payout:', error);
    return NextResponse.json(
      { error: 'Failed to request payout' },
      { status: 500 }
    );
  }
}