import React from "react";
import Link from "next/link";
import VcfWorkspace from "./VcfWorkspace";
import FeedbackBar from "./FeedbackBar";

export interface FAQItem {
  q: string;
  a: string;
}

export interface LandingProps {
  badge: string;
  h1: string;
  subtitle: string;
  steps: { title: string; body: string }[];
  faqs: FAQItem[];
}

const NAV_LINKS = [
  { href: "/", label: "VCF to CSV Converter" },
  { href: "/csv-to-vcf", label: "CSV to VCF (vCard) Converter" },
  { href: "/vcard-viewer", label: "vCard (.VCF) Viewer Online" },
  { href: "/merge-vcf-files", label: "Merge & Split VCF Files" },
];

export default function Landing({ badge, h1, subtitle, steps, faqs }: LandingProps) {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <header className="border-b border-slate-900 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 font-black text-slate-950">
              📇
            </span>
            <div>
              <span className="text-sm font-bold tracking-tight text-white">
                VCardStudio<span className="text-emerald-400">.pro</span>
              </span>
              <span className="block text-[10px] text-slate-400">
                100% Client-Side VCF &amp; CSV Contact Converter, Viewer &amp; Merger
              </span>
            </div>
          </Link>

          <nav className="flex flex-wrap items-center gap-1.5">
            {NAV_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-900 hover:text-emerald-300"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-8 max-w-3xl">
          <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
            {badge}
          </span>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            {h1}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-300 sm:text-base">{subtitle}</p>
        </div>

        <VcfWorkspace />

        <div className="mt-6">
          <FeedbackBar toolName="VCF & CSV Contact Converter" theme="dark" />
        </div>

        <section className="mt-16 border-t border-slate-900 pt-12">
          <h2 className="text-xl font-bold text-white">
            How to Convert, Inspect &amp; Clean .VCF and .CSV Contacts Privately
          </h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-3">
            {steps.map((step, i) => (
              <div
                key={step.title}
                className="rounded-2xl border border-slate-800/90 bg-slate-900/50 p-5"
              >
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-300">
                  {i + 1}
                </span>
                <h3 className="mt-3 text-base font-bold text-white">{step.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-400">{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-14 border-t border-slate-900 pt-12">
          <h2 className="text-xl font-bold text-white">
            Frequently Asked Questions About VCF &amp; vCard Contact Conversion
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {faqs.map((faq) => (
              <div
                key={faq.q}
                className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-5"
              >
                <h3 className="text-sm font-bold text-slate-100">{faq.q}</h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-400">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="mt-16 border-t border-slate-900 bg-slate-950 py-10 text-xs text-slate-500">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 sm:px-6">
          <p>© 2026 VCardStudio.pro — 100% Client-Side VCF to CSV, CSV to VCF &amp; vCard Viewer.</p>
          <div className="flex flex-wrap gap-4">
            {NAV_LINKS.map((item) => (
              <Link key={item.href} href={item.href} className="hover:text-slate-300">
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
