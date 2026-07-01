"use client";

import Link from "next/link";
import { Home, Users, UserSearch, ExternalLink, BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const ETIQUETAS_ROL: Record<string, string> = {
  administrador: "Administrador",
  director_comercial: "Director Comercial",
  agente: "Agente",
  captador: "Captador",
};

const COLORES_ROL: Record<string, string> = {
  administrador: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  director_comercial: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  agente: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  captador: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
};

type Stats = {
  inmuebles: number;
  inmuebles_vendidos: number;
  propietarios: number;
  propietarios_firmados: number;
  compradores: number;
  compradores_comprado: number;
  total: number;
  puntos: number;
};

type Agente = {
  id: string;
  nombre_completo: string | null;
  email: string;
  rol: string;
  activo: boolean;
  avatar_url: string | null;
};

export function TarjetaAgente({
  agente,
  stats,
  posicion,
  esMiMismoId,
}: {
  agente: Agente;
  stats: Stats;
  posicion: number;
  esMiMismoId: boolean;
}) {
  const iniciales = (agente.nombre_completo ?? agente.email)
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  const medallas: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };
  const medalla = medallas[posicion];

  const operacionesCerradas =
    stats.inmuebles_vendidos + stats.propietarios_firmados + stats.compradores_comprado;

  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-xl border bg-card p-4 transition-shadow hover:shadow-md",
        !agente.activo && "opacity-60",
        esMiMismoId && "ring-2 ring-primary/30"
      )}
    >
      {/* Header */}
      <div className="mb-3 flex items-start gap-3">
        <div className="relative flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
          {iniciales || "?"}
          {medalla && (
            <span className="absolute -right-1 -top-1 text-base leading-none">{medalla}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate font-semibold">
              {agente.nombre_completo ?? agente.email}
            </p>
            {esMiMismoId && (
              <BadgeCheck className="size-4 shrink-0 text-primary" />
            )}
          </div>
          <p className="truncate text-xs text-muted-foreground">{agente.email}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-semibold",
              COLORES_ROL[agente.rol] ?? "bg-muted text-muted-foreground"
            )}
          >
            {ETIQUETAS_ROL[agente.rol] ?? agente.rol}
          </span>
          {!agente.activo && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
              Inactivo
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 divide-x rounded-lg border bg-muted/30 text-center">
        <div className="px-2 py-2">
          <Home className="mx-auto mb-0.5 size-3.5 text-blue-500" />
          <p className="text-base font-bold">{stats.inmuebles}</p>
          <p className="text-[10px] text-muted-foreground">Inmuebles</p>
        </div>
        <div className="px-2 py-2">
          <Users className="mx-auto mb-0.5 size-3.5 text-violet-500" />
          <p className="text-base font-bold">{stats.propietarios}</p>
          <p className="text-[10px] text-muted-foreground">Captaciones</p>
        </div>
        <div className="px-2 py-2">
          <UserSearch className="mx-auto mb-0.5 size-3.5 text-sky-500" />
          <p className="text-base font-bold">{stats.compradores}</p>
          <p className="text-[10px] text-muted-foreground">Compradores</p>
        </div>
      </div>

      {/* Closed operations */}
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          <strong className="text-foreground">{operacionesCerradas}</strong>{" "}
          {operacionesCerradas === 1 ? "operación cerrada" : "operaciones cerradas"}
        </span>
        <span className="font-medium text-primary">{stats.puntos} pts</span>
      </div>

      {/* Quick actions */}
      <div className="mt-3 flex gap-2 border-t pt-3">
        {agente.rol !== "captador" && (
          <Link
            href={`/inmobiliaria/inmuebles?agente_id=${agente.id}`}
            className="flex flex-1 items-center justify-center gap-1 rounded-md border px-2 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
          >
            <Home className="size-3" />
            Ver inmuebles
          </Link>
        )}
        <Link
          href={`/inmobiliaria/propietarios?agente_id=${agente.id}`}
          className="flex flex-1 items-center justify-center gap-1 rounded-md border px-2 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
        >
          <ExternalLink className="size-3" />
          Ver captaciones
        </Link>
      </div>
    </div>
  );
}
