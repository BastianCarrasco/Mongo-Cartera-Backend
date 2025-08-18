import type { ObjectId } from "mongodb";

export interface Academico {
  nombre: string;
  a_paterno: string;
  a_materno: string;
}

export interface Estudiante {
  // Define las propiedades de un estudiante si las tiene
  // Por ahora, asumimos que puede ser vacío o con cualquier tipo si no está estructurado.
  [key: string]: any; // Permite cualquier propiedad si no hay una estructura definida
}

export interface Project {
  _id?: ObjectId;
  id_kth?: string | null; // Parece que puede ser string o null, y a veces no está al inicio
  comentarios?: string;
  nombre: string;
  academicos: Academico[];
  estudiantes: Estudiante[]; // La imagen muestra un array vacío, pero lo dejamos como Estudiante[]
  monto: number;
  fecha_postulacion: string; // Si MongoDB lo guarda como ISODate, cámbialo a `Date`
  unidad: string;
  tematica: string;
  estatus: string;
  convocatoria: string;
  tipo_convocatoria: string;
  inst_conv: string;
  detalle_apoyo: string;
  apoyo: string;
  // Si los 'id_kth' y 'comentarios' al final del documento son los mismos
  // que los del principio, no los dupliques en la interfaz. Si son diferentes
  // (ej. de seguimiento), dales nombres únicos. Asumo que son los mismos.
}
