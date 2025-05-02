import { NextResponse } from "next/server";
import {
  groupPayHoursByMdoc,
  filterAndIndexWorkersByMdoc,
  indexProdStandByCode
} from "@/app/lib/api";

export async function GET(request) {
  const origin = new URL(request.url).origin;

  try {
    const [
      payRes,
      workersRes,
      prodstandardsRes
    ] = await Promise.all([
      fetch(`${origin}/api/payhours`),
      fetch(`${origin}/api/workers`),
      fetch(`${origin}/api/prodstandards`)
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

    if (!prodstandardsRes.ok) {
      return NextResponse.json(
        { error: `ProdStandards failed: ${prodstandardsRes.statusText}` },
        { status: prodstandardsRes.status }
      );
    }

    const payJson = await payRes.json();
    const workersJson = await workersRes.json();
    const prodstandardsJson = await prodstandardsRes.json()
    const payHours = groupPayHoursByMdoc(payJson.records);
    const workers = filterAndIndexWorkersByMdoc(workersJson.records);
    const prodStandards = indexProdStandByCode(prodstandardsJson.records);


    return NextResponse.json({ payHours, workers, prodStandards });
  } catch (err) {
    console.error("Error in /api/projectdata:", err);
    return NextResponse.json(
      { error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
