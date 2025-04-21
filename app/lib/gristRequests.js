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
