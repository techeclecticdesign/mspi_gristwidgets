import { NextResponse } from "next/server";
import { env, ensureEnv, fetchAndThrow } from "@/app/lib/api";
import { getGristSqlRecordId } from "@/app/lib/sql";

const { host, apiKey, docId } = env;
const tableId = "Production";

/* Fetches the Production record ID for a given po_number. */
async function findProductionRecordId(po_number) {
  const id = await getGristSqlRecordId("Production", { po_number });
  if (!id) {
    throw new Error("Production record not found");
  }
  return id;
}

async function updateProductionRecord(recordId, fields) {
  const payload = { records: [{ id: recordId, fields }] };
  return sendGristTableRequest({
    host,
    apiKey,
    docId,
    tableId,
    method: "PATCH",
    payload,
  });
}

export async function GET() {
  const envError = ensureEnv();
  if (envError) return envError;
  const gristUrl = `${host}/api/docs/${docId}/tables/Production/records`;

  try {
    const [json] = await fetchAndThrow(
      gristUrl,
      { headers: { Authorization: `Bearer ${apiKey}` } }
    );
    const { records } = json;

    const transformedData = records.reduce(
      (acc, record) => {
        const { po_number, ...rest } = record.fields;
        if (po_number) acc[po_number] = rest;
        return acc;
      },
      {}
    );

    return NextResponse.json(transformedData, {
      headers: {
        'x-nextjs-tags': 'production',
      },
    });
  } catch (error) {
    const status = error.status || 500;
    const message = error.message || "Internal server error";
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(request) {
  const envError = ensureEnv();
  if (envError) return envError;
  try {
    const body = await request.json();
    const { po_number, payable_on_nh_days } = body;

    if (!po_number || payable_on_nh_days === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: po_number and payable_on_nh_days" },
        { status: 400 }
      );
    }
    const recordId = await findProductionRecordId(body.po_number);
    const result = await updateProductionRecord(recordId, {
      payable_on_nh_days: body.payable_on_nh_days,
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
