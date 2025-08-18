import type { ObjectId } from "mongodb"; // Importa ObjectId si lo usas en el _id

export interface Institucion {
  _id?: ObjectId; // El campo _id es de tipo ObjectId y es opcional (MongoDB lo genera si no lo provees)
  nombre: string;
}
