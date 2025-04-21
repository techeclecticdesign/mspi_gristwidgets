import { NextResponse } from "next/server";
import { sendGristTableRequest } from "@/app/lib/gristRequests";
import { fetchWithRetry } from "@/app/lib/fetchWithRetry";

export async function GET() {
  const host = process.env.HOST;
  const apiKey = process.env.API_KEY;
  const docId = process.env.WOODSHOP_DOC;
  const gristUrl = `${host}/api/docs/${docId}/tables/Production/records`;

  if (!apiKey || !docId) {
    return NextResponse.json(
      { error: "Missing Grist API key or document ID" },
      { status: 500 }
    );
  }

  try {
    const response = await fetchWithRetry(gristUrl, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch Production data" },
        { status: response.status }
      );
    }

    const { records } = await response.json();

    const transformedData = records.reduce(
      (acc, record) => {
        const { po_number, ...rest } = record.fields;
        if (po_number) acc[po_number] = rest;
        return acc;
      },
      {}
    );

    return NextResponse.json(transformedData);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request) {
  const host = process.env.HOST;
  const apiKey = process.env.API_KEY;
  const docId = process.env.WOODSHOP_DOC;
  const tableId = "Production";

  if (!apiKey || !docId) {
    return NextResponse.json(
      { error: "Missing Grist API key or document ID" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { po_number, payable_on_nh_days } = body;

    if (!po_number || payable_on_nh_days === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: po_number and payable_on_nh_days" },
        { status: 400 }
      );
    }

    // Query the Production table for the record with the given po_number.
    const query = `SELECT * FROM Production WHERE po_number = '${po_number}'`;
    const gristQueryUrl = `${host}/api/docs/${docId}/sql?q=${encodeURIComponent(query)}`;
    const findResponse = await fetch(gristQueryUrl, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!findResponse.ok) {
      throw new Error(`Failed to find production record: ${await findResponse.text()}`);
    }

    const findData = await findResponse.json();
    let records = [];
    if (findData.records) {
      records = findData.records;
    } else if (findData.rows && findData.columns) {
      records = findData.rows.map(row => {
        const rec = {};
        findData.columns.forEach((col, i) => {
          rec[col] = row[i];
        });
        return rec;
      });
    }

    if (!records.length) {
      return NextResponse.json({ error: "Production record not found" }, { status: 404 });
    }

    const recordId = records[0].fields.id;
    if (!recordId) {
      throw new Error("Record id not found in the fetched record");
    }

    const updatePayload = {
      records: [
        {
          id: recordId,
          fields: {
            payable_on_nh_days,
          },
        },
      ],
    };
    console.log(updatePayload);
    const updateResponse = await sendGristTableRequest({
      host,
      apiKey,
      docId,
      tableId,
      method: "PATCH",
      payload: updatePayload,
    });

    return NextResponse.json(updateResponse);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
