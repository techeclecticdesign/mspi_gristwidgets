import { NextResponse } from "next/server";
import { revalidateTag } from 'next/cache';
import { sendGristTableRequest } from "@/app/lib/api";
import { getGristSqlRecordId, getGristSqlRecords } from "@/app/lib/sql";
import { getHttpErrorResponse, HTTPError } from "@/app/lib/errors";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const product_code = searchParams.get("productcode") ?? undefined;
    const filters = {};
    if (product_code) filters.product_code = product_code;
    const records = await getGristSqlRecords("ProductionStandards", { filters });
    return NextResponse.json(records);
  } catch (err) {
    return getHttpErrorResponse("GET /api/prodstandards", err);
  }
}

export async function POST(request) {
  try {
    const tableId = "ProductionStandards";
    const {
      product_code,
      description,
      default_amount,
      price,
      notes
    } = await request.json();

    if (!product_code) {
      throw new HTTPError("The product_code field is required.", 400);
    }

    const payload = {
      records: [{
        fields: {
          product_code,
          description,
          default_amount,
          customer_price: price,
          production_notes: notes
        }
      }]
    };

    const createResponse = await sendGristTableRequest({
      tableId,
      method: "POST",
      payload
    });

    revalidateTag('prodstandards');
    return NextResponse.json(createResponse, { status: 201 });
  } catch (err) {
    return getHttpErrorResponse("POST /api/prodstandards", err);
  }
}

export async function PATCH(request) {
  try {
    const tableId = "ProductionStandards";
    const body = await request.json();
    const { product_code, customer_price, production_notes } = body;

    if (!product_code) {
      throw new HTTPError("The product_code field is required.", 400);
    }
    const recordId = await getGristSqlRecordId(tableId, { filters: { product_code } });
    if (recordId == null) {
      throw new HTTPError("Record id not found in fetched record", 404);
    }

    const fieldsToUpdate = {};
    if (customer_price != null) {
      fieldsToUpdate.customer_price = customer_price;
    }
    if (production_notes != null) {
      fieldsToUpdate.production_notes = production_notes;
    }
    if (!Object.keys(fieldsToUpdate).length) {
      throw new HTTPError("Nothing to update", 400);
    }
    const updatePayload = {
      records: [{ id: recordId, fields: fieldsToUpdate }],
    };
    const updateResponse = await sendGristTableRequest({
      tableId,
      method: "PATCH",
      payload: updatePayload
    });
    revalidateTag('prodstandards');
    return NextResponse.json(updateResponse);
  }
  catch (err) {
    return getHttpErrorResponse("PATCH /api/prodstandards", err)
  }
}
