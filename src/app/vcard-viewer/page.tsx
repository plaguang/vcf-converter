import React from "react";
import type { Metadata } from "next";
import Landing from "@/components/Landing";

export const metadata: Metadata = {
  title: "Free Online vCard Viewer (.VCF Viewer) – Open & Read VCF Files Locally",
  description:
    "Open, inspect, search, and edit .VCF (vCard) contact files directly in your browser without importing them into your personal address book.",
  alternates: {
    canonical: "/vcard-viewer",
  },
};

export default function VcardViewerPage() {
  return (
    <Landing
      badge="Inspect .VCF Without Importing to Your Phone · 100% Browser Private"
      h1="vCard Viewer Online – Open & Read .VCF Contact Files Locally"
      subtitle="Need to check who is inside a .vcf attachment or phone backup without polluting your own Apple or Google Contacts? Open, search, and edit any .VCF file right in your browser."
      steps={[
        {
          title: "Open Any .VCF or .VCARD File",
          body: "Drop your .vcf file into the viewer. It parses vCard 2.1, 3.0, and 4.0 properties instantaneously.",
        },
        {
          title: "Search by Name, Phone, Email, or Company",
          body: "Use the instant search filter to find specific contacts across hundreds of entries.",
        },
        {
          title: "Edit & Re-Export as VCF or CSV",
          body: "Update any contact field inline and save a clean .vcf or .csv copy.",
        },
      ]}
      faqs={[
        {
          q: "Why use an online vCard viewer instead of double-clicking the .vcf file?",
          a: "Double-clicking a multi-contact .vcf file on macOS or Windows often prompts your OS to import hundreds of contacts directly into your personal address book, or Windows Contacts only shows the very first contact in the file. Our viewer displays all contacts in a searchable table without touching your system contacts.",
        },
        {
          q: "Why does Windows only show 1 contact when I open a multi-contact .VCF file?",
          a: "The default Windows Contacts viewer does not iterate through concatenated BEGIN:VCARD blocks. Opening the file here reveals every contact in the archive.",
        },
        {
          q: "Can I remove unwanted contacts from a .VCF file before importing it?",
          a: "Yes. Click the '✕' button on any row to remove unwanted entries or click 'Remove Duplicate Contacts', then click 'Export Merged .VCF'.",
        },
        {
          q: "Is my .VCF file kept private?",
          a: "100%. Everything runs client-side in your browser memory with zero network uploads.",
        },
      ]}
    />
  );
}
