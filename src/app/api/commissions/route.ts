// src/app/api/commissions/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { getCommissionConfig } from '@/lib/settings';

// GET: Fetch commission data for current tutor
export async function GET() {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Every query below is scoped to user.id; the service client just keeps
    // the answer independent of whatever RLS the finance tables happen to have.
    const db = createServiceClient();

    const { data: tutor, error: tutorError } = await db
      .from('users')
      .select('commission_balance, tutor_plan')
      .eq('id', user.id)
      .single();

    if (tutorError) throw tutorError;

    const { data: ledger } = await db
      .from('commission_ledger')
      .select(`
        id, amount, commission_rate, kind, created_at, period_start,
        student:student_id (
          name,
          email
        )
      `)
      .eq('tutor_id', user.id)
      .order('created_at', { ascending: false });

    const { count: referredStudents } = await db
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('referred_by_tutor_id', user.id);

    const { count: payingStudents } = await db
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('referred_by_tutor_id', user.id)
      .not('subscription_plan', 'is', null)
      .not('subscription_plan', 'in', '(FREE,free,none)');

    // A withdrawal the tutor asked for that the admin hasn't paid yet.
    const { data: pending } = await db
      .from('commission_payouts')
      .select('amount, created_at')
      .eq('tutor_id', user.id)
      .eq('status', 'requested')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // The ledger column is `amount`. This summed `commission_amount`, which
    // doesn't exist, so every total came out NaN. Reversals are negative rows
    // and net out here.
    const amountOf = (entry: { amount: number | string | null }) => Number(entry.amount) || 0;
    const thisMonth = (ledger ?? []).reduce(
      (sum, entry) => (new Date(entry.created_at) >= startOfMonth ? sum + amountOf(entry) : sum),
      0
    );
    const totalEarned = (ledger ?? []).reduce((sum, entry) => sum + amountOf(entry), 0);

    const settings = await getCommissionConfig();

    return NextResponse.json({
      ledger: ledger || [],
      summary: {
        total_earned: Math.round(totalEarned * 100) / 100,
        available_balance: Number(tutor?.commission_balance) || 0,
        referred_students: referredStudents || 0,
        paying_students: payingStudents || 0,
        this_month: Math.round(thisMonth * 100) / 100,
        pending_request: pending ? { amount: Number(pending.amount), created_at: pending.created_at } : null,
      },
      settings
    });
  } catch (error) {
    console.error('Error fetching commissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch commission data' },
      { status: 500 }
    );
  }
}
