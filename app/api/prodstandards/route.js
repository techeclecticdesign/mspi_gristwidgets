import { NextResponse } from "next/server";
import { fetchWithRetry } from "@/app/lib/api";

export async function GET() {
  const host = process.env.NEXT_PUBLIC_GRIST_HOST
  const apiKey = process.env.API_KEY;
  const docId = process.env.WOODSHOP_DOC;
  const gristUrl = `${host}/api/docs/${docId}/tables/ProductionStandards/records`;

  if (!apiKey || !docId) {
    return NextResponse.json({ error: "Missing Grist API key or document ID" }, { status: 500 });
  }

  try {
    const response = await fetchWithRetry(gristUrl, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch ProductionStandards data" }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
