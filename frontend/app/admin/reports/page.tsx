import { serverMode } from "@/services/server";
import { notFound } from "next/navigation";
import { Dashboard } from "@/components/admin/Dashboard";
export default function Page() {
  if (serverMode()) notFound();
  return <Dashboard reports />;
}
