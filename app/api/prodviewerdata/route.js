import { NextResponse } from "next/server";
import {
  filterAndIndexWorkersByMdoc,
  indexByPkField,
  batchFetch
} from "@/app/lib/api";
import { getHttpErrorResponse } from "@/app/lib/errors";

export async function GET(request) {
  const origin = new URL(request.url).origin;

  try {
    const [
      payJson,
      workersJson,
      prodstandardsJson
    ] = await batchFetch(
      `${origin}/api/payhours`,
      `${origin}/api/workers`,
      `${origin}/api/prodstandards`
    );
    const payHours = indexByPkField(payJson, "mdoc");
    const workers = filterAndIndexWorkersByMdoc(workersJson);
    const prodStandards = indexByPkField(prodstandardsJson, "product_code");
    return NextResponse.json({ payHours, workers, prodStandards });
  } catch (err) {
    return getHttpErrorResponse("GET /api/prodviewerdata", err);
  }
}
