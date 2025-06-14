import { NextResponse } from "next/server";
import { groupByField, filterAndIndexWorkersByMdoc, batchFetch, indexByPkField } from "@/app/lib/api";
import { getHttpErrorResponse } from "@/app/lib/errors";

export async function GET(request) {
  try {
    const origin = new URL(request.url).origin;
    const [
      payJson,
      workersJson,
      timeclockJson,
      productionJson,
      settings
    ] = await batchFetch(
      `${origin}/api/payhours`,
      `${origin}/api/workers`,
      `${origin}/api/timeclock`,
      `${origin}/api/production`,
      `${origin}/api/settings`,
    );
    const payHours = groupByField(payJson, "mdoc");
    const workers = filterAndIndexWorkersByMdoc(workersJson);
    const timeclock = timeclockJson;
    const production = indexByPkField(productionJson, "po_number");

    return NextResponse.json({ payHours, workers, timeclock, production, settings });
  } catch (err) {
    return getHttpErrorResponse("GET /api/payrolldata", err);
  }
}
