import { ContentDetail } from "@/components/public/ContentDetail";
import { publicItem } from "@/services/server";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = await publicItem("destinations", slug);
  return {
    title: `${item?.fields.seoTitle || item?.title || "Направления"} — ZILAL TRAVEL`,
    description: item?.fields.seoDescription || item?.description,
  };
}
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  await publicItem("destinations", slug);
  return <ContentDetail entity="destinations" slug={slug} />;
}
