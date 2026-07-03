export default function AdminPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Administración</h1>
      <p className="text-sm text-muted-foreground">
        Solo visible para el rol admin. Aquí irá la gestión del equipo (invitar
        empleados, ver y editar roles) y los indicadores agregados de la
        inmobiliaria.
      </p>

      <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
        Próximo módulo: gestión de equipo (ya hay invitaciones e infraestructura
        de roles en la base de datos, falta la interfaz).
      </div>
    </div>
  );
}
