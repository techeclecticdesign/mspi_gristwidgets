import { NextResponse } from "next/server";
import { sendGristTableRequest, sendGristDeleteRequest } from "@/app/lib/gristRequests";
import { fetchWithRetry } from "@/app/lib/fetchWithRetry";

function buildEntry(body) {
  const { mdoc, po_number, date_worked, period, laborsheet_hours, hourly_rate, timeclock_hours } = body;
  const date_entered = Math.floor(Date.now() / 1000);
  const bonus = 0;
  const balanced = false;
  const pie = false;
  if (
    !mdoc ||
    po_number === undefined ||
    !date_worked ||
    !period ||
    laborsheet_hours === undefined ||
    hourly_rate === undefined ||
    timeclock_hours === undefined
  ) {
    throw new Error("Missing one or more required fields");
  }

  return {
    mdoc,
    po_number,
    date_worked,
    date_entered,
    period,
    laborsheet_hours,
    hourly_rate,
    bonus,
    balanced,
    pie,
    timeclock_hours
  };
}

export async function GET(request) {
  const host = process.env.HOST;
  const apiKey = process.env.API_KEY;
  const docId = process.env.WOODSHOP_DOC;

  if (!apiKey || !docId) {
    return NextResponse.json({ error: "Missing Grist API key or document ID" }, { status: 500 });
  }

  const url = new URL(request.url);
  const searchParams = url.searchParams;

  const po_number = searchParams.get("po_number");
  const date_worked = searchParams.get("date_worked");
  const period = searchParams.get("period");

  let query = "SELECT * FROM PayHours WHERE 1=1";

  if (po_number) {
    query += ` AND po_number = '${po_number}'`;
  }
  if (date_worked) {
    query += ` AND date(date_worked, 'unixepoch') = date(${date_worked}, 'unixepoch')`;
  }
  if (period) {
    query += ` AND period = '${period}'`;
  }

  const gristUrl = `${host}/api/docs/${docId}/sql?q=${encodeURIComponent(query)}`;

  try {
    const response = await fetchWithRetry(gristUrl, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch PayHours data" }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


export async function POST(request) {
  const host = process.env.HOST;
  const apiKey = process.env.API_KEY;
  const docId = process.env.WOODSHOP_DOC;
  const tableId = "PayHours";

  if (!apiKey || !docId) {
    return NextResponse.json({ error: "Missing Grist API key or document ID" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const newEntry = buildEntry(body);

    const payload = {
      records: [{ fields: newEntry }],
    };

    const result = await sendGristTableRequest({ host, apiKey, docId, tableId, method: "POST", payload });
    return NextResponse.json(result);
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request) {
  const host = process.env.HOST;
  const apiKey = process.env.API_KEY;
  const docId = process.env.WOODSHOP_DOC;
  const tableId = "PayHours";

  if (!apiKey || !docId) {
    return NextResponse.json(
      { error: "Missing Grist API key or document ID" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();

    if (
      !body.po_number ||
      !body.date_worked ||
      !body.period ||
      body.laborsheet_hours === undefined ||
      body.hourly_rate === undefined ||
      body.timeclock_hours === undefined
    ) {
      throw new Error("Missing one or more required fields");
    }

    const query = `SELECT * FROM PayHours WHERE po_number = '${body.po_number}' AND date(date_worked, 'unixepoch') = date(${body.date_worked}, 'unixepoch') AND period = '${body.period}'`;
    const gristQueryUrl = `${host}/api/docs/${docId}/sql?q=${encodeURIComponent(query)}`;

    const findResponse = await fetch(gristQueryUrl, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!findResponse.ok) {
      throw new Error(`Failed to find record: ${await findResponse.text()}`);
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
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
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
            laborsheet_hours: body.laborsheet_hours,
            hourly_rate: body.hourly_rate,
            timeclock_hours: body.timeclock_hours,
            date_entered: Math.floor(Date.now() / 1000),
          },
        },
      ],
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
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// This global variable holds a promise chain for deletions.
let deletionQueue = Promise.resolve();

export async function DELETE(request) {
  // Chain this deletion to the existing queue.
  const result = await (deletionQueue = deletionQueue.then(async () => {
    // Your deletion logic goes here. For example:
    const host = process.env.HOST;
    const apiKey = process.env.API_KEY;
    const docId = process.env.WOODSHOP_DOC;
    const tableId = "PayHours";

    if (!apiKey || !docId) {
      return NextResponse.json(
        { error: "Missing Grist API key or document ID" },
        { status: 500 }
      );
    }

    try {
      const url = new URL(request.url);
      const searchParams = url.searchParams;
      const po_number = searchParams.get("po_number");
      const date_worked = searchParams.get("date_worked");
      const period = searchParams.get("period");
      if (!po_number || !date_worked || !period) {
        throw new Error("Missing one or more required query parameters: po_number, date_worked, period");
      }

      let query = `SELECT * FROM PayHours WHERE po_number = '${po_number}'`;
      query += ` AND date(date_worked, 'unixepoch') = date(${date_worked}, 'unixepoch')`;
      query += ` AND period = '${period}'`;

      const gristQueryUrl = `${host}/api/docs/${docId}/sql?q=${encodeURIComponent(query)}`;

      const findResponse = await fetch(gristQueryUrl, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      if (!findResponse.ok) {
        throw new Error(`Failed to find record: ${await findResponse.text()}`);
      }

      const findData = await findResponse.json();
      let records = [];
      if (findData.records) {
        records = findData.records;
      } else if (findData.rows && findData.columns) {
        records = findData.rows.map((row) => {
          const rec = {};
          findData.columns.forEach((col, i) => {
            rec[col] = row[i];
          });
          return rec;
        });
      }

      if (!records.length) {
        return NextResponse.json({ error: "Record not found" }, { status: 404 });
      }

      const recordId = records[0].fields.id;
      if (!recordId) {
        throw new Error("Record id not found in the fetched record");
      }

      const payload = [recordId];

      const deleteResponse = await sendGristDeleteRequest({
        host,
        apiKey,
        docId,
        tableId,
        method: "POST",
        payload,
      });

      return NextResponse.json(deleteResponse);
    } catch (error) {
      console.error(error);
      return NextResponse.json(
        { error: error.message || "Internal server error" },
        { status: 500 }
      );
    }
  }));

  return result;
}
