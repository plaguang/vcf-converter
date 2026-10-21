import React from "react";
import type { Metadata } from "next";
import Landing from "@/components/Landing";

export const metadata: Metadata = {
  title: "CSV to VCF Converter Online Free – Excel Spreadsheet to vCard (3.0 & 4.0)",
  description:
    "Convert CSV and Excel contact lists to .VCF (vCard 3.0 / 4.0) for iPhone iCloud, Android Contacts, and Apple Contacts. Automatic column mapping and 100% local privacy.",
  alternates: {
    canonical: "/csv-to-vcf",
  },
};

export default function CsvToVcfPage() {
  return (
    <Landing
      badge="iCloud, iPhone & Android Compatible · Auto Column Mapping"
      h1="CSV to VCF Converter Online – Convert Excel Contacts to vCard"
      subtitle="Turn any CSV contact list from Excel, Google Sheets, or your CRM into a standard vCard 3.0 or 4.0 (.vcf) file that imports cleanly into iPhone/iCloud, Android, and Apple Contacts."
      steps={[
        {
          title: "Upload Your .CSV Contact List",
          body: "Select your CSV file. Our smart mapper automatically detects Full Name, First/Last Name, Phone, Email, Company, Job Title, and Address columns.",
        },
        {
          title: "Verify & Clean Up Entries",
          body: "Preview all mapped rows in the live address book editor, fix any formatting typos, and deduplicate repeated numbers.",
        },
        {
          title: "Export Merged .VCF or Individual vCards",
          body: "Choose vCard 3.0 (best for iCloud & Android) or vCard 4.0 and download a single multi-contact .vcf file or a .ZIP of individual .vcf files.",
        },
      ]}
      faqs={[
        {
          q: "Which vCard version should I choose for iPhone and iCloud Contacts?",
          a: "Select 'vCard 3.0 (iCloud/Android)'. Apple iCloud and iOS Contacts require vCard 3.0 or 4.0 and reject legacy vCard 2.1 files.",
        },
        {
          q: "How should my CSV columns be named before converting to VCF?",
          a: "Our auto-mapper recognizes common headers automatically, including Name, Full Name, First Name, Last Name, Phone, Mobile, Email, Company, Organization, Title, and Address.",
        },
        {
          q: "Can I import a single merged .VCF file with hundreds of contacts into Android or iCloud?",
          a: "Yes. Both Google Contacts and Apple iCloud allow you to upload a single multi-contact .vcf file to import all contacts in one step.",
        },
        {
          q: "What if my device requires one .vcf file per contact?",
          a: "Click 'Split into Individual .VCF (.ZIP)' in the toolbar to package each row as a separate .vcf file inside a single downloadable ZIP archive.",
        },
      ]}
    />
  );
}
