import { ReadingProvider } from "@/components/ReadingProvider";
import { libraryConfig } from "@/lib/library-config";
import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: libraryConfig.name,
  description: libraryConfig.description
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <ReadingProvider><Navbar />
        <main>{children}</main>
        <Footer /></ReadingProvider>
      </body>
    </html>
  );
}
