// src/app/tutors/page.tsx
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Users, ChevronRight, Star, Clock } from "lucide-react";

export default async function TutorsPage() {
  const supabase = await createClient();

  // Check if user is logged in
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch all tutors
  const { data: tutors } = await supabase
    .from("users")
    .select("id, name, email, avatar_url, tutor_plan, tutor_invite_code")
    .not('tutor_invite_code', 'is', null)
    .order('name');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-blue-600">
            FrancoLink
          </Link>
          <div className="flex gap-4">
            {user ? (
              // Logged in - show dashboard link
              <Link 
                href="/dashboard" 
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Dashboard
              </Link>
            ) : (
              // Not logged in - show login/signup
              <>
                <Link href="/login" className="px-4 py-2 text-gray-600 hover:text-gray-900">
                  Login
                </Link>
                <Link href="/signup" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Find Your Perfect French Tutor
          </h1>
          <p className="text-xl text-gray-600">
            Learn from experienced tutors who will guide you to French fluency
          </p>
        </div>

        {/* Tutors Grid */}
        {tutors && tutors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tutors.map((tutor) => (
              <div key={tutor.id} className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-lg transition-all">
                {/* Avatar */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white">
                    {tutor.name?.charAt(0) || 'T'}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">
                      {tutor.name || 'French Tutor'}
                    </h3>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                      {tutor.tutor_plan || 'Basic'}
                    </span>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex gap-4 text-sm text-gray-600 mb-4">
                  <span className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500" />
                    5.0
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    Active
                  </span>
                </div>

                {/* Bio */}
                <p className="text-gray-600 text-sm mb-4">
                  Experienced French tutor ready to help you achieve fluency.
                </p>

                {/* Join Button */}
                <Link
                  href={`/join/${tutor.tutor_invite_code}`}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Join Class
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-xl">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">No Tutors Available</h2>
            <p className="text-gray-500 mb-4">Check back soon!</p>
            <Link href="/signup/tutor" className="text-blue-600 hover:underline">
              Become a Tutor →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}