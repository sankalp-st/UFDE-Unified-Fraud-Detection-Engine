import "./globals.css";
import type { Metadata } from "next";
import Nav from "@/components/Nav";
import { StreamProvider } from "@/lib/stream";

export const metadata: Metadata = {
  title: "UFDE: Fraud Command Center",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans antialiased">
        <StreamProvider>
          <Nav />
          <main className="mx-auto max-w-[1400px] p-4">{children}</main>
        </StreamProvider>
      </body>
    </html>
  );
}