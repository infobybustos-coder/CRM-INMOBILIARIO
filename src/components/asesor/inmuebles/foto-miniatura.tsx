"use client";

import { useEffect, useState } from "react";
import { Home } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function FotoMiniatura({
  rutaStorage,
  className,
}: {
  rutaStorage: string | null;
  className?: string;
}) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!rutaStorage) return;
    let cancelado = false;

    createClient()
      .storage.from("documentos")
      .createSignedUrl(rutaStorage, 3600)
      .then(({ data }) => {
        if (!cancelado && data?.signedUrl) setUrl(data.signedUrl);
      });

    return () => {
      cancelado = true;
    };
  }, [rutaStorage]);

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted",
        className
      )}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="h-full w-full object-cover" />
      ) : (
        <Home className="size-4 text-muted-foreground" />
      )}
    </div>
  );
}
