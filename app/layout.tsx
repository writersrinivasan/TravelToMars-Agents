import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Redstone Voyages — Book your trip to Mars",
  description:
    "Agentic AI Mars travel booking. Next.js + LangGraph + RAG, powered by Groq.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
