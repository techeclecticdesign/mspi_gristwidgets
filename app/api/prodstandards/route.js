import { NextResponse } from "next/server";
import { revalidateTag } from 'next/cache';
import { env, ensureEnv, sendGristTableRequest, fetchAndThrow } from "@/app/lib/api";
import { getGristSqlRecordId } from "@/app/lib/sql";

export async function GET() {
  const { host, apiKey, docId } = env;
  const envErr = ensureEnv();
  if (envErr) return envErr;

  const gristUrl = `${host}/api/docs/${docId}/tables/ProductionStandards/records`;

  try {
    const [data] = await fetchAndThrow(
      gristUrl,
      { headers: { Authorization: `Bearer ${apiKey}` } }
    );
    return NextResponse.json(data, {
      headers: {
        'x-nextjs-tags': 'prodstandards',
      },
    });
  } catch (error) {
    const status = error.status || 500;
    const message = error.message || "Internal server error";
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(request) {
  const { host, apiKey, docId } = env;
  const tableId = "ProductionStandards";
  const envErr = ensureEnv();
  if (envErr) return envErr;

  try {
    const body = await request.json();
    const { product_code, customer_price, production_notes } = body;

    if (!product_code) {
      throw new Error("The product_code field is required.");
    }

    const recordId = await getGristSqlRecordId(tableId, { product_code: body.product_code });
    if (recordId == null) {
      throw new Error("Record id not found in fetched record");
    }

    const fieldsToUpdate = {};
    if (customer_price != null) {
      fieldsToUpdate.customer_price = customer_price;
    }
    if (production_notes != null) {
      fieldsToUpdate.production_notes = production_notes;
    }
    if (!Object.keys(fieldsToUpdate).length) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }
    const updatePayload = {
      records: [{ id: recordId, fields: fieldsToUpdate }],
    };

    const updateResponse = await sendGristTableRequest({
      host,
      apiKey,
      docId,
      tableId,
      method: "PATCH",
      payload: updatePayload,
      recordId: "",
    });
    revalidateTag('payhours');
    return NextResponse.json(updateResponse);
  }
  catch (err) {
    console.error("Error in updateprodstandard:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
