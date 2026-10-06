import { requireAdmin, serverMode } from "@/services/server";
import { notFound } from "next/navigation";
import { Settings } from "@/components/admin/Settings";
export default async function Page() {
  const auth = await requireAdmin();
  if (serverMode() && auth?.user.role === "content_manager") notFound();
  return <Settings />;
}
