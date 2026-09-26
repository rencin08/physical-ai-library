"use client";

import Link from "next/link";
import { libraryConfig } from "@/lib/library-config";
import { Bookmark, Menu, Search, X } from "lucide-react";
import { useState } from "react";

export function Navbar() {
  const [open, setOpen] = useState(false);
  return <header className="nav-shell">
    <nav className="nav wrap">
      <Link className="brand" href="/"><span className="brand-mark">{libraryConfig.monogram}</span><span>{libraryConfig.name}</span></Link>
      <div className={`nav-links ${open ? "open" : ""}`} onClick={event => { if ((event.target as HTMLElement).closest("a")) setOpen(false); }}>
        <Link href="/">Bookshelf</Link>
        <Link className="saved-link" href="/saved"><Bookmark size={15}/> Saved</Link>
      </div>
      <div className="nav-actions"><Link aria-label="Search" href="/#library-search"><Search size={18}/></Link><button aria-label="Toggle menu" onClick={() => setOpen(!open)}>{open ? <X/> : <Menu/>}</button></div>
    </nav>
  </header>;
}
