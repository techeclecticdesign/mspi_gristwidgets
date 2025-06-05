import { NextResponse } from "next/server";
import { HTTPError } from "./errors";

export const env = {
  host: process.env.NEXT_PUBLIC_GRIST_HOST,
  apiKey: process.env.API_KEY,
  docId: process.env.WOODSHOP_DOC,
};

/* handles error boilerplate for fetches.  If last arg is object, treat it as fetch options */
export async function batchFetch(...args) {
  let options = {};
  let urls = args;
  const last = args[args.length - 1];
  if (typeof last === "object" && !Array.isArray(last)) {
    options = last;
    urls = args.slice(0, -1);
  }
  const tasks = urls.map(url => fetchWithRetry(url, options));
  return Promise.all(tasks);
}

// keep attempting to fetch until success using exponential backoff and jitter
export async function fetchWithRetry(
  url,
  options,
  retries = 5,
  delay = 1000
) {
  const response = await fetch(url, options);

  if (!response.ok && retries > 0) {
    const jitter = Math.random() * 200;
    const nextDelay = delay * 2 + jitter;
    console.warn(
      `Non-OK response (${response.status}). Retrying ${url} in ${nextDelay.toFixed(0)}ms... (${retries} retries left)`
    );
    await new Promise((resolve) => setTimeout(resolve, nextDelay));
    return fetchWithRetry(url, options, retries - 1, delay);
  }

  if (!response.ok) {
    throw new HTTPError(`${url} failed: ${response.statusText}`, response.status);
  }

  return response.json();
}

/* Ensure required .env variables are set. Returns a NextResponse error if any are missing. */
export function ensureEnv() {
  const { NEXT_PUBLIC_GRIST_HOST: host, API_KEY: apiKey, WOODSHOP_DOC: docId } = process.env;

  const missing = [];
  if (!host) missing.push("NEXT_PUBLIC_GRIST_HOST");
  if (!apiKey) missing.push("API_KEY");
  if (!docId) missing.push("WOODSHOP_DOC");

  if (missing.length) {
    throw new HTTPError(`Missing environment variables: ${missing.join(", ")}`, 500);
  }
}

async function sendGristRequest({ url, method, payload }) {
  ensureEnv();
  const options = {
    method,
    headers: {
      "Authorization": `Bearer ${env.apiKey}`,
      "Content-Type": "application/json",
    },
  };

  // Only add body if payload exists and the method allows it
  if (payload !== undefined && method !== 'GET' && method !== 'HEAD') {
    options.body = JSON.stringify(payload);
  }

  return fetchWithRetry(url, options);
}

export async function sendGristTableRequest({
  tableId,
  method,
  payload,
  filter,
}) {
  let url = `${env.host}/api/docs/${env.docId}/tables/${tableId}/records`;

  // If a filter object is provided, append ?filter=... 
  if (filter && typeof filter === 'object') {
    const filterParam = encodeURIComponent(JSON.stringify(filter));
    url += `?filter=${filterParam}`;
  }

  return sendGristRequest({ url, method, payload });
}

export async function sendGristDeleteRequest({ tableId, payload }) {
  let url = `${env.host}/api/docs/${env.docId}/tables/${tableId}/data/delete`;
  return sendGristRequest({ url, method: "POST", payload });
}

export function unwrapGristRecords(gristResponse) {
  if (!Array.isArray(gristResponse?.records)) return [];
  return gristResponse.records.map(r => r.fields);
}

/* index rows by primary key */
export function indexByPkField(records, field) {
  return records.reduce((acc, rec) => {
    const key = rec[field];
    if (key != null) acc[key] = rec;
    return acc;
  }, {});
}

/* index a group of rows by a field */
export function groupByField(records, field) {
  return records.reduce((acc, rec) => {
    const key = rec[field];
    if (key != null) {
      if (!acc[key]) acc[key] = [];
      acc[key].push(rec);
    }
    return acc;
  }, {});
}

// Filters out workers no longer employed
export function filterActiveWorkers(records) {
  return records.filter((rec) =>
    !rec.end_date || rec.end_date < rec.start_date
  );
}

// filter out workers no longer employed, index by mdoc
export function filterAndIndexWorkersByMdoc(records) {
  return indexByPkField(filterActiveWorkers(records), "mdoc");
}

// filter out all but the Team Leaders
export function filterWorkersAsTeamLeaders(records) {
  return filterActiveWorkers(records)
    .filter(rec =>
      rec.name === rec.team || rec.team === 'Upholstery'
    );
}
