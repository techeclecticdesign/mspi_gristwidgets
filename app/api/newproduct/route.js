import { NextResponse } from "next/server";
import { sendGristTableRequest, indexByPkField } from "@/app/lib/api";
import { getGristSqlRecords } from "@/app/lib/sql"
import { filterArrayStartsWith } from "@/app/lib/util";

async function generateNewProductCode(format) {
  const existing = await getGristSqlRecords("ProductionStandards", {});
  const byCode = indexByPkField(existing, "product_code");
  const codes = Object.keys(byCode);
  const prefix = format === "WS" ? "6-" : "3-";
  const matches = filterArrayStartsWith(codes, prefix);
  matches.sort().reverse();
  const latest = matches[0] || `${prefix}0000`;
  const [, numStr] = latest.split("-");
  const nextNum = String(Number(numStr) + 1).padStart(4, "0");
  const productCode = `${prefix}${nextNum}`;
  return productCode;
}

export async function POST(req) {
  try {
    const {
      description,
      defaultAmount,
      price,
      notes,
      format,
      templates
    } = await req.json();
    const productCode = await generateNewProductCode(format);
    // Insert into ProductStandards
    const prodStdPayload = {
      records: [{
        fields: {
          product_code: productCode,
          description,
          default_amount: defaultAmount,
          customer_price: price,
          production_notes: notes
        }
      }]
    };
    const prodStdResult = await sendGristTableRequest({
      tableId: "ProductionStandards",
      method: "POST",
      payload: prodStdPayload
    });
    // Insert each material into Templates
    const templatePromises = templates.map(mat => {
      const templatePayload = {
        records: [{
          fields: {
            product_code: productCode,
            stock_number: mat.stock,
            material_description: mat.desc,
            material_amount: mat.qty,
            material_unit: mat.unit
          }
        }]
      };
      return sendGristTableRequest({
        tableId: "Templates",
        method: "POST",
        payload: templatePayload
      });
    });
    const templateResults = await Promise.all(templatePromises);

    return NextResponse.json(
      { productCode, prodStdResult, templateResults },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST /api/newproduct error:", err);
    return NextResponse.json(
      { error: err.message || "Unknown error" },
      { status: 500 }
    );
  }
}
