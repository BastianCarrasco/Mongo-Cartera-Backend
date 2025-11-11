// src/routes/estadisticasBunRoutes.ts
import { Elysia } from "elysia";
import { getDb } from "../bd/mongo"; // Asegúrate de que esta ruta sea correcta

export const estadisticasBunRoutes = new Elysia({
  prefix: "/estadisticas-excel-bun",
})
  // ✅ GET: Resumen de estadísticas (monto total y por institución)
  .get(
    "/resumen",
    async () => {
      try {
        const db = await getDb();
        const collection = db.collection("EXCEL-BUN");

        const docs = await collection.find({}).toArray();

        let sumaMontoProyectosMM = 0;
        const montoPorInstitucion: Record<string, number> = {};

        for (const doc of docs) {
          const montoMM = parseFloat(
            String(doc["Monto Proyecto MM$"] || "0").replace(",", ".")
          );
          if (!isNaN(montoMM)) {
            sumaMontoProyectosMM += montoMM;
          }

          const institucion = String(
            doc["Institucion Convocatoria"] || "Sin Institución"
          ).trim();
          if (institucion && institucion.toLowerCase() !== "n/a") {
            const montoInstitucion = parseFloat(
              String(doc["Monto Proyecto MM$"] || "0").replace(",", ".")
            );
            if (!isNaN(montoInstitucion)) {
              montoPorInstitucion[institucion] =
                (montoPorInstitucion[institucion] || 0) + montoInstitucion;
            }
          }
        }

        const montoPorInstitucionResultado = Object.entries(montoPorInstitucion)
          .map(([institucion, monto]) => ({
            institucion,
            monto: monto * 1_000_000,
          }))
          .sort((a, b) => b.monto - a.monto);

        return {
          ok: true,
          message:
            "Resumen de estadísticas: Suma total de Monto Proyecto y monto por institución.",
          sumaMontoProyectos: sumaMontoProyectosMM * 1_000_000,
          montoPorInstitucion: {
            totalInstitucionesConMonto: montoPorInstitucionResultado.length,
            datos: montoPorInstitucionResultado,
          },
        };
      } catch (error) {
        console.error(
          "❌ Error al realizar el resumen de estadísticas:",
          error
        );
        return {
          ok: false,
          error: "No se pudo realizar el resumen de estadísticas.",
        };
      }
    },
    {
      detail: {
        summary:
          "Obtiene la suma total de 'Monto Proyecto MM$' (en millones) y el monto total agrupado por 'Institucion Convocatoria'.",
        tags: ["ANALISIS DE LOS DATOS"],
      },
    }
  )

  // ✅ GET: Proyectos por profesor
  .get(
    "/proyectos-por-profesor",
    async () => {
      try {
        const db = await getDb();
        const collection = db.collection("EXCEL-BUN");

        const conteoProyectosPorProfesor: Record<string, number> = {};
        const docs = await collection.find({}).toArray();

        for (const doc of docs) {
          const lideresRaw = String(doc["Académic@/s-Líder"] || "").trim();
          if (lideresRaw && lideresRaw.toLowerCase() !== "n/a") {
            lideresRaw
              .split(",")
              .map((nombre) => nombre.trim())
              .filter((nombre) => nombre)
              .forEach((profesor) => {
                conteoProyectosPorProfesor[profesor] =
                  (conteoProyectosPorProfesor[profesor] || 0) + 1;
              });
          }

          const partnersRaw = String(doc["Académic@/s-Partner"] || "").trim();
          if (partnersRaw && partnersRaw.toLowerCase() !== "n/a") {
            partnersRaw
              .split(",")
              .map((nombre) => nombre.trim())
              .filter((nombre) => nombre)
              .forEach((profesor) => {
                conteoProyectosPorProfesor[profesor] =
                  (conteoProyectosPorProfesor[profesor] || 0) + 1;
              });
          }
        }

        const proyectosPorProfesorResultado = Object.entries(
          conteoProyectosPorProfesor
        )
          .map(([nombre, cantidad]) => ({ nombre, cantidad }))
          .sort((a, b) => b.cantidad - a.cantidad);

        return {
          ok: true,
          message:
            "Conteo de proyectos por profesor (Académic@/s-Líder y Académic@/s-Partner).",
          totalProfesoresConProyectos: proyectosPorProfesorResultado.length,
          datos: proyectosPorProfesorResultado,
        };
      } catch (error) {
        console.error("❌ Error al contar proyectos por profesor:", error);
        return {
          ok: false,
          error: "No se pudo obtener el conteo de proyectos por profesor.",
        };
      }
    },
    {
      detail: {
        summary:
          "Retorna el número de proyectos asociados a cada profesor, incluyendo aquellos listados como Líder o Partner.",
        tags: ["GRAFICOS"],
      },
    }
  )

  // ✅ GET: Proyectos por temática (campo "Temática")
  .get(
    "/proyectos-por-tematica",
    async () => {
      try {
        const db = await getDb();
        const collection = db.collection("EXCEL-BUN");

        const conteoProyectosPorTematica: Record<string, number> = {};
        const docs = await collection.find({}).toArray();

        for (const doc of docs) {
          const tematicasRaw = String(doc["Temática"] || "").trim();
          if (tematicasRaw && tematicasRaw.toLowerCase() !== "n/a") {
            tematicasRaw
              .split(",")
              .map((tema) => tema.trim())
              .filter((tema) => tema)
              .forEach((temaUnico) => {
                conteoProyectosPorTematica[temaUnico] =
                  (conteoProyectosPorTematica[temaUnico] || 0) + 1;
              });
          }
        }

        const proyectosPorTematicaResultado = Object.entries(
          conteoProyectosPorTematica
        )
          .map(([nombre, cantidad]) => ({ nombre, cantidad }))
          .sort((a, b) => b.cantidad - a.cantidad);

        return {
          ok: true,
          message: "Conteo de proyectos por temática (campo 'Temática').",
          totalTematicasConProyectos: proyectosPorTematicaResultado.length,
          datos: proyectosPorTematicaResultado,
        };
      } catch (error) {
        console.error("❌ Error al contar proyectos por temática:", error);
        return {
          ok: false,
          error: "No se pudo obtener el conteo de proyectos por temática.",
        };
      }
    },
    {
      detail: {
        summary:
          "Retorna el número de proyectos asociados a cada temática. Maneja múltiples temáticas por proyecto.",
        tags: ["GRAFICOS"],
      },
    }
  )

  // ✅ GET: Proyectos por Unidad Académica (combinando ambos campos)
  .get(
    "/proyectos-por-unidad-academica",
    async () => {
      try {
        const db = await getDb();
        const collection = db.collection("EXCEL-BUN");

        const conteoProyectosPorUnidadAcademica: Record<string, number> = {};
        const docs = await collection.find({}).toArray();

        for (const doc of docs) {
          let unidadesDelProyecto: string[] = [];

          const unidadBase = String(doc["Unidad Académica"] || "").trim();
          if (unidadBase && unidadBase.toLowerCase() !== "n/a") {
            unidadesDelProyecto = [
              ...unidadesDelProyecto,
              ...unidadBase
                .split(",")
                .map((u) => u.trim())
                .filter((u) => u),
            ];
          }

          const unidadExtra = doc["Unidad Académica ++"];
          if (unidadExtra) {
            let extraArray: string[] = [];
            if (Array.isArray(unidadExtra)) {
              extraArray = unidadExtra.map((u) => String(u).trim());
            } else if (typeof unidadExtra === "string" && unidadExtra.trim()) {
              extraArray = unidadExtra.split(",").map((u) => u.trim());
            }

            unidadesDelProyecto = [
              ...unidadesDelProyecto,
              ...extraArray.filter((u) => u && u.toLowerCase() !== "n/a"),
            ];
          }

          const unidadesUnicasPorProyecto = [...new Set(unidadesDelProyecto)];

          for (const unidad of unidadesUnicasPorProyecto) {
            conteoProyectosPorUnidadAcademica[unidad] =
              (conteoProyectosPorUnidadAcademica[unidad] || 0) + 1;
          }
        }

        const proyectosPorUnidadAcademicaResultado = Object.entries(
          conteoProyectosPorUnidadAcademica
        )
          .map(([nombre, cantidad]) => ({ nombre, cantidad }))
          .sort((a, b) => b.cantidad - a.cantidad);

        return {
          ok: true,
          message:
            "Conteo de proyectos por Unidad Académica (combinando 'Unidad Académica' y 'Unidad Académica ++').",
          totalUnidadesAcademicasConProyectos:
            proyectosPorUnidadAcademicaResultado.length,
          datos: proyectosPorUnidadAcademicaResultado,
        };
      } catch (error) {
        console.error(
          "❌ Error al contar proyectos por unidad académica:",
          error
        );
        return {
          ok: false,
          error:
            "No se pudo obtener el conteo de proyectos por unidad académica.",
        };
      }
    },
    {
      detail: {
        summary:
          "Retorna el número de proyectos asociados a cada Unidad Académica, combinando los campos 'Unidad Académica' y 'Unidad Académica ++'.",
        tags: ["GRAFICOS"],
      },
    }
  )

  // ✅ GET: Profesores únicos por Unidad Académica
  .get(
    "/profesores-por-unidad-academica",
    async () => {
      try {
        const db = await getDb();
        const collection = db.collection("EXCEL-BUN");

        const profesoresUnicosPorUnidad: Record<string, Set<string>> = {};
        const docs = await collection.find({}).toArray();

        for (const doc of docs) {
          let unidadesDelProyecto: string[] = [];
          let profesoresDelProyecto: string[] = [];

          const unidadBase = String(doc["Unidad Académica"] || "").trim();
          if (unidadBase && unidadBase.toLowerCase() !== "n/a") {
            unidadesDelProyecto = [
              ...unidadesDelProyecto,
              ...unidadBase
                .split(",")
                .map((u) => u.trim())
                .filter((u) => u),
            ];
          }

          const unidadExtra = doc["Unidad Académica ++"];
          if (unidadExtra) {
            let extraArray: string[] = [];
            if (Array.isArray(unidadExtra)) {
              extraArray = unidadExtra.map((u) => String(u).trim());
            } else if (typeof unidadExtra === "string" && unidadExtra.trim()) {
              extraArray = unidadExtra.split(",").map((u) => u.trim());
            }
            unidadesDelProyecto = [
              ...unidadesDelProyecto,
              ...extraArray.filter((u) => u && u.toLowerCase() !== "n/a"),
            ];
          }
          const unidadesUnicasPorProyecto = [...new Set(unidadesDelProyecto)];

          const lideresRaw = String(doc["Académic@/s-Líder"] || "").trim();
          if (lideresRaw && lideresRaw.toLowerCase() !== "n/a") {
            profesoresDelProyecto = [
              ...profesoresDelProyecto,
              ...lideresRaw
                .split(",")
                .map((nombre) => nombre.trim())
                .filter((nombre) => nombre),
            ];
          }

          const partnersRaw = String(doc["Académic@/s-Partner"] || "").trim();
          if (partnersRaw && partnersRaw.toLowerCase() !== "n/a") {
            profesoresDelProyecto = [
              ...profesoresDelProyecto,
              ...partnersRaw
                .split(",")
                .map((nombre) => nombre.trim())
                .filter((nombre) => nombre),
            ];
          }
          const profesoresUnicosDelProyecto = [
            ...new Set(profesoresDelProyecto),
          ];

          if (profesoresUnicosDelProyecto.length > 0) {
            for (const unidad of unidadesUnicasPorProyecto) {
              if (!profesoresUnicosPorUnidad[unidad]) {
                profesoresUnicosPorUnidad[unidad] = new Set<string>();
              }
              for (const profesor of profesoresUnicosDelProyecto) {
                profesoresUnicosPorUnidad[unidad].add(profesor);
              }
            }
          }
        }

        const resultadoProfesoresPorUnidad = Object.entries(
          profesoresUnicosPorUnidad
        )
          .map(([unidad, setProfesores]) => ({
            unidad,
            totalProfesoresUnicos: setProfesores.size,
          }))
          .sort((a, b) => b.totalProfesoresUnicos - a.totalProfesoresUnicos);

        return {
          ok: true,
          message:
            "Conteo de profesores únicos asociados a cada Unidad Académica (combinando Líder, Partner y ambas unidades).",
          totalUnidadesConProfesores: resultadoProfesoresPorUnidad.length,
          datos: resultadoProfesoresPorUnidad,
        };
      } catch (error) {
        console.error(
          "❌ Error al contar profesores por unidad académica:",
          error
        );
        return {
          ok: false,
          error:
            "No se pudo obtener el conteo de profesores por unidad académica.",
        };
      }
    },
    {
      detail: {
        summary:
          "Retorna el número de profesores únicos asociados a cada Unidad Académica, combinando los campos de académicos (Líder/Partner) y unidades académicas ('Unidad Académica'/'Unidad Académica ++').",
        tags: ["GRAFICOS"],
      },
    }
  );
