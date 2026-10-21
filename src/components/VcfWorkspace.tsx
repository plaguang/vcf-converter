"use client";

import React, { useState, useMemo } from "react";
import { trackEvent } from "@/lib/analytics";

export interface ContactItem {
  id: string;
  fullName: string;
  firstName: string;
  lastName: string;
  organization: string;
  title: string;
  phone: string;
  email: string;
  address: string;
  note: string;
}

// 解码 vCard 2.1 Quoted-Printable UTF-8 序列（例如 =E6=9D=8E=E6=98=8E）
function decodeVcardQuotedPrintable(input: string): string {
  const joined = input.replace(/=\r?\n/g, "");
  const bytes: number[] = [];
  for (let i = 0; i < joined.length; i++) {
    if (joined[i] === "=" && i + 2 < joined.length) {
      const hex = joined.slice(i + 1, i + 3);
      if (/^[0-9A-Fa-f]{2}$/.test(hex)) {
        bytes.push(parseInt(hex, 16));
        i += 2;
        continue;
      }
    }
    bytes.push(joined.charCodeAt(i));
  }
  try {
    return new TextDecoder("utf-8", { fatal: false }).decode(new Uint8Array(bytes));
  } catch {
    return joined;
  }
}

// 反转义 vCard 文本中的 \n, \, , \;
function unescapeVcardValue(val: string, isQp = false): string {
  const raw = isQp ? decodeVcardQuotedPrintable(val) : val;
  return raw
    .replace(/\\n/gi, " ")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\")
    .trim();
}

// 解析单份或多份拼接的 .VCF (vCard 2.1 / 3.0 / 4.0) 文本
export function parseVcfText(text: string): ContactItem[] {
  // 展开 RFC 6350 折行（CRLF 后跟空格或 Tab，以及 Quoted-Printable 软换行）
  const unfolded = text
    .replace(/=\r?\n[ \t]?/g, "=")
    .replace(/\r?\n[ \t]/g, "");

  const blocks = unfolded.split(/BEGIN:VCARD/i).slice(1);
  const contacts: ContactItem[] = [];

  blocks.forEach((rawBlock, idx) => {
    const endIdx = rawBlock.search(/END:VCARD/i);
    const body = endIdx >= 0 ? rawBlock.slice(0, endIdx) : rawBlock;
    const lines = body.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

    let fullName = "";
    let firstName = "";
    let lastName = "";
    let organization = "";
    let title = "";
    let phone = "";
    let email = "";
    let address = "";
    let note = "";

    for (const line of lines) {
      const colonIdx = line.indexOf(":");
      if (colonIdx <= 0) continue;
      const left = line.slice(0, colonIdx);
      const rawVal = line.slice(colonIdx + 1);
      const isQp = /ENCODING=QUOTED-PRINTABLE/i.test(left);
      const propName = left.split(";")[0].replace(/^item\d+\./i, "").toUpperCase();

      if (propName === "FN") {
        fullName = unescapeVcardValue(rawVal, isQp);
      } else if (propName === "N") {
        const parts = rawVal.split(";").map((p) => unescapeVcardValue(p, isQp));
        lastName = parts[0] || "";
        firstName = parts[1] || "";
      } else if (propName === "ORG") {
        organization = unescapeVcardValue(rawVal.replace(/;/g, " - "), isQp);
      } else if (propName === "TITLE") {
        title = unescapeVcardValue(rawVal, isQp);
      } else if (propName === "TEL" && !phone) {
        phone = unescapeVcardValue(rawVal, isQp);
      } else if (propName === "EMAIL" && !email) {
        email = unescapeVcardValue(rawVal, isQp);
      } else if (propName === "ADR" && !address) {
        const adrParts = rawVal
          .split(";")
          .map((p) => unescapeVcardValue(p, isQp))
          .filter(Boolean);
        address = adrParts.join(", ");
      } else if (propName === "NOTE") {
        note = unescapeVcardValue(rawVal, isQp);
      }
    }

    if (!fullName) {
      fullName = [firstName, lastName].filter(Boolean).join(" ") || `Contact #${idx + 1}`;
    }
    if (!firstName && !lastName && fullName) {
      const sp = fullName.split(/\s+/);
      firstName = sp[0] || "";
      lastName = sp.slice(1).join(" ");
    }

    contacts.push({
      id: `c-${idx + 1}`,
      fullName,
      firstName,
      lastName,
      organization,
      title,
      phone,
      email,
      address,
      note,
    });
  });

  return contacts;
}

// 解析 RFC-4180 CSV / TSV 通讯录并自动映射字段
export function parseCsvContacts(text: string): ContactItem[] {
  const rows: string[][] = [];
  let cur = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cur += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === "," || ch === "\t") {
        row.push(cur.trim());
        cur = "";
      } else if (ch === "\n" || ch === "\r") {
        if (ch === "\r" && text[i + 1] === "\n") i++;
        row.push(cur.trim());
        if (row.some((c) => c.length > 0)) rows.push(row);
        row = [];
        cur = "";
      } else {
        cur += ch;
      }
    }
  }
  if (cur.length > 0 || row.length > 0) {
    row.push(cur.trim());
    if (row.some((c) => c.length > 0)) rows.push(row);
  }

  if (rows.length < 2) return [];

  const headers = rows[0].map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ""));
  const findCol = (patterns: string[]) =>
    headers.findIndex((h) => patterns.some((p) => h.includes(p)));

  const idxFn = findCol(["fullname", "name", "displayname", "contact"]);
  const idxFirst = findCol(["firstname", "givenname", "first"]);
  const idxLast = findCol(["lastname", "familyname", "surname", "last"]);
  const idxOrg = findCol(["company", "organization", "org", "business"]);
  const idxTitle = findCol(["title", "jobtitle", "role", "position"]);
  const idxPhone = findCol(["phone", "mobile", "cell", "tel", "number"]);
  const idxEmail = findCol(["email", "mail", "eaddress"]);
  const idxAddr = findCol(["address", "street", "city", "location"]);
  const idxNote = findCol(["note", "notes", "comment"]);

  return rows.slice(1).map((r, i) => {
    const first = idxFirst >= 0 ? r[idxFirst] || "" : "";
    const last = idxLast >= 0 ? r[idxLast] || "" : "";
    let fn = idxFn >= 0 ? r[idxFn] || "" : "";
    if (!fn) fn = [first, last].filter(Boolean).join(" ") || `Contact #${i + 1}`;

    return {
      id: `csv-${i + 1}-${Math.random().toString(36).slice(2, 6)}`,
      fullName: fn,
      firstName: first || fn.split(/\s+/)[0] || "",
      lastName: last || fn.split(/\s+/).slice(1).join(" ") || "",
      organization: idxOrg >= 0 ? r[idxOrg] || "" : "",
      title: idxTitle >= 0 ? r[idxTitle] || "" : "",
      phone: idxPhone >= 0 ? r[idxPhone] || "" : "",
      email: idxEmail >= 0 ? r[idxEmail] || "" : "",
      address: idxAddr >= 0 ? r[idxAddr] || "" : "",
      note: idxNote >= 0 ? r[idxNote] || "" : "",
    };
  });
}

// 序列化联系人数组为标准 vCard 3.0 或 4.0 (.VCF)
export function serializeToVcf(contacts: ContactItem[], version: "3.0" | "4.0" = "3.0"): string {
  const esc = (s: string) =>
    (s || "")
      .replace(/\\/g, "\\\\")
      .replace(/;/g, "\\;")
      .replace(/,/g, "\\,")
      .replace(/\r?\n/g, "\\n");

  return contacts
    .map((c) => {
      const lines = [
        "BEGIN:VCARD",
        `VERSION:${version}`,
        `N:${esc(c.lastName)};${esc(c.firstName)};;;`,
        `FN:${esc(c.fullName)}`,
      ];
      if (c.organization) lines.push(`ORG:${esc(c.organization)}`);
      if (c.title) lines.push(`TITLE:${esc(c.title)}`);
      if (c.phone) lines.push(`TEL;TYPE=CELL,VOICE:${c.phone.trim()}`);
      if (c.email) lines.push(`EMAIL;TYPE=INTERNET,WORK:${c.email.trim()}`);
      if (c.address) lines.push(`ADR;TYPE=WORK:;;${esc(c.address)};;;;`);
      if (c.note) lines.push(`NOTE:${esc(c.note)}`);
      lines.push("END:VCARD");
      return lines.join("\r\n");
    })
    .join("\r\n");
}

// 序列化联系人数组为 Google Contacts / Outlook 兼容的 RFC-4180 CSV
export function serializeToCsv(contacts: ContactItem[]): string {
  const q = (s: string) => `"${(s || "").replace(/"/g, '""')}"`;
  const header = [
    "Full Name",
    "First Name",
    "Last Name",
    "Organization",
    "Job Title",
    "Phone",
    "Email",
    "Address",
    "Notes",
  ].join(",");

  const body = contacts.map((c) =>
    [
      q(c.fullName),
      q(c.firstName),
      q(c.lastName),
      q(c.organization),
      q(c.title),
      q(c.phone),
      q(c.email),
      q(c.address),
      q(c.note),
    ].join(",")
  );
  return [header, ...body].join("\r\n");
}

// 零依赖生成 ZIP 二进制归档（用于一键拆分多联系人 VCF 为独立单人 .vcf 文件包）
function buildZipBytes(files: { name: string; data: Uint8Array }[]): Uint8Array {
  const crcTable = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crcTable[n] = c >>> 0;
  }
  const crc32 = (buf: Uint8Array) => {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };

  const enc = new TextEncoder();
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  for (const f of files) {
    const nameBytes = enc.encode(f.name);
    const crc = crc32(f.data);
    const size = f.data.length;

    const local = new Uint8Array(30 + nameBytes.length + size);
    const ldv = new DataView(local.buffer);
    ldv.setUint32(0, 0x04034b50, true);
    ldv.setUint16(4, 20, true);
    ldv.setUint32(14, crc, true);
    ldv.setUint32(18, size, true);
    ldv.setUint32(22, size, true);
    ldv.setUint16(26, nameBytes.length, true);
    local.set(nameBytes, 30);
    local.set(f.data, 30 + nameBytes.length);
    localParts.push(local);

    const central = new Uint8Array(46 + nameBytes.length);
    const cdv = new DataView(central.buffer);
    cdv.setUint32(0, 0x02014b50, true);
    cdv.setUint16(4, 20, true);
    cdv.setUint16(6, 20, true);
    cdv.setUint32(16, crc, true);
    cdv.setUint32(20, size, true);
    cdv.setUint32(24, size, true);
    cdv.setUint16(28, nameBytes.length, true);
    cdv.setUint32(42, offset, true);
    central.set(nameBytes, 46);
    centralParts.push(central);

    offset += local.length;
  }

  const centralSize = centralParts.reduce((s, p) => s + p.length, 0);
  const eocd = new Uint8Array(22);
  const edv = new DataView(eocd.buffer);
  edv.setUint32(0, 0x06054b50, true);
  edv.setUint16(8, files.length, true);
  edv.setUint16(10, files.length, true);
  edv.setUint32(12, centralSize, true);
  edv.setUint32(16, offset, true);

  const out = new Uint8Array(offset + centralSize + 22);
  let pos = 0;
  for (const p of localParts) {
    out.set(p, pos);
    pos += p.length;
  }
  for (const p of centralParts) {
    out.set(p, pos);
    pos += p.length;
  }
  out.set(eocd, pos);
  return out;
}

const SAMPLE_VCF_DATA = `BEGIN:VCARD
VERSION:3.0
N:Vance;Marcus;;;
FN:Marcus Vance
ORG:Apex Cloud Infrastructure
TITLE:VP of Engineering
TEL;TYPE=CELL,VOICE:+1 (415) 890-4312
EMAIL;TYPE=WORK,INTERNET:marcus.vance@apexcloud.io
ADR;TYPE=WORK:;;548 Market St, Suite 400;San Francisco;CA;94104;USA
NOTE:Primary technical contact for Q4 enterprise deployment.
END:VCARD
BEGIN:VCARD
VERSION:2.1
N;CHARSET=UTF-8;ENCODING=QUOTED-PRINTABLE:Lin;Sophia;;;
FN;CHARSET=UTF-8;ENCODING=QUOTED-PRINTABLE:Sophia=20Lin
ORG:Pacific Venture Partners
TITLE:Managing Partner
TEL;CELL:+1 (650) 442-9810
EMAIL;PREF;INTERNET:sophia@pacificvp.vc
ADR;WORK:;;2800 Sand Hill Rd;Menlo Park;CA;94025;USA
NOTE:Series A board observer.
END:VCARD
BEGIN:VCARD
VERSION:3.0
N:Sterling;Elena;;;
FN:Elena Sterling
ORG:Sterling Legal Group LLP
TITLE:Senior IP Counsel
TEL;TYPE=WORK:+1 (212) 555-0194
EMAIL;TYPE=WORK:elena@sterlinglegal.com
ADR;TYPE=WORK:;;350 Fifth Ave;New York;NY;10118;USA
NOTE:Handles trademark and patent filings.
END:VCARD
BEGIN:VCARD
VERSION:3.0
N:Vance;Marcus;;;
FN:Marcus Vance (Duplicate)
ORG:Apex Cloud Infrastructure
TITLE:VP of Engineering
TEL;TYPE=CELL,VOICE:+1 (415) 890-4312
EMAIL;TYPE=WORK,INTERNET:marcus.vance@apexcloud.io
ADR;TYPE=WORK:;;548 Market St, Suite 400;San Francisco;CA;94104;USA
NOTE:Duplicate entry from iCloud sync for testing deduplication.
END:VCARD`;

export default function VcfWorkspace() {
  const [contacts, setContacts] = useState<ContactItem[]>(() =>
    parseVcfText(SAMPLE_VCF_DATA)
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [vcfVersion, setVcfVersion] = useState<"3.0" | "4.0">("3.0");
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  const filteredContacts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter(
      (c) =>
        c.fullName.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.organization.toLowerCase().includes(q)
    );
  }, [contacts, searchQuery]);

  async function handleFileUpload(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    let merged: ContactItem[] = [];

    for (const file of files) {
      const text = await file.text();
      if (/BEGIN:VCARD/i.test(text) || /\.vcf|\.vcard$/i.test(file.name)) {
        merged = merged.concat(parseVcfText(text));
      } else {
        merged = merged.concat(parseCsvContacts(text));
      }
    }

    if (merged.length > 0) {
      setContacts(merged);
      setStatusBanner(
        `Loaded ${merged.length} contact(s) from ${files.length} file(s) locally in browser.`
      );
      trackEvent("vcf_files_loaded", { files: files.length, contacts: merged.length });
    }
  }

  function handleLoadSample() {
    const parsed = parseVcfText(SAMPLE_VCF_DATA);
    setContacts(parsed);
    setStatusBanner(
      `Loaded Sample iCloud & Android vCard Archive (${parsed.length} contacts including 1 duplicate)!`
    );
    trackEvent("vcf_sample_loaded");
  }

  function handleDeduplicate() {
    const seen = new Set<string>();
    const unique: ContactItem[] = [];
    let removed = 0;

    for (const c of contacts) {
      const normPhone = c.phone.replace(/\D+/g, "");
      const normEmail = c.email.trim().toLowerCase();
      const key = `${normEmail}|${normPhone}`;
      if ((normEmail || normPhone) && seen.has(key)) {
        removed++;
      } else {
        if (normEmail || normPhone) seen.add(key);
        unique.push(c);
      }
    }

    setContacts(unique);
    setStatusBanner(
      `Deduplicated contacts: removed ${removed} duplicate entry(s), ${unique.length} unique contacts remaining.`
    );
    trackEvent("vcf_deduplicated", { removed });
  }

  function handleAddContactRow() {
    setContacts((prev) => [
      ...prev,
      {
        id: `manual-${prev.length + 1}-${Math.random().toString(36).slice(2, 6)}`,
        fullName: "New Contact",
        firstName: "New",
        lastName: "Contact",
        organization: "Company Inc.",
        title: "Account Executive",
        phone: "+1 (555) 234-5678",
        email: "contact@example.com",
        address: "100 Main St, Austin, TX",
        note: "",
      },
    ]);
  }

  function handleUpdateField(id: string, field: keyof ContactItem, value: string) {
    setContacts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  }

  function handleDeleteContact(id: string) {
    if (contacts.length <= 1) return;
    setContacts((prev) => prev.filter((c) => c.id !== id));
  }

  function handleExportCsv() {
    const csvStr = serializeToCsv(filteredContacts);
    const blob = new Blob([csvStr], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `contacts-${filteredContacts.length}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 3000);
    setStatusBanner(`Exported ${filteredContacts.length} contact(s) to CSV for Excel / Google Contacts!`);
    trackEvent("vcf_export_csv", { count: filteredContacts.length });
  }

  function handleExportVcf() {
    const vcfStr = serializeToVcf(filteredContacts, vcfVersion);
    const blob = new Blob([vcfStr], { type: "text/vcard;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `contacts-v${vcfVersion}-${filteredContacts.length}.vcf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 3000);
    setStatusBanner(
      `Exported ${filteredContacts.length} contact(s) to merged vCard ${vcfVersion} (.vcf)!`
    );
    trackEvent("vcf_export_vcf", { count: filteredContacts.length, version: vcfVersion });
  }

  function handleSplitVcfZip() {
    const enc = new TextEncoder();
    const entries = filteredContacts.map((c, idx) => {
      const singleVcf = serializeToVcf([c], vcfVersion);
      const safeName =
        c.fullName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "") || `contact-${idx + 1}`;
      return {
        name: `${String(idx + 1).padStart(3, "0")}-${safeName}.vcf`,
        data: enc.encode(singleVcf),
      };
    });
    const zipBytes = buildZipBytes(entries);
    const blob = new Blob([zipBytes as unknown as BlobPart], { type: "application/zip" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `split-vcards-${entries.length}-files.zip`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 3000);
    setStatusBanner(
      `Split ${entries.length} contacts into individual .vcf files inside split-vcards-${entries.length}-files.zip!`
    );
    trackEvent("vcf_split_zip", { count: entries.length });
  }

  return (
    <div className="space-y-5">
      {/* 顶部工具栏：上传、预设、去重与多格式导出 */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/90 p-4 shadow-lg">
        <div className="flex flex-wrap items-center gap-2.5">
          <label className="cursor-pointer rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 shadow-md shadow-emerald-500/20 transition hover:bg-emerald-400">
            📂 Open .VCF or .CSV Files (Multi-File Merge Supported)
            <input
              data-testid="vcf-file-input"
              type="file"
              multiple
              accept=".vcf,.vcard,.csv,.tsv,text/vcard,text/csv"
              className="hidden"
              onChange={(e) => handleFileUpload(e.target.files)}
            />
          </label>

          <button
            type="button"
            data-testid="load-sample-vcf"
            onClick={handleLoadSample}
            className="rounded-xl bg-indigo-500/15 px-3.5 py-2 text-xs font-semibold text-indigo-300 ring-1 ring-indigo-500/40 transition hover:bg-indigo-500/25"
          >
            ✨ Load Sample vCard + Duplicate Contacts
          </button>

          <button
            type="button"
            data-testid="deduplicate-btn"
            onClick={handleDeduplicate}
            className="rounded-xl border border-amber-500/40 bg-amber-500/15 px-3.5 py-2 text-xs font-semibold text-amber-300 transition hover:bg-amber-500/25"
          >
            🧹 Remove Duplicate Contacts
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            data-testid="export-csv-btn"
            onClick={handleExportCsv}
            className="rounded-xl bg-emerald-500 px-3.5 py-2 text-xs font-bold text-slate-950 shadow transition hover:bg-emerald-400"
          >
            ⬇ Export to .CSV (Excel / Google)
          </button>

          <div className="flex items-center rounded-xl border border-slate-700 bg-slate-950 p-0.5">
            <select
              aria-label="vCard Version"
              value={vcfVersion}
              onChange={(e) => setVcfVersion(e.target.value as "3.0" | "4.0")}
              className="bg-transparent px-2.5 py-1.5 text-xs font-medium text-slate-300"
            >
              <option value="3.0">vCard 3.0 (iCloud/Android)</option>
              <option value="4.0">vCard 4.0 (RFC 6350)</option>
            </select>
            <button
              type="button"
              data-testid="export-vcf-btn"
              onClick={handleExportVcf}
              className="rounded-lg bg-indigo-500 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-indigo-400"
            >
              ⬇ Export Merged .VCF
            </button>
          </div>

          <button
            type="button"
            data-testid="split-vcf-zip-btn"
            onClick={handleSplitVcfZip}
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-slate-800"
          >
            📦 Split into Individual .VCF (.ZIP)
          </button>
        </div>
      </div>

      {statusBanner && (
        <div
          data-testid="vcf-status-banner"
          className="rounded-xl border border-emerald-500/40 bg-emerald-950/50 px-4 py-2.5 text-xs font-medium text-emerald-200"
        >
          ✓ {statusBanner}
        </div>
      )}

      {/* 联系人交互式搜索与在线表格编辑器 */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/75 p-5 shadow-xl">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              Interactive vCard / CSV Address Book
            </h2>
            <span
              data-testid="contact-count-badge"
              className="rounded-full bg-emerald-500/15 px-3 py-0.5 font-mono text-xs font-bold text-emerald-300"
            >
              {filteredContacts.length} / {contacts.length} contacts
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <input
              data-testid="contact-search-input"
              type="search"
              placeholder="Search name, phone, email, or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-1.5 text-xs text-slate-100 placeholder:text-slate-500"
            />
            <button
              type="button"
              data-testid="add-contact-btn"
              onClick={handleAddContactRow}
              className="rounded-xl bg-slate-800 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-slate-700"
            >
              + Add Contact Row
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
                <th className="py-2.5 pr-3">Full Name</th>
                <th className="py-2.5 pr-3">Phone / Mobile</th>
                <th className="py-2.5 pr-3">Email Address</th>
                <th className="py-2.5 pr-3">Organization</th>
                <th className="py-2.5 pr-3">Job Title</th>
                <th className="py-2.5 pr-3">Street Address</th>
                <th className="py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {filteredContacts.map((c, idx) => (
                <tr key={c.id} data-testid={`contact-row-${idx}`} className="hover:bg-slate-950/40">
                  <td className="py-2 pr-2">
                    <input
                      type="text"
                      aria-label={`Contact ${idx + 1} Full Name`}
                      value={c.fullName}
                      onChange={(e) => handleUpdateField(c.id, "fullName", e.target.value)}
                      className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 font-semibold text-white"
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <input
                      type="text"
                      aria-label={`Contact ${idx + 1} Phone`}
                      value={c.phone}
                      onChange={(e) => handleUpdateField(c.id, "phone", e.target.value)}
                      className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 font-mono text-emerald-300"
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <input
                      type="text"
                      aria-label={`Contact ${idx + 1} Email`}
                      value={c.email}
                      onChange={(e) => handleUpdateField(c.id, "email", e.target.value)}
                      className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-slate-200"
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <input
                      type="text"
                      aria-label={`Contact ${idx + 1} Organization`}
                      value={c.organization}
                      onChange={(e) => handleUpdateField(c.id, "organization", e.target.value)}
                      className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-slate-300"
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <input
                      type="text"
                      aria-label={`Contact ${idx + 1} Title`}
                      value={c.title}
                      onChange={(e) => handleUpdateField(c.id, "title", e.target.value)}
                      className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-slate-300"
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <input
                      type="text"
                      aria-label={`Contact ${idx + 1} Address`}
                      value={c.address}
                      onChange={(e) => handleUpdateField(c.id, "address", e.target.value)}
                      className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-slate-400"
                    />
                  </td>
                  <td className="py-2 text-right">
                    {contacts.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteContact(c.id)}
                        className="rounded-lg px-2 py-1 text-slate-500 hover:bg-rose-950/60 hover:text-rose-300"
                      >
                        ✕
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
