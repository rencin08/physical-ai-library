import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { papers } from "@/lib/data";

export function CollectionCard({ collection, index }: { collection: {slug:string; title:string; curator:string; count:number; description:string}; index:number }) {
  return <Link className="collection-card" href={`/collection/${collection.slug}`}><div className="mini-stack">{papers.slice(index, index + 4).map((p, i) => <i className={p.accent} key={p.slug} style={{transform:`translateX(${i * 18}px) rotate(${i * 2 - 3}deg)`}} />)}</div><div className="collection-kicker">Collection · {collection.count} papers</div><h3>{collection.title}</h3><p>{collection.description}</p><div className="collection-by">Curated by {collection.curator}<ArrowUpRight size={16}/></div></Link>;
}
