import type { ObjectId } from "mongodb";

export interface Academico {
  nombre: string | null; // Nombre del académico puede ser string o null
  a_paterno: string | null; // Apellido paterno del académico puede ser string o null
  a_materno: string | null; // Apellido materno del académico puede ser string o null
}

export interface Estudiante {
  nombre: string | null; // Nombre del estudiante puede ser string o null
  a_paterno: string | null; // Apellido paterno del estudiante puede ser string o null
  a_materno: string | null; // Apellido materno del estudiante puede ser string o null
}

export interface Project {
  _id?: ObjectId;
  id_kth: string | null; // Puede ser string o null
  comentarios: string | null; // Puede ser string o null
  nombre: string; // <--- OBLIGATORIO: Siempre debe ser un string no nulo ni vacío
  academicos: Academico[]; // <--- OBLIGATORIO: Debe ser un array, y se espera que no esté vacío.
  estudiantes: Estudiante[]; // Puede ser un array vacío, los elementos internos pueden ser nulos
  monto: number | null; // Puede ser número o null
  fecha_postulacion: string | null; // Puede ser string o null
  unidad: string | null; // Puede ser string o null
  tematica: string | null; // Puede ser string o null
  estatus: string | null; // Puede ser string o null
  convocatoria: string | null; // Puede ser string o null
  tipo_convocatoria: string | null; // Puede ser string o null
  inst_conv: string | null; // Puede ser string o null
  detalle_apoyo: string | null; // Puede ser string o null
  apoyo: string | null; // Puede ser string o null
}
