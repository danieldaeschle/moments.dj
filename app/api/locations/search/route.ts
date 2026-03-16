import { NextRequest, NextResponse } from "next/server";

type NominatimResult = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  name?: string;
  address?: {
    amenity?: string;
    shop?: string;
    tourism?: string;
    leisure?: string;
    road?: string;
    city?: string;
    town?: string;
    village?: string;
    suburb?: string;
    state?: string;
    country?: string;
  };
};

function formatName(r: NominatimResult): string {
  const a = r.address;
  if (!a) return r.display_name.split(",").slice(0, 3).join(",");

  const place = r.name || a.amenity || a.shop || a.tourism || a.leisure;
  const area = a.suburb || a.city || a.town || a.village;

  if (place && area) return `${place}, ${area}`;
  if (place) return place;
  if (a.road && area) return `${a.road}, ${area}`;
  return r.display_name.split(",").slice(0, 3).join(",").trim();
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q) {
    return NextResponse.json([]);
  }

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", q);
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "8");
  url.searchParams.set("accept-language", "de");

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": "moments.dj/1.0" },
    cache: "no-store",
  });

  if (!res.ok) {
    return NextResponse.json([], { status: 502 });
  }

  const data: NominatimResult[] = await res.json();

  const results = data.map((r) => ({
    id: String(r.place_id),
    name: formatName(r),
    lat: parseFloat(r.lat),
    lng: parseFloat(r.lon),
  }));

  return NextResponse.json(results);
}
