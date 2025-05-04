import { NextResponse } from "next/server";
import { sendGristTableRequest, groupByField } from "@/app/lib/api";
import { getGristSqlRecords, getGristSqlRecordId } from "@/app/lib/sql";
import { getHttpErrorResponse, HTTPError } from "@/app/lib/errors";

const tableId = "Production";

/* Fetches the Production record ID for a given po_number. */
async function findProductionRecordId(po_number) {
  const id = await getGristSqlRecordId("Production", { filters: { po_number } });
  if (!id) {
    throw new HTTPError("Production record not found", 404);
  }
  return id;
}

async function updateProductionRecord(recordId, fields) {
  const payload = { records: [{ id: recordId, fields }] };
  return sendGristTableRequest({
    tableId,
    method: "PATCH",
    payload,
  });
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const po_number = searchParams.get("ponumber") ?? undefined;
    const product_code = searchParams.get("productcode") ?? undefined;

    const filters = {};
    if (po_number) filters.po_number = [po_number];
    if (product_code) filters.product_code = [product_code];

    const records = await getGristSqlRecords("Production", {
      filters: Object.keys(filters).length > 0 ? filters : undefined,
    });

    if (!records.length) {
      throw new HTTPError("No records matched with provided filters.", 404);
    }
    if (searchParams.toString() === "") {
      return NextResponse.json(records, {
        headers: { "x-nextjs-tags": "production" },
      });
    } else {
      return NextResponse.json(records);
    }
  } catch (err) {
    return getHttpErrorResponse("GET /api/production", err);
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    const { po_number, payable_on_nh_days } = body;
    if (!po_number || payable_on_nh_days === undefined) {
      throw new HTTPError("Missing required fields: po_number and payable_on_nh_days", 400)
    }
    const recordId = await findProductionRecordId(body.po_number);
    const result = await updateProductionRecord(recordId, {
      payable_on_nh_days: body.payable_on_nh_days,
    });
    return NextResponse.json(result);
  } catch (error) {
    return getHttpErrorResponse("PATCH /api/production", error);
  }
}
