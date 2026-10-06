import { ContentDetail } from "@/components/public/ContentDetail";
import { publicItem } from "@/services/server";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = await publicItem("journal", slug);
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
  await publicItem("journal", slug);
  return <ContentDetail entity="journal" slug={slug} />;
}
