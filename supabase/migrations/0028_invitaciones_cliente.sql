-- =====================================================================
-- 0028 — Invitaciones de cliente: al dar de alta un cliente manualmente
-- desde el superadmin, ya no se elige tipo de plan ahí. Se guarda solo
-- el dato de contacto y se invita por email (Supabase Auth) a que el
-- propio cliente complete su registro — elija Asesor/Inmobiliaria y su
-- plan — con la misma lógica que el signup público.
-- =====================================================================

CREATE TABLE IF NOT EXISTS invitaciones_cliente (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id  UUID NOT NULL UNIQUE REFERENCES auth.users (id) ON DELETE CASCADE,
  empresa     TEXT NOT NULL,
  contacto    TEXT NOT NULL,
  pais        TEXT NOT NULL,
  telefono    TEXT NOT NULL,
  completado  BOOLEAN NOT NULL DEFAULT false,
  creado_en   TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE invitaciones_cliente ENABLE ROW LEVEL SECURITY;
-- Sin políticas: solo se lee/escribe con el rol de servicio, desde las
-- acciones del servidor.
