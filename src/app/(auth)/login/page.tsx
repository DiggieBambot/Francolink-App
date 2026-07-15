import { RoleChooser } from "@/components/auth/role-chooser";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return <RoleChooser mode="login" next={next} />;
}
