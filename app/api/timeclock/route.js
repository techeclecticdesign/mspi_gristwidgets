import { NextResponse } from "next/server";
import { env, ensureEnv, fetchWithRetry, unwrapGristRecords } from "@/app/lib/api";
import { getHttpErrorResponse } from "@/app/lib/errors";

export async function GET() {
  try {
    ensureEnv();
    const { host, apiKey, docId } = env;
    const today = new Date();
    const sixWeeksAgo = new Date();
    sixWeeksAgo.setDate(today.getDate() - 42);
    const gristUrl = `${host}/api/docs/${docId}/sql?q=${encodeURIComponent(
      `SELECT * FROM TimeclockHours WHERE scan_datetime > ${sixWeeksAgo.getTime() / 1000}`
    )}`;
    const data = await fetchWithRetry(
      gristUrl,
      { headers: { Authorization: `Bearer ${apiKey}` } }
    );
    return NextResponse.json(unwrapGristRecords(data));
  } catch (error) {
    return getHttpErrorResponse("GET /api/timeclock", error);
  }
}
