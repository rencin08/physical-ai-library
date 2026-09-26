import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LearningMap } from "@/components/LearningMap";
import { getCatalogSnapshot } from "@/lib/catalog";

export const dynamic = "force-dynamic";
export const metadata = { title: "Learning roadmap | Physical AI Library" };

export default async function Roadmap() {
  const { papers } = await getCatalogSnapshot();
  return <div className="roadmap-page">
    <div className="wrap roadmap-back"><Link href="/"><ArrowLeft size={15}/> Back to your bookshelf</Link></div>
    <LearningMap papers={papers}/>
  </div>;
}
