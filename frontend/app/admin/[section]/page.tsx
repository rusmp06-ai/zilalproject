import { notFound } from "next/navigation";
import { EntityList } from "@/components/admin/EntityList";
import { entities, type Entity } from "@/types/platform";
export default async function Page({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  if (!entities.includes(section as Entity)) notFound();
  return <EntityList entity={section as Entity} />;
}
