import type { ObjectId } from "mongodb";

export interface tipo_apoyo {
  _id?: ObjectId; // El campo _id es de tipo ObjectId y es opcional (MongoDB lo genera si no lo provees)
  tipo: string;
}
