import { RoleChooser } from "@/components/auth/role-chooser";

export const metadata = { title: "Sign Up | FrancoLink" };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return <RoleChooser mode="signup" next={next} />;
}
