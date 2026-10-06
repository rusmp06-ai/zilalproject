import { requireAdmin } from "@/services/server";
import { AdminShell } from "@/components/admin/AdminShell";
export const metadata = {
  title: "Админка — ZILAL TRAVEL",
  robots: { index: false, follow: false },
};
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  return <AdminShell>{children}</AdminShell>;
}
