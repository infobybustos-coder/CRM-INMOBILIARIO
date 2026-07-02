"use client";

import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { useState } from "react";

export function RefreshButton() {
  const router = useRouter();
  const [spinning, setSpinning] = useState(false);

  function handleClick() {
    setSpinning(true);
    router.refresh();
    setTimeout(() => setSpinning(false), 800);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      title="Actualizar"
      className="inline-flex items-center gap-1.5 rounded-md border bg-background px-3 py-2 text-sm font-medium hover:bg-accent transition-colors"
    >
      <RefreshCw className={`size-4 ${spinning ? "animate-spin" : ""}`} />
      <span className="hidden sm:inline">Actualizar</span>
    </button>
  );
}
