import { NextResponse } from "next/server";
import { groupPayHoursByMdoc, filterAndIndexWorkersByMdoc, fetchAndThrow } from "@/app/lib/api";

export async function GET(request) {
  const origin = new URL(request.url).origin;

  try {
    const [
      payJson,
      workersJson,
      timeclockJson,
      productionJson
    ] = await fetchAndThrow(
      `${origin}/api/payhours`,
      `${origin}/api/workers`,
      `${origin}/api/timeclock`,
      `${origin}/api/production`
    );

    const payHours = groupPayHoursByMdoc(payJson.records);
    const workers = filterAndIndexWorkersByMdoc(workersJson.records);
    const timeclock = timeclockJson.records;
    const production = productionJson;

    return NextResponse.json({ payHours, workers, timeclock, production });
  } catch (err) {
    console.error("Error in /api/payrollData:", err);
    const status = err.status || 500;
    return NextResponse.json(
      { error: err.message || "Internal Server Error" },
      { status }
    );
  }
}
