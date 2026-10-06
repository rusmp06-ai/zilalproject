import { ContentDetail } from "@/components/public/ContentDetail";
import { publicItem } from "@/services/server";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = await publicItem("experiences", slug);
  return {
    title: `${item?.fields.seoTitle || item?.title || "Впечатления"} — ZILAL TRAVEL`,
    description: item?.fields.seoDescription || item?.description,
  };
}
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  await publicItem("experiences", slug);
  return <ContentDetail entity="experiences" slug={slug} />;
}
