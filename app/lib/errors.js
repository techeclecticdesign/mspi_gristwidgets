import { NextResponse } from "next/server";

export class HTTPError extends Error {
  status;
  constructor(message, status = 500) {
    super(message);
    this.status = status;
    this.name = "HTTPError";
  }
}

export const getHttpErrorResponse = (route, err) => {
  const status = err instanceof HTTPError ? err.status : 500;
  const message = err instanceof Error ? err.message : "Unexpected error";
  console.error("Error in " + route + ":", err);
  return NextResponse.json({ error: message }, { status });
}
