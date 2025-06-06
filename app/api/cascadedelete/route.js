import { NextResponse } from "next/server";
import {
  sendGristDeleteRequest,
  sendGristTableRequest,
} from "@/app/lib/api";
import {
  getGristSqlRecordId,
  getGristSqlRecords,
} from "@/app/lib/sql";
import { getHttpErrorResponse, HTTPError } from "@/app/lib/errors";

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const po_number = searchParams.get("po_number");
    if (!po_number) {
      throw new HTTPError("Missing required query param: po_number", 400);
    }

    // delete the Production row
    const prodId = await getGristSqlRecordId("Production", {
      filters: { po_number },
    });
    if (!prodId) {
      throw new HTTPError("Production record not found", 404);
    }
    const deleteProd = sendGristDeleteRequest({
      tableId: "Production",
      payload: [prodId],
    });

    // delete all ProductionMaterials rows
    const matRecords = await getGristSqlRecords("ProductionMaterials", {
      filters: { po_number: [po_number] },
    });
    const matIds = matRecords.map((r) => r.id);
    const deleteMats = matIds.length
      ? sendGristDeleteRequest({
        tableId: "ProductionMaterials",
        payload: matIds,
      })
      : Promise.resolve();

    // patch PayHours rows to set po_number to 'undefined'
    const payRecords = await getGristSqlRecords("PayHours", {
      filters: { po_number: [po_number] },
    });
    const patches = payRecords.map((r) =>
      sendGristTableRequest({
        tableId: "PayHours",
        method: "PATCH",
        payload: {
          records: [
            { id: r.id, fields: { po_number: "undefined" } },
          ],
        },
      })
    );

    await Promise.all([deleteProd, deleteMats, ...patches]);
    return NextResponse.json({ success: true });
  } catch (err) {
    return getHttpErrorResponse(
      "DELETE /api/production/[po_number]",
      err
    );
  }
}
