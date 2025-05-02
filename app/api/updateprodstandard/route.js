import { NextResponse } from "next/server";
import { sendGristTableRequest } from "@/app/lib/api";

export async function PATCH(request) {
  const host = process.env.NEXT_PUBLIC_GRIST_HOST;
  const apiKey = process.env.API_KEY;
  const docId = process.env.WOODSHOP_DOC;
  const tableId = "ProductionStandards";

  if (!apiKey || !docId) {
    return NextResponse.json(
      { error: "Missing Grist API key or document ID" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { product_code, customer_price, production_notes } = body;

    if (!product_code) {
      throw new Error("The product_code field is required.");
    }

    const query = `SELECT * FROM ProductionStandards WHERE product_code = '${product_code}'`;
    const gristQueryUrl = `${host}/api/docs/${docId}/sql?q=${encodeURIComponent(query)}`;

    const findResponse = await fetch(gristQueryUrl, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!findResponse.ok) {
      throw new Error(`Failed to find record: ${await findResponse.text()}`);
    }
    const findData = await findResponse.json();
    const records = findData.records ?? [];
    if (!records.length) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    const recordId = records[0].fields.id;
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
