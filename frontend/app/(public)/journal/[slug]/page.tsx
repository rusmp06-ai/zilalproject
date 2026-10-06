import { ContentDetail } from "@/components/public/ContentDetail";
import { seed } from "@/data/platform";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = seed.collections.journal.find((r) => r.slug === slug);
  return {
    title: `${item?.fields.seoTitle || item?.title || "Журнал"} — ZILAL TRAVEL`,
    description: item?.fields.seoDescription || item?.description,
  };
}
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <ContentDetail entity="journal" slug={slug} />;
}
