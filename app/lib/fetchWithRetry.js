// keep attempting to fetch until success using exponential backoff and jitter
export async function fetchWithRetry(
  url,
  options,
  retries = 5,
  delay = 1000
) {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      console.warn(`HTTP error! status: ${response.status}`);
    }
    return response;
  } catch (error) {
    if (retries > 0) {
      const jitter = Math.random() * 200;
      const nextDelay = delay * 2 + jitter;
      console.warn(
        `Retrying ${url} in ${nextDelay.toFixed(0)}ms... (${retries} retries left)`
      );
      await new Promise((resolve) => setTimeout(resolve, nextDelay));
      return fetchWithRetry(url, options, retries - 1, delay);
    }
    throw error;
  }
}
