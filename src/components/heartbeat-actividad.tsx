"use client";

import { useEffect } from "react";
import { registrarActividad } from "@/lib/actividad";

export function HeartbeatActividad() {
  useEffect(() => {
    registrarActividad();
    const intervalo = setInterval(registrarActividad, 60_000);
    return () => clearInterval(intervalo);
  }, []);

  return null;
}
