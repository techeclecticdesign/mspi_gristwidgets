import { NextResponse } from "next/server";
import { getGristSqlRecords } from "@/app/lib/sql";
import { getHttpErrorResponse } from "@/app/lib/errors";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    //only getting one response when i should be getting many
    const productcode = searchParams.get("productcode") ?? undefined;
    const filters = {};
    if (productcode) filters.product_code = productcode;
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
