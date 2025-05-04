import { NextResponse } from "next/server";
import { getHttpErrorResponse } from "@/app/lib/errors";
import { getGristSqlRecords } from "@/app/lib/sql";

export async function GET() {
  try {
    const records = await getGristSqlRecords("Workers");
    return NextResponse.json(records);
  } catch (err) {
    return getHttpErrorResponse("GET /api/workers", err);
  }
}
