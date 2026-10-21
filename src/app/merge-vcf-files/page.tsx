import React from "react";
import type { Metadata } from "next";
import Landing from "@/components/Landing";

export const metadata: Metadata = {
  title: "Merge VCF Files & Split Multi-Contact vCard Online Free",
  description:
    "Combine multiple .VCF vCard files into one unified file for iCloud/Google Contacts, or split a large .VCF backup into individual .vcf files (.ZIP) locally in your browser.",
  alternates: {
    canonical: "/merge-vcf-files",
  },
};

export default function MergeVcfFilesPage() {
  return (
    <Landing
      badge="Multi-File vCard Merger + 1-Click .VCF Splitter (.ZIP)"
      h1="Merge VCF Files & Split vCard Archives Online"
      subtitle="Select dozens of individual .vcf contact cards to combine them into a single deduplicated vCard file — or split a multi-contact .vcf backup into individual .vcf files inside a clean .ZIP archive."
      steps={[
        {
          title: "Select Multiple .VCF Files at Once",
          body: "Click 'Open .VCF or .CSV Files' and select all the .vcf files you want to combine.",
        },
        {
          title: "Deduplicate Overlapping Contacts",
          body: "Click 'Remove Duplicate Contacts' to automatically strip repeated phone numbers and email addresses.",
        },
        {
          title: "Export Merged .VCF or Split .ZIP",
          body: "Download a single combined .vcf file for 1-click iCloud/Android import, or split them into numbered individual .vcf files.",
        },
      ]}
      faqs={[
        {
          q: "How do I merge multiple .vcf files into one without using command-line scripts?",
          a: "Click the file upload button above, highlight all your .vcf files at once, optionally click 'Remove Duplicate Contacts', and click 'Export Merged .VCF'.",
        },
        {
          q: "Can I merge vCard 2.1 and vCard 3.0 files together?",
          a: "Yes. Our parser normalizes contacts from vCard 2.1, 3.0, and 4.0 and exports them into a clean, uniform vCard 3.0 or 4.0 file.",
        },
        {
          q: "How do I split one big .vcf file into separate .vcf files for each person?",
          a: "Open your multi-contact .vcf file and click 'Split into Individual .VCF (.ZIP)'. You will immediately receive a .ZIP archive containing one .vcf file per contact.",
        },
        {
          q: "Is there a file count limit when merging VCF files?",
          a: "Because all processing happens locally in your browser's RAM, you can merge hundreds of .vcf files in seconds with zero server limits.",
        },
      ]}
    />
  );
}
