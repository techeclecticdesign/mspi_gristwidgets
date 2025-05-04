import { env, fetchWithRetry } from "@/app/lib/api";

/* build filter clauses for sql selection */
function buildFilterClauses(filters = {}, dateColumn) {
  return Object.entries(filters)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([key, value]) => {
      if (key === dateColumn) {
        // exact‐match on dateColumn
        return `date(${key},'unixepoch')=date(${value},'unixepoch')`;
      }
      return `${key}='${value}'`;
    });
}

/* gets records using grist api sql select.  The optional second argument handles filtering.  It
 * can contain the following properties:
 *   -filters: A set of key/value pairs to apply as exact‑match filters.
 *   -dateColumn: used together with start and/or end, determines column range filter is applied to
 *   -start: records on or after this date will be included in the returned values.
 *   -end: records on or before this date will be included in the returned values.
 */
export async function getGristSqlRecords(tableId, { filters = {}, dateColumn, start, end } = {}) {
  const rangeClauses = [];
  if (dateColumn) {
    if (start != null) {
      const startSec = typeof start === "string" ? parseInt(start, 10) : start;
      if (isNaN(startSec)) throw new Error("Invalid start date");
      rangeClauses.push(
        `date(${dateColumn},'unixepoch') >= date(${startSec},'unixepoch')`
      );
    }
    if (end != null) {
      const endSec = typeof end === "string" ? parseInt(end, 10) : end;
      if (isNaN(endSec)) throw new Error("Invalid end date");
      rangeClauses.push(
        `date(${dateColumn},'unixepoch') <= date(${endSec},'unixepoch')`
      );
    }
  }

  const equalityClauses = buildFilterClauses(filters, dateColumn);
  const allClauses = [...rangeClauses, ...equalityClauses];
  const where = allClauses.length ? `WHERE ${allClauses.join(" AND ")}` : "";
  const q = `SELECT * FROM ${tableId} ${where}`;
  const url = `${env.host}/api/docs/${env.docId}/sql?q=${encodeURIComponent(q)}`;
  const data = await fetchWithRetry(
    url,
    { headers: { Authorization: `Bearer ${env.apiKey}` } }
  );
  const raw = data.records || [];
  return raw.map(rec => rec.fields);
}

export async function getGristSqlRecordId(tableId, opts = {}) {
  const recs = await getGristSqlRecords(tableId, opts);
  if (!recs.length || typeof recs[0].id !== "number") {
    throw new Error("Record not found");
  }
  return recs[0].id;
}
