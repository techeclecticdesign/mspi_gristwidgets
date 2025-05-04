import { NextResponse } from "next/server";
import {
  groupPayHoursByMdoc,
  filterAndIndexWorkersByMdoc,
  indexProdStandByCode,
  fetchAndThrow
} from "@/app/lib/api";
import { HTTPError } from "@/app/lib/errors";

export async function GET(request) {
  const origin = new URL(request.url).origin;

  try {
    const [
      payJson,
      workersJson,
      prodstandardsJson
    ] = await fetchAndThrow(
      `${origin}/api/payhours`,
      `${origin}/api/workers`,
      `${origin}/api/prodstandards`
    );

    const payHours = groupPayHoursByMdoc(payJson.records);
    const workers = filterAndIndexWorkersByMdoc(workersJson.records);
    const prodStandards = indexProdStandByCode(prodstandardsJson.records);

    return NextResponse.json({ payHours, workers, prodStandards });

  } catch (err) {
    const status = err instanceof HTTPError ? err.status : 500;
    const message = err instanceof Error ? err.message : "Unexpected error";
    console.error("Error in /api/projectdata:", err);
    return NextResponse.json({ error: message }, { status });
  }
}
