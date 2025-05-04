import { NextResponse } from "next/server";
import { getGristSqlRecords } from "@/app/lib/sql";
import { getHttpErrorResponse } from "@/app/lib/errors";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const ponumber = searchParams.get("ponumber") ?? undefined;
    const filters = {};
    if (ponumber) filters.po_number_lookup = ponumber;
    const records = await getGristSqlRecords("ProductionMaterials", { filters });
    if (searchParams.toString() === "") {
      return NextResponse.json(records, {
        headers: { "x-nextjs-tags": "prodmaterials" }
      });
    } else {
      return NextResponse.json(records);
    }
  }
  catch (err) {
    return getHttpErrorResponse("GET /api/prodmaterials", err);
  }
}
