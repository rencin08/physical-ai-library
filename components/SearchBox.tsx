"use client";

import { ArrowRight, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function SearchBox({ compact = false }: { compact?: boolean }) {
  const [query, setQuery] = useState(""); const router = useRouter();
  function submit(e: FormEvent) { e.preventDefault(); router.push(`/?q=${encodeURIComponent(query)}#papers`); }
  return <form className={`search-box ${compact ? "compact" : ""}`} onSubmit={submit}><Search/><input aria-label="Search papers" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="What are you trying to understand?"/><button aria-label="Explore" type="submit"><span>Explore</span><ArrowRight/></button></form>;
}
