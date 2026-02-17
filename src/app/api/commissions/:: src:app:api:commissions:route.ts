// src/app/api/commissions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCommissionConfig } from '@/lib/settings';

// GET: Fetch commission data for current tutor
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get tutor's info with commission balance
    const { data: tutor, error: tutorError } = await supabase
      .from('users')
      .select('commission_balance, tutor_plan')
      .eq('id', user.id)
      .single();

    if (tutorError) throw tutorError;

    // Fetch commission ledger entries (if table exists)
    const { data: ledger } = await supabase
      .from('commission_ledger')
      .select(`
        *,
        student:student_id (
          name,
          email
        )
      `)
      .eq('tutor_id', user.id)
      .order('created_at', { ascending: false });

    // Get referred students count
    const { count: referredStudents } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('referred_by_tutor_id', user.id);

    // Get active paying students
    const { count: payingStudents } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('referred_by_tutor_id', user.id)
      .neq('subscription_plan', 'FREE');

    // Calculate this month's earnings from ledger
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const thisMonth = ledger?.reduce((sum, entry) => {
      const entryDate = new Date(entry.created_at);
      return entryDate >= startOfMonth 
        ? sum + parseFloat(entry.commission_amount) 
        : sum;
    }, 0) || 0;

    // Total earned (from ledger)
    const totalEarned = ledger?.reduce((sum, entry) => 
      sum + parseFloat(entry.commission_amount), 0) || 0;

    // Get commission settings
    const settings = await getCommissionConfig();

    return NextResponse.json({
      ledger: ledger || [],
      summary: {
        total_earned: totalEarned,
        available_balance: parseFloat(tutor?.commission_balance || '0'),
        referred_students: referredStudents || 0,
        paying_students: payingStudents || 0,
        this_month: thisMonth
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