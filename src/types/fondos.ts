// src/types/convocatoria.ts
import type { ObjectId } from "mongodb";

export interface Fondos {
  _id?: ObjectId;
  nombre: string;
  inicio: string; // Puedes cambiar a Date si lo manejas como objeto Date en tu app
  cierre: string; // Puedes cambiar a Date
  financiamiento: string; // Contiene "millones", así que es string
  plazo: string; // Contiene "meses", así que es string
  objetivo: string;
  trl: number;
  crl: number | null;
  team: number | null;
  brl: number | null;
  iprl: number | null;
  frl: number | null;
  tipo: number; // Asumo que es el ID del tipo de convocatoria (ej. de TIPO_CONV)
  req: string | null;
  // Si tienes campos de "Empresas Partners" o "Universidades Partners"
  // en la Convocatoria, agrégalos aquí también.
}
