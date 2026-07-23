export type EstadoColaborador = "activo" | "inactivo";

export type Colaborador = {
  id: string;
  nombreCompleto: string;
  email: string;
  codigoReferido: string;
  estado: EstadoColaborador;
  creadoEn: string;
};

export type EstadisticasColaborador = {
  totalRegistros: number;
  usuariosActivos: number;
  asesorFree: number;
  asesorPro: number;
  inmobiliariaFree: number;
  inmobiliariaPro: number;
  conversionProPct: number;
  ultimoRegistro: string | null;
};

export type ColaboradorConStats = Colaborador & EstadisticasColaborador;

export type ReferidoDetalle = {
  tenantId: string;
  nombre: string;
  email: string;
  tipoPlan: string;
  planTarifa: string;
  estado: string;
  creadoEn: string;
};

export type EstadisticasGlobales = EstadisticasColaborador & {
  totalColaboradores: number;
  registrosEsteMes: number;
};
