// src/app/api/commissions/withdraw/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCommissionConfig } from '@/lib/settings';

// POST: Request a commission withdrawal
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

    const body = await request.json();
    const { amount } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    // Get commission settings
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

    // Get tutor's current balance
    const { data: tutor, error: tutorError } = await supabase
      .from('users')
      .select('commission_balance, email, name')
      .eq('id', user.id)
      .single();

    if (tutorError) throw tutorError;

    const currentBalance = parseFloat(tutor.commission_balance || '0');

    if (amount > currentBalance) {
      return NextResponse.json(
        { error: `Insufficient balance. Available: $${currentBalance.toFixed(2)}` },
        { status: 400 }
      );
    }

    // Deduct from balance (we'll process payout later)
    const newBalance = currentBalance - amount;

    const { error: updateError } = await supabase
      .from('users')
      .update({ commission_balance: newBalance })
      .eq('id', user.id);

    if (updateError) throw updateError;

    // TODO: In production, integrate with Stripe Connect or PayPal
    // For now, we'll just log the withdrawal request
    console.log(`Withdrawal request: $${amount} from ${tutor.email}`);

    // Optional: Send email notification to admin
    // await sendAdminNotification({
    //   type: 'withdrawal_request',
    //   tutor_id: user.id,
    //   tutor_email: tutor.email,
    //   amount: amount
    // });

    return NextResponse.json({ 
      success: true, 
      message: 'Withdrawal request submitted successfully',
      new_balance: newBalance
    });
  } catch (error) {
    console.error('Error requesting withdrawal:', error);
    return NextResponse.json(
      { error: 'Failed to process withdrawal request' },
      { status: 500 }
    );
  }
}