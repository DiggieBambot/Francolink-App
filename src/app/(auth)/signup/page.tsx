import { RoleChooser } from "@/components/auth/role-chooser";

export const metadata = { title: "Sign Up | FrancoLink" };

export default function SignupPage() {
  return <RoleChooser mode="signup" />;
}
