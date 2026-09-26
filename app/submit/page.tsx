import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function Submit() {
  return <div className="wrap inner-page min-page"><div className="page-intro"><div className="eyebrow">The growing archive</div><h1>More to <em>discover.</em></h1><p>Community paper recommendations are not connected yet. For now, explore the library and save the papers you want to return to.</p></div><Link className="primary-link" href="/">Explore papers <ArrowRight size={15}/></Link></div>;
}
