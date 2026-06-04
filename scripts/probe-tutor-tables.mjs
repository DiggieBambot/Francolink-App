import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
config({ path: ".env.local" });
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const tables = ['users','tutor_lessons','tutor_lesson_assignments','sessions','session_messages','invitations','tutor_invitations','student_invitations','commissions','referrals','tutor_students','student_tutors','tutor_plans','tutor_subscriptions','session_attendees','session_notes','tutor_pricing','tutor_plan_subscriptions'];
for (const t of tables) {
  const {count, error} = await s.from(t).select('*', {count:'exact', head:true});
  if (error) console.log('  '+t.padEnd(28)+' '+(error.code || 'err'));
  else console.log('  '+t.padEnd(28)+' '+count+' rows');
}
