import { notFound } from "next/navigation";
import { collections, papers } from "@/lib/data";
import { CollectionReadingList } from "@/components/CollectionReadingList";

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const collection = collections.find(item => item.slug === slug);
  if (!collection) notFound();
  const selected = papers.filter(paper => collection.paperSlugs.includes(paper.slug));
  return <div className="wrap inner-page"><header className="collection-hero"><div className="eyebrow">Curated collection · {selected.length} papers</div><h1>{collection.title}</h1><p>{collection.description} Read in order for a path through the ideas.</p><div className="collection-meta"><span>By {collection.curator}</span></div></header><CollectionReadingList papers={selected}/></div>;
}
