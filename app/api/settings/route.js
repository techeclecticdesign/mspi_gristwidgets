import { NextResponse } from "next/server";
import { getHttpErrorResponse } from "@/app/lib/errors";
import { getGristSqlRecords } from "@/app/lib/sql";
import { sendGristTableRequest } from "@/app/lib/api";

export async function GET() {
  try {
    const records = await getGristSqlRecords("Settings");
    const [firstRecord] = records;
    return NextResponse.json(firstRecord || {});
  } catch (err) {
    return getHttpErrorResponse("GET /api/settings", err);
  }
}

export async function PATCH(request) {
  try {
    const fields = await request.json();
    const recordId = 1;
    const payload = { records: [{ id: recordId, fields }] };
    const result = await sendGristTableRequest({
      tableId: "Settings",
      method: "PATCH",
      payload,
    });
    return NextResponse.json(result);
  } catch (err) {
    return getHttpErrorResponse("PATCH /api/settings", err);
  }
}
