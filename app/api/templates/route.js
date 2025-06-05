import { NextResponse } from "next/server";
import { getGristSqlRecords } from "@/app/lib/sql";
import { getHttpErrorResponse } from "@/app/lib/errors";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const stocknumber = searchParams.get("stocknumber") ?? undefined;
    const filters = {};
    if (stocknumber) filters.stocknumber_lookup = stocknumber;
    const records = await getGristSqlRecords("Templates", { filters });
    if (searchParams.toString() === "") {
      return NextResponse.json(records, {
        headers: { "x-nextjs-tags": "templates" }
      });
    } else {
      return NextResponse.json(records);
    }
  }
  catch (err) {
    return getHttpErrorResponse("GET /api/templates", err);
  }
}
