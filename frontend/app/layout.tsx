import type { Metadata } from "next";
import "@fontsource/cormorant-garamond/cyrillic-400.css";
import "@fontsource/cormorant-garamond/latin-400.css";
import "@fontsource/cormorant-garamond/cyrillic-500.css";
import "@fontsource/cormorant-garamond/latin-500.css";
import "@fontsource/manrope/cyrillic-400.css";
import "@fontsource/manrope/latin-400.css";
import "@fontsource/manrope/cyrillic-600.css";
import "@fontsource/manrope/latin-600.css";
import "./globals.css";
import { PlatformProvider } from "@/components/providers/PlatformProvider";
import { publicData, serverMode } from "@/services/server";
import { content as t } from "@/data/content";
export async function generateMetadata(): Promise<Metadata> {
  const data = await publicData();
  return {
    title: `${data.settings.company} — ${t.brandCaption}`,
    description: data.settings.heroDescription,
    robots: { index: false, follow: false },
  };
}
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initial = serverMode() ? await publicData() : undefined;
  return (
    <html lang="ru">
      <body>
        <PlatformProvider initial={initial} server={serverMode()}>
          {children}
        </PlatformProvider>
      </body>
    </html>
  );
}
