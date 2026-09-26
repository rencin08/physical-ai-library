import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { InteractiveLibrary } from "@/components/InteractiveLibrary";
import { getCatalogSnapshot } from "@/lib/catalog";

export const dynamic = "force-dynamic";
export default async function Home({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q : "";
  const snapshot = await getCatalogSnapshot();
  const catalog = snapshot.papers;
  return <>
    <section className="immersive-hero bookshelf-first">
      <div className="ambient-orb orb-one"/><div className="ambient-orb orb-two"/>
      <div className="wrap shelf-intro"><div><p className="reading-room-eyebrow">Your reading room</p><h1>Welcome to your reading room.</h1><p className="reading-room-note">A little reading. A new way to see what robots can do.</p></div><Link className="reading-map-link" href="/roadmap">Learning roadmap <ArrowRight size={16}/></Link></div>
      <InteractiveLibrary key={query} livePapers={catalog} initialQuery={query}/>
    </section>
  </>;
}
