import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache'
import { env, ensureEnv } from "@/app/lib/api";

const { host, apiKey, docId } = env;

export async function POST() {
  const envErr = ensureEnv();
  if (envErr) return envErr;

  try {
    const result = await backfillDerivedData();
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('Error backfilling data:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
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
    throw new Error(`Failed to fetch ${tableId}: ${res.statusText}`);
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
    throw new Error(`Failed to patch ${tableId}: ${res.statusText}`);
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
