import { notFound } from "next/navigation";
import { EntityEditor } from "@/components/admin/EntityEditor";
import { entities, type Entity } from "@/types/platform";
export default async function Page({
  params,
}: {
  params: Promise<{ section: string; id: string }>;
}) {
  const { section, id } = await params;
  if (!entities.includes(section as Entity)) notFound();
  return <EntityEditor entity={section as Entity} id={id} />;
}
