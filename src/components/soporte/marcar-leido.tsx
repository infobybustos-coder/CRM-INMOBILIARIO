"use client";

import { useEffect } from "react";

export function MarcarLeido({
  conversacionId,
  marcarLeidoAction,
}: {
  conversacionId: string;
  marcarLeidoAction: (conversacionId: string) => Promise<void>;
}) {
  useEffect(() => {
    marcarLeidoAction(conversacionId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversacionId]);

  return null;
}
