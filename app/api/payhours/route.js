import { NextResponse } from "next/server";
import { revalidateTag } from 'next/cache';
import { env, ensureEnv, sendGristTableRequest, sendGristDeleteRequest } from "@/app/lib/api";
import { getGristSqlRecords, getGristSqlRecordId } from "@/app/lib/sql";

const { host, apiKey, docId } = env;
const tableId = 'PayHours';

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

function validateBody(body) {
  const missing = [];
  if (!body.po_number) missing.push('po_number');
  if (body.date_worked === undefined) missing.push('date_worked');
  if (!body.period) missing.push('period');
  ['laborsheet_hours', 'hourly_rate', 'timeclock_hours']
    .forEach(f => body[f] === undefined && missing.push(f));
  if (missing.length) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }
}

export async function GET(request) {
  const envErr = ensureEnv();
  if (envErr) return envErr;

  const { searchParams } = new URL(request.url);
  const filters = {
    po_number: searchParams.get("po_number") ?? undefined,
    date_worked: searchParams.get("date_worked") ?? undefined,
    period: searchParams.get("period") ?? undefined,
  };

  try {
    const records = await getGristSqlRecords(tableId, { filters });
    return NextResponse.json({ records }, {
      headers: {
        'x-nextjs-tags': 'payhours'
      }
    });
  } catch (error) {
    console.error("GET /api/payhours error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const envErr = ensureEnv();
  if (envErr) return envErr;

  try {
    const body = await request.json();
    const newEntry = buildEntry(body);

    const payload = {
      records: [{ fields: newEntry }],
    };

    const result = await sendGristTableRequest({ host, apiKey, docId, tableId, method: "POST", payload });
    revalidateTag('payhours');
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

async function updateRecord(recordId, body) {
  const payload = {
    records: [{
      id: recordId,
      fields: {
        laborsheet_hours: body.laborsheet_hours,
        hourly_rate: body.hourly_rate,
        timeclock_hours: body.timeclock_hours,
        date_entered: Math.floor(Date.now() / 1000),
      }
    }]
  };
  return sendGristTableRequest({
    host, apiKey, docId, tableId,
    method: 'PATCH', payload, recordId: ''
  });
}

async function deleteRecord(recordId) {
  return sendGristDeleteRequest({ host, apiKey, docId, tableId, method: "POST", payload: [recordId] });
}

export async function PUT(request) {

  try {
    const body = await request.json();
    validateBody(body);

    const id = await getGristSqlRecordId(tableId, {
      filters: {
        po_number: body.po_number,
        date_worked: body.date_worked,
        period: body.period,
      }
    });
    const result = await updateRecord(id, body);
    revalidateTag('payhours');
    return NextResponse.json(result);
  }
  catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

let deletionQueue = Promise.resolve();

export async function DELETE(request) {
  return (deletionQueue = deletionQueue.then(async () => {
    const envErr = ensureEnv();
    if (envErr) return envErr;
    const { searchParams } = new URL(request.url);
    const po_number = searchParams.get("po_number") || "";
    const date_worked = searchParams.get("date_worked") || "";
    const period = searchParams.get("period") || "";
    if (!po_number || !date_worked || !period) {
      return NextResponse.json(
        { error: "Missing required query params: po_number, date_worked, period" },
        { status: 400 }
      );
    }
    try {
      const id = await getGristSqlRecordId(tableId, { filters: { po_number, date_worked, period } });
      const result = await deleteRecord(id);
      revalidateTag('payhours');
      return NextResponse.json(result);
    } catch (error) {
      console.error(error);
      return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
    }
  }));
}
