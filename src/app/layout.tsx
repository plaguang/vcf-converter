import type { Metadata } from "next";
import AnalyticsProvider from "@/components/AnalyticsProvider";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://vcf-converter-three.vercel.app";
const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "G-8764ZP2KQ1";
const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_ID || "yxcpqk8xbw";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Free VCF to CSV & CSV to VCF Converter Online (100% Private vCard Viewer)",
    template: "%s | VCardStudio.pro",
  },
  description:
    "Convert VCF (vCard 2.1, 3.0, 4.0) to CSV for Excel/Google Contacts, or convert CSV spreadsheets to VCF for iPhone/iCloud/Android. 100% client-side with zero server upload.",
  alternates: {
    canonical: "/",
  },
  verification: {
    google: "OzbbXwBKIAGRAIV-NCTTfkOO6b3YAXZjqWxCrmygypM",
  },
  openGraph: {
    title: "VCF to CSV & CSV to VCF Converter Online – 100% Local vCard Studio",
    description:
      "Convert, view, deduplicate, merge, and split .VCF vCard files locally in your browser without uploading private phone numbers.",
    url: SITE_URL,
    siteName: "VCardStudio.pro",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-950 text-slate-100">
        {children}
        <AnalyticsProvider gaId={GA_ID} clarityId={CLARITY_ID} />
      </body>
    </html>
  );
}
