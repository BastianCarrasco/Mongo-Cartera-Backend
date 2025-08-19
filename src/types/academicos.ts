import type { ObjectId } from "mongodb"; // Importa ObjectId si lo usas en el _id

export interface Academico {
  _id?: ObjectId; // El campo _id es de tipo ObjectId y es opcional (MongoDB lo genera si no lo provees)
  nombre: string;
  email: string;
  a_materno: string | null; // Puede ser string o null, según tu ejemplo
  a_paterno: string;
  unidad: string;
  link_foto: string;
}
