import { LoginForm } from "@/components/auth/login-form";

export const metadata = { title: "Student Log In | FrancoLink" };

export default async function StudentLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return <LoginForm role="student" next={next} />;
}
