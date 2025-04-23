import { fetchWithRetry } from "@/app/lib/fetchWithRetry";
import React from "react";
import { renderToStream } from "@react-pdf/renderer";
import { PayrollReport, PayrollRow } from "@/app/pdf/payrollReport";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const startParam = searchParams.get("start");
  const endParam = searchParams.get("end");
  if (!startParam || !endParam) {
    return new Response("Missing start or end", { status: 400 });
  }

  const startSec = parseInt(startParam, 10);
  const endSec = parseInt(endParam, 10);
  const startIso = new Date(startSec * 1000).toISOString();
  const endIso = new Date(endSec * 1000).toISOString();
  const sql = `SELECT * FROM PayHours
    WHERE date(date_worked,'unixepoch') >= date(${startSec},'unixepoch')
      AND date(date_worked,'unixepoch') <= date(${endSec},'unixepoch')`;
  const host = process.env.NEXT_PUBLIC_GRIST_HOST;
  const apiKey = process.env.API_KEY;
  const docId = process.env.WOODSHOP_DOC;
  const url = `${host}/api/docs/${docId}/sql?q=${encodeURIComponent(sql)}`;

  const res = await fetchWithRetry(url, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) {
    const err = await res.text();
    return new Response(`Grist error: ${err}`, { status: res.status });
  }
  const data = await res.json();
  const rows = data.records?.map((r) => r.fields) || [];
  const pdfStream = await renderToStream(
    <PayrollReport startIso={startIso} endIso={endIso} rows={rows} />
  );

  return new Response(pdfStream, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="payroll_${startIso.slice(0, 10)}_${endIso.slice(0, 10)}.pdf"`,
    },
  });
}
