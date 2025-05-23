import { renderToStream } from "@react-pdf/renderer";
import { NextResponse } from "next/server";

export async function pdfResponse(element, filename) {
  const stream = await renderToStream(element);
  return new NextResponse(stream, {
    headers: {
      "Content-Type": "application/pdf",
    },
  });
}

export async function downloadPdfFromEndpoint(
  endpoint
) {
  try {
    const res = await fetch(endpoint);
    if (!res.ok) {
      console.error("Failed to download PDF", await res.text());
      return;
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener");
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } catch (err) {
    console.error("Error during PDF download", err);
  }
}
