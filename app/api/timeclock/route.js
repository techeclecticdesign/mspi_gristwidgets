import { NextResponse } from "next/server";
import { fetchWithRetry } from "@/app/lib/fetchWithRetry";

export async function GET() {
  const host = process.env.HOST;
  const apiKey = process.env.API_KEY;
  const docId = process.env.WOODSHOP_DOC;

  if (!apiKey || !docId) {
    return NextResponse.json({ error: "Missing Grist API key or document ID" }, { status: 500 });
  }

  const today = new Date();
  const sixWeeksAgo = new Date();
  sixWeeksAgo.setDate(today.getDate() - 42);
  const gristUrl = `${host}/api/docs/${docId}/sql?q=${encodeURIComponent(
    `SELECT * FROM TimeclockHours WHERE scan_datetime > ${sixWeeksAgo.getTime() / 1000}`
  )}`;

  try {
    const response = await fetchWithRetry(gristUrl, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch PayHours data" }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
