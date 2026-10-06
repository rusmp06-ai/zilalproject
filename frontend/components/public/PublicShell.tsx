import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { content as t } from "@/data/content";
export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a className="skip-link" href="#main">
        {t.skip}
      </a>
      <div id="top" />
      <Header />
      <main id="main">{children}</main>
      <Footer />
    </>
  );
}
