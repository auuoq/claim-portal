import { NextRequest, NextResponse } from "next/server";
import { getApiBaseUrl } from "@/lib/runtime-config";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");
  const source = searchParams.get("source");

  if (!sessionId || !source) {
    return new NextResponse("Missing parameters", { status: 400 });
  }

  const API_BASE_URL = getApiBaseUrl();

  const targetUrl = `${API_BASE_URL}/pages/${sessionId}/${encodeURIComponent(source)}`;

  try {
    const response = await fetch(targetUrl, {
      headers: {
        "ngrok-skip-browser-warning": "true",
      },
    });

    if (!response.ok) {
      return new NextResponse(`Backend error: ${response.status}`, { status: response.status });
    }

    const contentType = response.headers.get("content-type") || "image/png";
    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Proxy error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
