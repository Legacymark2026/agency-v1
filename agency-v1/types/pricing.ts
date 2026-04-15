export type ServiceCategory = "Servicio Individual" | "Paquete Integral" | "Servicio Express";

export interface ServicePrice {
  id: string;
  codigo_id: string | null;
  nombre_servicio: string;
  categoria: string;
  tipo_formato: string | null;
  tiempo_estimado: string | null;
  herramientas: string | null;
  descripcion: string;
  precio_base: number;
  iva_porcentaje: number;
  retefuente_porc: number;
  reteiva_porc: number;
  ica_porc: number;
  precio_urgente: number | null; // Null if no express pricing
  isExpress: boolean; // Indicates if express is available for this service
  estado: "activo" | "inactivo";
  orderIndex: number;
}
