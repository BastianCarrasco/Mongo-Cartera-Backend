// src/routes/EstadisticasRoutes.ts
import { Elysia, t } from "elysia";
import { Collection } from "mongodb";
import { getDb } from "../../bd/mongo";
import {
  getAcademicosProyectosConteo,
  getTematicasProyectosConteo,
  getUnidadesProyectosConteo,
  getInstitucionesConvocatoriaProyectosConteo,
  getTiposConvocatoriaProyectosConteo,
  getProfesoresPorUnidadAcademica,
  getMontoTotalPorInstitucion,
  getMontoTotalPorTipoConvocatoria, // <--- Importa la nueva función
} from "../../bd/aggregations";
import type { Project, Academico } from "../../types/project";

// Nombre de las colecciones
const PROJECT_COLLECTION_NAME = "PROYECTOS";
const ACADEMICOS_COLLECTION_NAME = "ACADEMICOS";

export const EstadisticasRoutes = new Elysia({ prefix: "/proyectos" })
  .get(
    "/academicos/proyectos-conteo-nombre-completo",
    async () => {
      const db = getDb();
      const projectsCollection = db.collection<Project>(
        PROJECT_COLLECTION_NAME
      );
      const data = await getAcademicosProyectosConteo(projectsCollection);
      return { success: true, data };
    },
    {
      detail: {
        summary:
          "Obtener el conteo de proyectos por académico con nombre y apellido paterno",
        tags: ["Estadisticas"],
      },
    }
  )
  .get(
    "/tematicas/proyectos-conteo",
    async () => {
      const db = getDb();
      const projectsCollection = db.collection<Project>(
        PROJECT_COLLECTION_NAME
      );
      const data = await getTematicasProyectosConteo(projectsCollection);
      return { success: true, data };
    },
    {
      detail: {
        summary: "Obtener el conteo de proyectos por temática",
        tags: ["Estadisticas"],
      },
    }
  )
  .get(
    "/unidades/proyectos-conteo",
    async () => {
      const db = getDb();
      const projectsCollection = db.collection<Project>(
        PROJECT_COLLECTION_NAME
      );
      const data = await getUnidadesProyectosConteo(projectsCollection);
      return { success: true, data };
    },
    {
      detail: {
        summary: "Obtener el conteo de proyectos por unidad",
        tags: ["Estadisticas"],
      },
    }
  )
  .get(
    "/instituciones-convocatoria/proyectos-conteo",
    async () => {
      const db = getDb();
      const projectsCollection = db.collection<Project>(
        PROJECT_COLLECTION_NAME
      );
      const data = await getInstitucionesConvocatoriaProyectosConteo(
        projectsCollection
      );
      return { success: true, data };
    },
    {
      detail: {
        summary:
          "Obtener el conteo de proyectos por institución de convocatoria",
        tags: ["Estadisticas"],
      },
    }
  )
  .get(
    "/tipos-convocatoria/proyectos-conteo",
    async () => {
      const db = getDb();
      const projectsCollection = db.collection<Project>(
        PROJECT_COLLECTION_NAME
      );
      const data = await getTiposConvocatoriaProyectosConteo(
        projectsCollection
      );
      return { success: true, data };
    },
    {
      detail: {
        summary: "Obtener el conteo de proyectos por tipo de convocatoria",
        tags: ["Estadisticas"],
      },
    }
  )
  .get(
    "/profesores/por-unidad-academica",
    async () => {
      const db = getDb();
      const academicosCollection = db.collection<Academico>(
        ACADEMICOS_COLLECTION_NAME
      );
      const data = await getProfesoresPorUnidadAcademica(academicosCollection);
      return { success: true, data };
    },
    {
      detail: {
        summary: "Obtener el conteo de profesores por unidad académica",
        tags: ["Estadisticas"],
      },
    }
  )
  .get(
    "/instituciones-convocatoria/monto-total",
    async () => {
      const db = getDb();
      const projectsCollection = db.collection<Project>(
        PROJECT_COLLECTION_NAME
      );
      const data = await getMontoTotalPorInstitucion(projectsCollection);
      return { success: true, data };
    },
    {
      detail: {
        summary:
          "Obtener el monto total de proyectos por institución de convocatoria",
        tags: ["Estadisticas"],
      },
    }
  )
  .get(
    "/tipos-convocatoria/monto-total", // **NUEVO ENDPOINT: Monto total por tipo de convocatoria**
    async () => {
      const db = getDb();
      const projectsCollection = db.collection<Project>(
        PROJECT_COLLECTION_NAME
      );
      const data = await getMontoTotalPorTipoConvocatoria(projectsCollection); // <--- Llama a la nueva función
      return { success: true, data };
    },
    {
      detail: {
        summary: "Obtener el monto total de proyectos por tipo de convocatoria",
        tags: ["Estadisticas"],
      },
    }
  );
