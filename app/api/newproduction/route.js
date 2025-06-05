import { NextResponse } from "next/server";
import {
  indexByPkField,
  groupByField,
  batchFetch,
  filterActiveWorkers,
  sendGristTableRequest,
  filterWorkersAsTeamLeaders
} from "@/app/lib/api";
import { getGristSqlPrefixMatches } from "@/app/lib/sql"
import { getHttpErrorResponse } from "@/app/lib/errors";

export async function GET(request) {
  const origin = new URL(request.url).origin;

  try {
    const [
      prodStandRaw,
      workers,
      templatesRaw,
      customers
    ] = await batchFetch(
      `${origin}/api/prodstandards`,
      `${origin}/api/workers`,
      `${origin}/api/templates`,
      `${origin}/api/customers`
    );

    // build frontend‐ready arrays once on the server
    const prodDescOptions = prodStandRaw
      .map(p => ({
        code: p.product_code,
        desc: p.description || "",
        label: p.description
          ? `${p.description} - ${p.product_code}`
          : p.product_code,
      }))
      .sort((a, b) => a.desc.trimStart().localeCompare(b.desc.trimStart()));

    const prodCodeOptions = [...prodDescOptions]
      .sort((a, b) => a.code.localeCompare(b.code)).reverse();

    const prodStandards = indexByPkField(prodStandRaw, "product_code");
    const templates = indexByPkField(templatesRaw, "product_code");
    const filteredRawWorkers = filterActiveWorkers(workers);
    const workersByName = indexByPkField(filteredRawWorkers, "name");
    const filteredLeaders = filterWorkersAsTeamLeaders(filteredRawWorkers);
    const leadersList = Object.keys(indexByPkField(filteredLeaders, "name")).sort();
    const nhifmWorkers = filteredRawWorkers.filter((worker) => worker.nhifm_worker);
    const nhifmList = Object.keys(indexByPkField(nhifmWorkers, "name")).sort();

    return NextResponse.json({
      prodStandards,
      prodDescOptions,
      prodCodeOptions,
      workersByName,
      leadersList,
      nhifmList,
      templates,
      customers
    });
  } catch (err) {
    return getHttpErrorResponse("GET /api/newproduction", err);
  }
}

export async function POST(request) {
  const data = await request.json();

  const uphBool = (data.productType === "Weatherend"
    || (data.productType === "Stock"
      && data.workersByName[data.team].payroll_dept === "Upholstery"))
    ? true
    : false;

  const newPo = await createNewPo(data.productType, uphBool);
  const now = new Date();
  const date = Math.floor(now.getTime() / 1000);
  const dateStr = `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()}`;

  const groupedCustomers = groupByField(data.customers, "customer_name");
  const customerAddress =
    groupedCustomers[data.customer].length === 1
      ? groupedCustomers[data.customer][0].customer_address || ""
      : groupedCustomers[data.customer]
        .find(c => c.customer_desc === data.customerDesc).customer_address || "";

  try {
    const tableId = "Production";
    const payload = {
      records: [{
        fields: {
          po_number: newPo,
          product_code: data.productCode,
          amount_requested: data.amountRequested,
          team: data.team,
          start_date: date,
          product: data.productDesc,
          contractor_memo: data.contractorNote,
          customer: data.customer,
          pie: data.productType === "Weatherend",
          upholstery: uphBool,
          nhifm: data.productType === "NHIFM",
          payable_on_nh_days: data.paidNHDays
        }
      }]
    }
    const result = await sendGristTableRequest({ tableId, method: "POST", payload });
    return NextResponse.json({
      ...result,
      po_number: newPo
    });
  } catch (err) {
    return getHttpErrorResponse("POST /api/newproduction", err);
  }
}

async function createNewPo(productType, uphBool) {
  let newPo;
  const deptCode = uphBool ? "35" : "25";
  // build the prefix
  const twoDigitYear = new Date().getFullYear().toString().slice(-2);
  const poPrefix = twoDigitYear + deptCode;
  // search for po_number matches to prefix
  const matches = await getGristSqlPrefixMatches("Production", "po_number", poPrefix);
  if (matches.length === 0) {
    return poPrefix + "-0001"
  }
  const newestPo = matches.sort((a, b) => {
    return b.po_number.localeCompare(a.po_number, undefined, { numeric: true });
  })[0].po_number;
  return poPrefix + "-" + String(Number(newestPo.split("-")[1]) + 1).padStart(4, "0");
}
