import type { ObjectId } from "mongodb"; // Importa ObjectId si lo usas en el _id

export interface Academico {
  _id?: ObjectId; // El campo _id es de tipo ObjectId y es opcional (MongoDB lo genera si no lo provees)
  nombre: string;
  email: string | null; // <--- Cambio aquí: email puede ser string (incluyendo "") o null
  a_materno: string | null; // Ya estaba string | null, string incluye ""
  a_paterno: string;
  unidad: string | null; // <--- Cambio aquí: unidad puede ser string (incluyendo "") o null
  link_foto: string | null; // <--- Cambio aquí: link_foto puede ser string (incluyendo "") o null
}
