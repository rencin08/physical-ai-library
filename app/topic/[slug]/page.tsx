import { PaperCard } from "@/components/PaperCard";
import { getCatalog } from "@/lib/catalog";

export const dynamic = "force-dynamic";
export default async function TopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const name = slug.split("-").map(word => word[0]?.toUpperCase() + word.slice(1)).join(" ");
  const papers = (await getCatalog()).filter(paper => paper.topics.some(topic => topic.toLowerCase().replace(/[^a-z0-9]+/g, "-") === slug));
  return <div className="wrap inner-page"><div className="page-intro"><div className="eyebrow">Topic archive · {papers.length} papers</div><h1>{name}</h1><p>Follow this idea through the literature.</p></div><div className="paper-grid explore-grid">{papers.map((paper, index) => <PaperCard paper={paper} index={index} key={paper.slug}/>)}</div>{!papers.length && <p>No papers in this topic yet.</p>}</div>;
}
