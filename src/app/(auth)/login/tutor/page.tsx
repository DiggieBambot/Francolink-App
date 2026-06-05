import { LoginForm } from "@/components/auth/login-form";

export const metadata = { title: "Tutor Log In | FrancoLink" };

export default function TutorLoginPage() {
  return <LoginForm role="tutor" />;
}
