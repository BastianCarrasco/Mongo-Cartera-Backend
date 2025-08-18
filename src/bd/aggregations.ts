// src/bd/aggregations.ts
import { Collection } from "mongodb";
import type { Project, Academico } from "../types/project"; // Asegúrate de que las rutas sean correctas

interface MontoTotalPorTipoConvocatoriaResult {
  tipo_convocatoria: string;
  monto_total: number;
}

// Interfaz para los resultados de las agregaciones (opcional, pero buena práctica)
interface AcademicosProyectosConteoResult {
  nombre_completo_academico: string;
  cantidad_proyectos: number;
}

interface TematicaConteoResult {
  tematica: string;
  cantidad_proyectos: number;
}

interface UnidadConteoResult {
  unidad: string;
  cantidad_proyectos: number;
}

interface InstitucionConvocatoriaConteoResult {
  institucion_convocatoria: string;
  cantidad_proyectos: number;
}

interface TipoConvocatoriaConteoResult {
  tipo_convocatoria: string;
  cantidad_proyectos: number;
}

interface ProfesoresPorUnidadResult {
  unidad_academica: string;
  cantidad_profesores: number;
}

interface MontoTotalPorInstitucionResult {
  institucion_convocatoria: string;
  monto_total: number;
}

// --- Funciones para los pipelines de agregación ---
export async function getMontoTotalPorTipoConvocatoria(
  projectsCollection: Collection<Project>
): Promise<MontoTotalPorTipoConvocatoriaResult[]> {
  const pipeline = [
    // 1. Añadir una etapa para convertir 'monto' a un número.
    {
      $addFields: {
        monto_numeric: {
          $convert: {
            input: "$monto",
            to: "double",
            onError: 0,
            onNull: 0,
          },
        },
      },
    },
    // 2. Filtrar para asegurar que 'tipo_convocatoria' no sea nulo/vacío y que el monto convertido sea válido
    {
      $match: {
        tipo_convocatoria: { $nin: [null, "", "null"] },
        monto_numeric: { $ne: null },
      },
    },
    // 3. Agrupar por 'tipo_convocatoria' y sumar el 'monto_numeric'
    {
      $group: {
        _id: "$tipo_convocatoria", // Agrupamos por el tipo de convocatoria
        monto_total: { $sum: "$monto_numeric" }, // Sumamos los montos
      },
    },
    // 4. Proyectar para renombrar _id y dar formato a la salida
    {
      $project: {
        _id: 0,
        tipo_convocatoria: "$_id", // Renombramos _id a tipo_convocatoria
        monto_total: 1,
      },
    },
    // 5. Opcional: Ordenar por monto total (descendente)
    {
      $sort: { monto_total: -1, tipo_convocatoria: 1 },
    },
  ];
  return projectsCollection
    .aggregate<MontoTotalPorTipoConvocatoriaResult>(pipeline)
    .toArray();
}

export async function getAcademicosProyectosConteo(
  projectsCollection: Collection<Project>
): Promise<AcademicosProyectosConteoResult[]> {
  const pipeline = [
    { $unwind: "$academicos" },
    {
      $match: {
        "academicos.nombre": { $nin: [null, "", "null"] },
        "academicos.a_paterno": { $nin: [null, "", "null"] },
      },
    },
    {
      $group: {
        _id: {
          nombre: "$academicos.nombre",
          a_paterno: "$academicos.a_paterno",
        },
        cantidad_proyectos: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        nombre_completo_academico: {
          $concat: ["$_id.nombre", " ", "$_id.a_paterno"],
        },
        cantidad_proyectos: 1,
      },
    },
    { $sort: { nombre_completo_academico: 1 } },
  ];
  return projectsCollection
    .aggregate<AcademicosProyectosConteoResult>(pipeline)
    .toArray();
}

export async function getTematicasProyectosConteo(
  projectsCollection: Collection<Project>
): Promise<TematicaConteoResult[]> {
  const pipeline = [
    { $match: { tematica: { $nin: [null, "", "null"] } } },
    { $group: { _id: "$tematica", cantidad_proyectos: { $sum: 1 } } },
    { $project: { _id: 0, tematica: "$_id", cantidad_proyectos: 1 } },
    { $sort: { cantidad_proyectos: -1, tematica: 1 } },
  ];
  return projectsCollection.aggregate<TematicaConteoResult>(pipeline).toArray();
}

export async function getUnidadesProyectosConteo(
  projectsCollection: Collection<Project>
): Promise<UnidadConteoResult[]> {
  const pipeline = [
    { $match: { unidad: { $nin: [null, "", "null"] } } },
    { $group: { _id: "$unidad", cantidad_proyectos: { $sum: 1 } } },
    { $project: { _id: 0, unidad: "$_id", cantidad_proyectos: 1 } },
    { $sort: { cantidad_proyectos: -1, unidad: 1 } },
  ];
  return projectsCollection.aggregate<UnidadConteoResult>(pipeline).toArray();
}

export async function getInstitucionesConvocatoriaProyectosConteo(
  projectsCollection: Collection<Project>
): Promise<InstitucionConvocatoriaConteoResult[]> {
  const pipeline = [
    { $match: { inst_conv: { $nin: [null, "", "null"] } } },
    { $group: { _id: "$inst_conv", cantidad_proyectos: { $sum: 1 } } },
    {
      $project: {
        _id: 0,
        institucion_convocatoria: "$_id",
        cantidad_proyectos: 1,
      },
    },
    { $sort: { cantidad_proyectos: -1, institucion_convocatoria: 1 } },
  ];
  return projectsCollection
    .aggregate<InstitucionConvocatoriaConteoResult>(pipeline)
    .toArray();
}

export async function getTiposConvocatoriaProyectosConteo(
  projectsCollection: Collection<Project>
): Promise<TipoConvocatoriaConteoResult[]> {
  const pipeline = [
    { $match: { tipo_convocatoria: { $nin: [null, "", "null"] } } },
    { $group: { _id: "$tipo_convocatoria", cantidad_proyectos: { $sum: 1 } } },
    { $project: { _id: 0, tipo_convocatoria: "$_id", cantidad_proyectos: 1 } },
    { $sort: { cantidad_proyectos: -1, tipo_convocatoria: 1 } },
  ];
  return projectsCollection
    .aggregate<TipoConvocatoriaConteoResult>(pipeline)
    .toArray();
}

export async function getProfesoresPorUnidadAcademica(
  academicosCollection: Collection<Academico>
): Promise<ProfesoresPorUnidadResult[]> {
  const pipeline = [
    { $match: { unidad: { $nin: [null, "", "null"] } } },
    { $group: { _id: "$unidad", cantidad_profesores: { $sum: 1 } } },
    { $project: { _id: 0, unidad_academica: "$_id", cantidad_profesores: 1 } },
    { $sort: { cantidad_profesores: -1, unidad_academica: 1 } },
  ];
  return academicosCollection
    .aggregate<ProfesoresPorUnidadResult>(pipeline)
    .toArray();
}

export async function getMontoTotalPorInstitucion(
  projectsCollection: Collection<Project>
): Promise<MontoTotalPorInstitucionResult[]> {
  const pipeline = [
    {
      $addFields: {
        monto_numeric: {
          $convert: {
            input: "$monto",
            to: "double",
            onError: 0,
            onNull: 0,
          },
        },
      },
    },
    {
      $match: {
        inst_conv: { $nin: [null, "", "null"] },
        monto_numeric: { $ne: null },
      },
    },
    { $group: { _id: "$inst_conv", monto_total: { $sum: "$monto_numeric" } } },
    { $project: { _id: 0, institucion_convocatoria: "$_id", monto_total: 1 } },
    { $sort: { monto_total: -1, institucion_convocatoria: 1 } },
  ];
  return projectsCollection
    .aggregate<MontoTotalPorInstitucionResult>(pipeline)
    .toArray();
}
