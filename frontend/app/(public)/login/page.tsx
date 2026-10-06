import { Login } from "@/components/public/Login";
import { serverMode } from "@/services/server";
import { notFound } from "next/navigation";
export const metadata = {
  title: "Вход — ZILAL TRAVEL",
  robots: { index: false, follow: false },
};
export default function Page() {
  if (!serverMode()) notFound();
  return <Login />;
}
