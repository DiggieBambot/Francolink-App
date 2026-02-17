// src/app/(student)/placement-test/page.tsx

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PlacementTestFlow from "@/components/placement-test/placement-test-flow";

export default async function PlacementTestPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Check if user already took the placement test
  const { data: userData } = await supabase
    .from("users")
    .select("id, name, placement_test_taken, placement_test_level")
    .eq("id", user.id)
    .single();

  // If already taken, redirect to their recommended course
  if (userData?.placement_test_taken) {
    const level = userData.placement_test_level?.toLowerCase() || "a1";
    redirect(`/learn/french/${level}`);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PlacementTestFlow 
        userId={user.id} 
        userName={userData?.name || "there"} 
      />
    </div>
  );
}