import { PublicExplore } from "@/app/public-explore";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: { searchParams: Promise<{ compare?: string }> }) {
  const params = await searchParams;
  return <PublicExplore initialCompareId={params?.compare} />;
}
