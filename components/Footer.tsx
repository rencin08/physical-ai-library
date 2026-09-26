import Link from "next/link";
import { libraryConfig } from "@/lib/library-config";

export function Footer() {
  return <footer className="simple-footer"><div className="wrap"><span>{libraryConfig.name}</span><Link href="/saved">Saved papers</Link><Link href="/submit">Suggest a paper</Link></div></footer>;
}
