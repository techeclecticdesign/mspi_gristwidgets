import { NextResponse } from "next/server";
import { env, ensureEnv, fetchAndThrow } from "@/app/lib/api";

export async function GET() {
  const { host, apiKey, docId } = env;
  const envErr = ensureEnv();
  if (envErr) return envErr;
  const gristUrl = `${host}/api/docs/${docId}/tables/Workers/records`;

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
