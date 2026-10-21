import React from "react";
import Landing from "@/components/Landing";

export default function HomePage() {
  return (
    <Landing
      badge="100% Local In-Browser · Zero Server Upload · vCard 2.1 / 3.0 / 4.0"
      h1="VCF to CSV Converter Online Free – Convert vCard to Excel Locally"
      subtitle="Convert iPhone iCloud, Android, and Outlook .VCF (vCard) files into clean CSV spreadsheets for Microsoft Excel, Google Contacts, or CRM import. Edit contacts inline, remove duplicates, and export with 100% browser privacy."
      steps={[
        {
          title: "Open One or Multiple .VCF Files",
          body: "Select your .vcf or .vcard backup. Our parser automatically unfolds multi-line fields and decodes Quoted-Printable UTF-8 names.",
        },
        {
          title: "Edit Inline & Remove Duplicate Contacts",
          body: "Click 'Remove Duplicate Contacts' to deduplicate identical phone/email rows, or edit any cell directly in the table.",
        },
        {
          title: "Download Clean .CSV Spreadsheet",
          body: "Click 'Export to .CSV (Excel / Google)' to download an RFC-4180 compliant spreadsheet ready for Excel, Google Sheets, or HubSpot.",
        },
      ]}
      faqs={[
        {
          q: "Are my private phone numbers and email addresses uploaded to any server?",
          a: "Never. Unlike cloud converters that upload your address book to remote servers, VCardStudio.pro processes your .VCF and .CSV files 100% locally inside your web browser.",
        },
        {
          q: "Does this converter support multi-contact iCloud and Android .vcf exports?",
          a: "Yes. Whether your .vcf file contains 1 contact or 5,000 contacts exported from iCloud, Google Contacts, or Samsung Contacts, every BEGIN:VCARD block is parsed into its own row.",
        },
        {
          q: "Why do some vCard 2.1 names look like '=E6=9D=8E' in other tools?",
          a: "Android and older Outlook exports often encode non-ASCII names using Quoted-Printable UTF-8. Our parser automatically detects and decodes Quoted-Printable sequences into clean Unicode text.",
        },
        {
          q: "Can I also convert a CSV spreadsheet back into a .VCF file?",
          a: "Yes! You can open any .CSV file in the same workspace and click 'Export Merged .VCF' to generate an iPhone/Android ready vCard 3.0 or 4.0 file.",
        },
      ]}
    />
  );
}
