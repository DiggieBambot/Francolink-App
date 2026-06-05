import { LoginForm } from "@/components/auth/login-form";

export const metadata = { title: "Student Log In | FrancoLink" };

export default function StudentLoginPage() {
  return <LoginForm role="student" />;
}
