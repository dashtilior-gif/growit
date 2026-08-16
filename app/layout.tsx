import type { Metadata, Viewport } from "next";
import "./globals.css";
import PwaRegister from "@/components/PwaRegister";

export const metadata: Metadata = {
  title: "GrowIt — Grow something beautiful from your habits",
  description:
    "A habit tracker where your consistency literally grows a plant. Skip a day and it wilts. Never ignore a habit again.",
  applicationName: "GrowIt",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon.svg",
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "GrowIt — your habits, grown into a living plant",
    description: "Stop breaking promises to yourself. Grow something beautiful instead.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0c1310",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}