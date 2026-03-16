import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return new Response("Missing id", { status: 400 });
  }

  try {
    // Fetch fresh preview URL from Deezer track API
    const trackRes = await fetch(
      `https://api.deezer.com/track/${encodeURIComponent(id)}`,
      {
        cache: "no-store",
      },
    );

    if (!trackRes.ok) {
      return new Response("Track not found", { status: 404 });
    }

    const track = await trackRes.json();
    const previewUrl = track.preview;

    if (!previewUrl) {
      return new Response("No preview available", { status: 404 });
    }

    // Stream the audio through our server
    const audioRes = await fetch(previewUrl);

    if (!audioRes.ok || !audioRes.body) {
      return new Response("Upstream error", { status: 502 });
    }

    return new Response(audioRes.body, {
      headers: {
        "Content-Type": audioRes.headers.get("Content-Type") || "audio/mpeg",
        "Cache-Control": "public, max-age=300",
        ...(audioRes.headers.get("Content-Length")
          ? { "Content-Length": audioRes.headers.get("Content-Length")! }
          : {}),
      },
    });
  } catch {
    return new Response("Proxy error", { status: 502 });
  }
}
