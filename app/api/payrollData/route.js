import { NextResponse } from "next/server";
import { fetchWithRetry } from "@/app/lib/fetchWithRetry";

export async function GET(request) {
  const origin = new URL(request.url).origin;

  try {
    const [
      payRes,
      workersRes,
      timeclockRes,
      productionRes
    ] = await Promise.all([
      fetch(`${origin}/api/payhours`),
      fetch(`${origin}/api/workers`),
      fetch(`${origin}/api/timeclock`),
      fetch(`${origin}/api/production`)
    ]);

    if (!payRes.ok) {
      return NextResponse.json(
        { error: `PayHours failed: ${payRes.statusText}` },
        { status: payRes.status }
      );
    }

    if (!workersRes.ok) {
      return NextResponse.json(
        { error: `Workers failed: ${workersRes.statusText}` },
        { status: workersRes.status }
      );
    }

    if (!timeclockRes.ok) {
      return NextResponse.json(
        { error: `Timeclock failed: ${timeclockRes.statusText}` },
        { status: timeclockRes.status }
      );
    }

    if (!productionRes.ok) {
      return NextResponse.json(
        { error: `Production failed: ${productionRes.statusText}` },
        { status: productionRes.status }
      );
    }

    const payJson = await payRes.json();
    const workersJson = await workersRes.json();
    const timeclockJson = await timeclockRes.json();
    const productionJson = await productionRes.json();

    // Transform payHours: group by mdoc
    const payHours = payJson.records.reduce((acc, rec) => {
      const key = rec.fields.mdoc;
      acc[key] = acc[key] || [];
      acc[key].push(rec.fields);
      return acc;
    }, {});

    // Transform workers: filter out ended, index by mdoc
    const workers = workersJson.records
      .filter(({ fields }) =>
        !fields.end_date || fields.end_date < fields.start_date
      )
      .reduce((acc, { fields }) => {
        acc[fields.mdoc] = fields;
        return acc;
      }, {});

    const timeclock = timeclockJson.records;
    const production = productionJson;

    return NextResponse.json({ payHours, workers, timeclock, production });
  } catch (err) {
    console.error("Error in /api/payrollData:", err);
    return NextResponse.json(
      { error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
