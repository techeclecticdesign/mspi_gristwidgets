import { NextResponse } from "next/server";
import { getGristSqlRecords } from "@/app/lib/sql";
import { getHttpErrorResponse } from "@/app/lib/errors";

export async function GET() {
  try {
    const records = await getGristSqlRecords("Customers");
    return NextResponse.json(records, {
      headers: { "x-nextjs-tags": "customers" }
    });
  }
  catch (err) {
    return getHttpErrorResponse("GET /api/customers", err);
  }
}
