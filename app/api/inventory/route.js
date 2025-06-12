import { NextResponse } from "next/server";
import { getGristSqlRecords } from "@/app/lib/sql";
import { getHttpErrorResponse } from "@/app/lib/errors";
import { indexByPkField } from "@/app/lib/api";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const hasIndexFlag = searchParams.has("indexByPk");
    const filters = {};
    const data = await getGristSqlRecords("Inventory", { filters });
    let records = data;
    if (hasIndexFlag) {
      const inventory = indexByPkField(data, "stock_number");
      const description = indexByPkField(data, "material_description");
      records = { inventory, description };
    }
    if (searchParams.toString() === "") {
      return NextResponse.json(records, {
        headers: { "x-nextjs-tags": "inventory" }
      });
    } else {
      return NextResponse.json(records);
    }
  } catch (err) {
    return getHttpErrorResponse("GET /api/inventory", err);
  }
}
