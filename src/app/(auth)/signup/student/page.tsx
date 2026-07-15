import { StudentSignupForm } from "@/components/auth/student-signup-form";

export const metadata = { title: "Student Sign Up | FrancoLink" };

export default async function StudentSignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return <StudentSignupForm next={next} />;
}
