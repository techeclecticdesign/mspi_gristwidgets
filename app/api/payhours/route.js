import { NextResponse } from "next/server";
import { revalidateTag } from 'next/cache';
import { sendGristTableRequest, sendGristDeleteRequest } from "@/app/lib/api";
import { getGristSqlRecords, getGristSqlRecordId } from "@/app/lib/sql";
import { getHttpErrorResponse, HTTPError } from "@/app/lib/errors";

const tableId = 'PayHours';
let deletionQueue = Promise.resolve();

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
    throw new HTTPError("Missing one or more required fields", 400);
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
    throw new HTTPError(`Missing required fields: ${missing.join(', ')}`, 400);
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const po_number = searchParams.get("ponumber") ?? undefined;
    const date_worked = searchParams.get("dateworked") ?? undefined;
    const period = searchParams.get("period") ?? undefined;
    const mdoc = searchParams.get("mdoc") ?? undefined;

    const filters = {};
    if (po_number) filters.po_number = po_number;
    if (date_worked) filters.date_worked = date_worked;
    if (period) filters.period = period;
    if (mdoc) filters.mdoc = mdoc;
    const records = await getGristSqlRecords(tableId, { filters });
    if (searchParams.toString() === "") {
      return NextResponse.json(records, {
        headers: {
          'x-nextjs-tags': 'payhours'
        }
      });
    } else {
      return NextResponse.json(records);
    }
  } catch (err) {
    return getHttpErrorResponse("GET /api/payhours", err);
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const newEntry = buildEntry(body);
    const payload = {
      records: [{ fields: newEntry }],
    };

    const result = await sendGristTableRequest({ tableId, method: "POST", payload });
    revalidateTag('payhours');
    return NextResponse.json(result);
  } catch (error) {
    return getHttpErrorResponse("POST /api/payhours", error);
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
  return sendGristTableRequest({ tableId, method: 'PATCH', payload, recordId: '' });
}

async function deleteRecord(recordId) {
  return sendGristDeleteRequest({ tableId, payload: [recordId] });
}

export async function PATCH(request) {
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
    return getHttpErrorResponse("PATCH /api/payhours", error);
  }
}

export async function DELETE(request) {
  return (deletionQueue = deletionQueue.then(async () => {
    try {
      const { searchParams } = new URL(request.url);
      const po_number = searchParams.get("po_number") || "";
      const date_worked = searchParams.get("date_worked") || "";
      const period = searchParams.get("period") || "";
      if (!po_number || !date_worked || !period) {
        throw new HTTPError("Missing required query params: po_number, date_worked, period", 400);
      }
      const id = await getGristSqlRecordId(tableId, { filters: { po_number, date_worked, period } });
      const result = await deleteRecord(id);
      revalidateTag('payhours');
      return NextResponse.json(result);
    } catch (error) {
      return getHttpErrorResponse("DELETE /api/payhours", error);
    }
  }));
}
