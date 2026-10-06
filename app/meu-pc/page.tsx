import { requireChatGPTUser } from "@/app/chatgpt-auth";
import { LabApp, type ViewId } from "@/app/lab-app";
import { catalog } from "@/app/data/catalog";

export const dynamic = "force-dynamic";
const views: ViewId[] = ["my-pc", "builder", "overview", "catalog", "compare", "glossary", "assistant", "prices", "extensions"];

type Params = { view?: string; simulate?: string; slot?: string; import?: string };
export default function MyPcPage({ searchParams }: { searchParams: Promise<Params> }) {
  return <PersonalSpace searchParams={searchParams} />;
}

async function PersonalSpace({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const part = catalog.find(p => p.id === params.simulate);
  const slot = /^\d{1,2}$/.test(params.slot ?? "") ? Number(params.slot) : 0;
  const importing = params.import === "detector";
  const view = part || importing ? "my-pc" : views.includes(params.view as ViewId) ? params.view as ViewId : "my-pc";
  const query = new URLSearchParams();
  if (part) { query.set("simulate", part.id); query.set("slot", String(slot)); }
  else if (importing) query.set("import", "detector");
  else if (view !== "my-pc") query.set("view", view);
  const user = await requireChatGPTUser(`/meu-pc${query.size ? `?${query}` : ""}`);
  return <LabApp user={{ displayName: user.displayName, email: user.email }} initialView={view} initialSimulation={part ? { partId: part.id, slot } : undefined} initialImport={importing} />;
}
