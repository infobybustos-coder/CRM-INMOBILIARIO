-- El guard de acceso (requireColaborador/esColaborador, en lib/auth.ts)
-- usa el cliente ligado a la sesión del propio colaborador, no el rol de
-- servicio — igual que requireSuperadmin ya hace con la tabla
-- superadmins. Sin esta política, RLS bloquea la lectura incluso de su
-- propia fila, así que esColaborador() siempre devuelve falso y el
-- panel nunca lo reconoce como colaborador.
CREATE POLICY "cada colaborador ve solo su propia fila"
  ON colaboradores
  FOR SELECT
  USING (id = auth.uid());
