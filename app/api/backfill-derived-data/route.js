import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache'
import { env, ensureEnv } from "@/app/lib/api";
import { getHttpErrorResponse, HTTPError } from '@/app/lib/errors';

const { host, apiKey, docId } = env;

export async function POST() {
  try {
    ensureEnv();
    const result = await backfillDerivedData();
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return getHttpErrorResponse('POST /api/backfill-derived-data', error);
  }
}

async function fetchRecords(tableId) {
  const res = await fetch(
    `${host}/api/docs/${docId}/tables/${tableId}/records`,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    }
  );
  if (!res.ok) {
    throw new HTTPError(`Failed to fetch ${tableId}: ${res.statusText}`, res.status);
  }
  const data = await res.json();
  return data.records;
}

async function patchRecords(tableId, records) {
  const res = await fetch(
    `${host}/api/docs/${docId}/tables/${tableId}/records`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ records }),
    }
  );
  if (!res.ok) {
    throw new HTTPError(`Failed to patch ${tableId}: ${res.statusText}`, res.status);
  }
  return res.json();
}

/* Intended to run once after tables have been imported from old server.  Backfills fields that
 * were not present in the old server */
async function backfillDerivedData() {
  const [prodRecs, workerRecs] = await Promise.all([
    fetchRecords("Production"),
    fetchRecords("Workers"),
  ]);

  const payrollMap = workerRecs.reduce((map, r) => {
    map[r.fields.name] = r.fields.payroll_dept;
    return map;
  }, {});

  const toUpdate = prodRecs
    .filter(r => payrollMap[r.fields.team] === 'Upholstery' || r.fields.team === 'Weatherend')
    .map(r => ({
      id: r.id,
      fields: { upholstery: true },
    }));

  if (toUpdate.length > 0) {
    const patched = await patchRecords("Production", toUpdate);
    revalidateTag('production')
    return { updated: toUpdate.length, patched };
  }

  return { updated: 0 };
}
