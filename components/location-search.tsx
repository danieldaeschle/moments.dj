"use client";

import { useState, useRef, useEffect } from "react";
import { MapPin, Search, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type Location = {
  name: string;
  lat: number;
  lng: number;
};

type SearchResult = Location & { id: string };

type Props = {
  value: Location | null;
  onChange: (location: Location | null) => void;
};

export function LocationSearch({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function handleSearch(q: string) {
    setQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!q.trim()) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/locations/search?q=${encodeURIComponent(q.trim())}`,
        );
        if (res.ok) {
          setResults(await res.json());
        }
      } finally {
        setLoading(false);
      }
    }, 400);
  }

  function selectLocation(loc: SearchResult) {
    onChange({ name: loc.name, lat: loc.lat, lng: loc.lng });
    setOpen(false);
    setQuery("");
    setResults([]);
  }

  if (value) {
    return (
      <div className="flex items-center gap-3 rounded-lg border p-3">
        <MapPin className="h-5 w-5 shrink-0 text-muted-foreground" />
        <p className="min-w-0 flex-1 truncate text-sm">{value.name}</p>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="shrink-0 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 text-muted-foreground transition-colors hover:border-muted-foreground/50"
      >
        <MapPin className="h-5 w-5" />
        <span className="text-sm">Ort hinzufügen</span>
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          autoFocus
          placeholder="Ort suchen..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          className="h-12 pl-9 pr-9 text-base"
        />
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setQuery("");
            setResults([]);
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {loading && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="max-h-64 overflow-y-auto rounded-lg border">
          {results.map((loc, i) => (
            <button
              key={loc.id}
              type="button"
              onClick={() => selectLocation(loc)}
              className={cn(
                "flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted",
                i !== 0 && "border-t",
              )}
            >
              <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
              <p className="min-w-0 flex-1 truncate text-sm">{loc.name}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
