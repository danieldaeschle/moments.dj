import { NextRequest, NextResponse } from "next/server";

type DeezerTrack = {
  id: number;
  title: string;
  artist: { name: string };
  album: { cover_medium: string };
  preview: string;
  link: string;
};

function spotifySearchUrl(title: string, artist: string): string {
  return `https://open.spotify.com/search/${encodeURIComponent(`${title} ${artist}`)}`;
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q) {
    return NextResponse.json([]);
  }

  const url = `https://api.deezer.com/search?q=${encodeURIComponent(q)}&limit=10`;
  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    return NextResponse.json([], { status: 502 });
  }

  const json = await res.json();
  const deezerTracks: DeezerTrack[] = json.data ?? [];

  const tracks = deezerTracks.map((t) => ({
    title: t.title,
    artist: t.artist.name,
    deezerId: String(t.id),
    coverUrl: t.album.cover_medium,
    deezerUrl: t.link,
    spotifyUrl: spotifySearchUrl(t.title, t.artist.name),
  }));

  return NextResponse.json(tracks);
}
