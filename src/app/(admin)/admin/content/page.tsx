// src/app/(admin)/admin/content/page.tsx

import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
  BookOpen,
  Layers,
  FileText,
  PenTool,
  Plus,
  ChevronRight,
  Globe,
  Crown,
} from "lucide-react";

export default async function AdminContentPage() {
  const supabase = await createClient();

  // Get languages
  const { data: languages } = await supabase
    .from("languages")
    .select("*")
    .order("name");

  // Get courses with counts
  const { data: courses } = await supabase
    .from("courses")
    .select(`
      id,
      title,
      slug,
      level,
      is_premium,
      is_published,
      language_id,
      languages (
        name,
        flag_emoji
      )
    `)
    .order("order_index");

  // Get counts for each course
  const coursesWithCounts = await Promise.all(
    (courses || []).map(async (course) => {
      const { count: unitCount } = await supabase
        .from("units")
        .select("*", { count: "exact", head: true })
        .eq("course_id", course.id);

      const { count: lessonCount } = await supabase
        .from("lessons")
        .select("*", { count: "exact", head: true })
        .eq("unit_id", (await supabase.from("units").select("id").eq("course_id", course.id)).data?.map(u => u.id) || []);

      // Get lessons through units
      const { data: units } = await supabase
        .from("units")
        .select("id")
        .eq("course_id", course.id);

      let totalLessons = 0;
      let totalExercises = 0;

      if (units) {
        for (const unit of units) {
          const { count: lCount } = await supabase
            .from("lessons")
            .select("*", { count: "exact", head: true })
            .eq("unit_id", unit.id);
          totalLessons += lCount || 0;

          const { data: lessons } = await supabase
            .from("lessons")
            .select("id")
            .eq("unit_id", unit.id);

          if (lessons) {
            for (const lesson of lessons) {
              const { count: eCount } = await supabase
                .from("exercises")
                .select("*", { count: "exact", head: true })
                .eq("lesson_id", lesson.id);
              totalExercises += eCount || 0;
            }
          }
        }
      }

      return {
        ...course,
        unitCount: unitCount || 0,
        lessonCount: totalLessons,
        exerciseCount: totalExercises,
      };
    })
  );

  // Get overall stats
  const { count: totalCourses } = await supabase
    .from("courses")
    .select("*", { count: "exact", head: true });

  const { count: totalUnits } = await supabase
    .from("units")
    .select("*", { count: "exact", head: true });

  const { count: totalLessons } = await supabase
    .from("lessons")
    .select("*", { count: "exact", head: true });

  const { count: totalExercises } = await supabase
    .from("exercises")
    .select("*", { count: "exact", head: true });

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Content</h1>
          <p className="text-gray-500 mt-1">
            Manage courses, lessons, and exercises
          </p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Course
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalCourses || 0}</p>
              <p className="text-sm text-gray-500">Courses</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Layers className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalUnits || 0}</p>
              <p className="text-sm text-gray-500">Units</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FileText className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalLessons || 0}</p>
              <p className="text-sm text-gray-500">Lessons</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <PenTool className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalExercises || 0}</p>
              <p className="text-sm text-gray-500">Exercises</p>
            </div>
          </div>
        </div>
      </div>

      {/* Languages */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Globe className="w-5 h-5 text-gray-500" />
            Languages
          </h2>
          <button className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
            + Add Language
          </button>
        </div>
        <div className="p-4">
          <div className="flex flex-wrap gap-3">
            {languages?.map((lang) => (
              <div
                key={lang.id}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
                  lang.is_active
                    ? "border-green-200 bg-green-50"
                    : "border-gray-200 bg-gray-50"
                }`}
              >
                <span className="text-2xl">{lang.flag_emoji}</span>
                <span className="font-medium text-gray-900">{lang.name}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    lang.is_active
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {lang.is_active ? "Active" : "Inactive"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Courses List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">All Courses</h2>
        </div>

        <div className="divide-y divide-gray-100">
          {coursesWithCounts.map((course) => (
            <div
              key={course.id}
              className="px-6 py-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-2xl">
                    {(course.languages as any)?.flag_emoji || "🌍"}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-900">{course.title}</h3>
                      <span className="px-2 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-600">
                        {course.level}
                      </span>
                      {course.is_premium && (
                        <span className="px-2 py-0.5 text-xs font-medium rounded bg-amber-100 text-amber-700 flex items-center gap-1">
                          <Crown className="w-3 h-3" />
                          Premium
                        </span>
                      )}
                      {!course.is_published && (
                        <span className="px-2 py-0.5 text-xs font-medium rounded bg-red-100 text-red-700">
                          Draft
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {course.unitCount} units • {course.lessonCount} lessons • {course.exerciseCount} exercises
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/content/${course.slug}`}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  >
                    Edit
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))}

          {(!coursesWithCounts || coursesWithCounts.length === 0) && (
            <div className="px-6 py-12 text-center">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No courses yet</p>
              <button className="mt-4 text-indigo-600 hover:text-indigo-800 font-medium">
                Create your first course
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}