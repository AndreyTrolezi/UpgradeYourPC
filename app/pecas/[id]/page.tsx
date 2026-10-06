import { notFound } from "next/navigation";
import { catalog } from "@/app/data/catalog";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { PartDetail } from "@/app/part-detail";

export const dynamic = "force-dynamic";
export default function PiecePage({ params }: { params: Promise<{ id: string }> }) { return <PieceContent params={params} />; }
async function PieceContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const part = catalog.find(p => p.id === id);
  if (!part) notFound();
  const user = await getChatGPTUser();
  return <PartDetail part={part} signedIn={!!user} />;
}
