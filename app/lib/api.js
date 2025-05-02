// keep attempting to fetch until success using exponential backoff and jitter
export async function fetchWithRetry(
  url,
  options,
  retries = 5,
  delay = 1000
) {
  const response = await fetch(url, options);

  if (response.ok) {
    return response;
  } else if (retries > 0) {
    const jitter = Math.random() * 200;
    const nextDelay = delay * 2 + jitter;
    console.warn(
      `Non-OK response (${response.status}). Retrying ${url} in ${nextDelay.toFixed(0)}ms... (${retries} retries left)`
    );
    await new Promise((resolve) => setTimeout(resolve, nextDelay));
    return fetchWithRetry(url, options, retries - 1, delay);
  } else {
    console.error(`Fetch failed for ${url} after all retries. Final status: ${response.status}`);
    return null;
  }
}


async function sendGristRequest({ host, apiKey, url, method, payload }) {
  const response = await fetch(url, {
    method,
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Grist API returned error: ${errorText}`);
  }

  return response.json();
}

export async function sendGristTableRequest({ host, apiKey, docId, tableId, method, payload, recordId = "" }) {
  let url = `${host}/api/docs/${docId}/tables/${tableId}/records`;
  if (recordId) {
    url += `/${recordId}`;
  }
  return sendGristRequest({ host, apiKey, url, method, payload });
}

export async function sendGristDeleteRequest({ host, apiKey, docId, tableId, method, payload }) {
  let url = `${host}/api/docs/${docId}/tables/${tableId}/data/delete`;
  return sendGristRequest({ host, apiKey, url, method, payload });
}

// group payHours by mdoc
export function groupPayHoursByMdoc(records) {
  return records.reduce((acc, rec) => {
    const key = rec.fields.mdoc;
    if (!acc[key]) acc[key] = [];
    acc[key].push(rec.fields);
    return acc;
  }, {});
}

// filter out workers no longer employed, index by mdoc
export function filterAndIndexWorkersByMdoc(records) {
  return records
    .filter(({ fields }) =>
      !fields.end_date || fields.end_date < fields.start_date
    )
    .reduce((acc, { fields }) => {
      acc[fields.mdoc] = fields;
      return acc;
    }, {});
}

// index production standards by product_code
export function indexProdStandByCode(records) {
  return records.reduce((acc, { fields }) => {
    const key = fields.product_code;
    if (key != null) {
      acc[key] = fields;
    }
    return acc;
  }, {});
}
