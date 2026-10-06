import { PublicShell } from "@/components/public/PublicShell";
export default function Layout({ children }: { children: React.ReactNode }) {
  return <PublicShell>{children}</PublicShell>;
}
