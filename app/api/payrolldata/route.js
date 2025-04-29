import { NextResponse } from "next/server";
import { groupPayHoursByMdoc, filterAndIndexWorkersByMdoc } from "@/app/lib/api";

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

    const payHours = groupPayHoursByMdoc(payJson.records);
    const workers = filterAndIndexWorkersByMdoc(workersJson.records);
    const timeclock = timeclockJson.records;
    const production = productionJson;

    return NextResponse.json({ payHours, workers, timeclock, production });
  } catch (err) {
    console.error("Error in /api/payrolldata:", err);
    return NextResponse.json(
      { error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
