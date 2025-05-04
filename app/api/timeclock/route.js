import { NextResponse } from "next/server";
import { env, ensureEnv, fetchAndThrow } from "@/app/lib/api";


export async function GET() {
  const { host, apiKey, docId } = env;
  const envErr = ensureEnv();
  if (envErr) return envErr;

  const today = new Date();
  const sixWeeksAgo = new Date();
  sixWeeksAgo.setDate(today.getDate() - 42);
  const gristUrl = `${host}/api/docs/${docId}/sql?q=${encodeURIComponent(
    `SELECT * FROM TimeclockHours WHERE scan_datetime > ${sixWeeksAgo.getTime() / 1000}`
  )}`;

  try {
    const [data] = await fetchAndThrow(
      gristUrl,
      { headers: { Authorization: `Bearer ${apiKey}` } }
    );
    return NextResponse.json(data, {
      headers: {
        'x-nextjs-tags': 'timeclock',
      },
    });
  } catch (error) {
    const status = error.status || 500;
    const message = error.message || "Internal server error";
    return NextResponse.json({ error: message }, { status });
  }
}
