import type { ObjectId } from "mongodb"; // Importa ObjectId si lo usas en el _id

export interface respuestas_perfil {
  _id?: ObjectId;
  titulo: string;
  investigador: string;
  escuela: string;
  respuestas: string[]; // Un array de strings para las respuestas
  fecha_creacion: Date;
}
