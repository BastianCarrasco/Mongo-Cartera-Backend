import type { ObjectId } from "mongodb"; // Importa ObjectId si lo usas en el _id

export interface Estudiantes {
  _id?: ObjectId; // El campo _id es de tipo ObjectId y es opcional (MongoDB lo genera si no lo provees)
  nombre: string;
  // CAMBIO AQUÍ: email ahora puede ser string (incluyendo ""), o null
  email: string | null;
  // CAMBIO AQUÍ: a_materno ya es string | null, pero es importante que "string" incluya la posibilidad de ""
  a_materno: string | null;
  a_paterno: string;
  // CAMBIO AQUÍ: unidad ahora puede ser string (incluyendo ""), o null
  unidad: string | null;
  // ¡MUY IMPORTANTE! Agregué 'link_foto' ya que tus rutas lo manejan y no estaba en la interfaz.
  // También puede ser string (incluyendo "") o null.
  link_foto: string | null;
}
