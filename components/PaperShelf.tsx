import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Paper } from "@/lib/data";

export function PaperShelf({ title, papers }: { title: string; papers: Paper[] }) {
  return <div className="shelf-row"><div className="shelf-label"><span>Topic</span><h3>{title}</h3><Link href={`/?q=${encodeURIComponent(title)}#papers`}>View topic <ArrowRight size={14}/></Link></div><div className="spines">{papers.slice(0, 6).map((paper, i) => <Link key={paper.slug} href={`/paper/${paper.slug}`} className={`spine ${paper.accent}`} style={{height: `${150 + (i % 3) * 16}px`}}><span>{paper.shortTitle}</span><small>{paper.authors.split(" ")[0]} · {paper.year}</small></Link>)}</div></div>;
}
