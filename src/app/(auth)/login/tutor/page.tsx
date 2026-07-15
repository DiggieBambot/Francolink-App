import { LoginForm } from "@/components/auth/login-form";

export const metadata = { title: "Tutor Log In | FrancoLink" };

export default async function TutorLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return <LoginForm role="tutor" next={next} />;
}
