// app/api/backfillDerivedData/route.js
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const result = await backfillDerivedData();
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('Error backfilling data:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

const GRIST_HOST = process.env.NEXT_PUBLIC_GRIST_HOST;
const API_KEY = process.env.API_KEY;
const DOC_ID = process.env.WOODSHOP_DOC;
const PRODUCTION = 'Production';
const WORKERS = 'Workers';

// helpers
async function fetchRecords(tableId) {
  const res = await fetch(
    `${GRIST_HOST}/api/docs/${DOC_ID}/tables/${tableId}/records`,
    {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
      },
    }
  );
  if (!res.ok) {
    throw new Error(`Failed to fetch ${tableId}: ${res.statusText}`);
  }
  const data = await res.json();
  return data.records;
}

async function patchRecords(tableId, records) {
  const res = await fetch(
    `${GRIST_HOST}/api/docs/${DOC_ID}/tables/${tableId}/records`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({ records }),
    }
  );
  if (!res.ok) {
    throw new Error(`Failed to patch ${tableId}: ${res.statusText}`);
  }
  return res.json();
}

/* Intended to run once after tables have been imported from old server.  Backfills fields that
 * were not present in the old server */
async function backfillDerivedData() {
  const [prodRecs, workerRecs] = await Promise.all([
    fetchRecords(PRODUCTION),
    fetchRecords(WORKERS),
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
    const patched = await patchRecords(PRODUCTION, toUpdate);
    return { updated: toUpdate.length, patched };
  }

  return { updated: 0 };
}
