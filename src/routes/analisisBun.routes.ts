// src/routes/analisisBunRoutes.ts
import { Elysia } from "elysia";
import { getDb } from "../bd/mongo"; // Asegúrate de que esta ruta sea correcta

export const analisisBunRoutes = new Elysia({ prefix: "/excel-bun" }).get(
  "/analisis-completo",
  async () => {
    try {
      const db = await getDb();
      const collection = db.collection("EXCEL-BUN");

      const totalProyectos = await collection.countDocuments();
      const docs = await collection.find({}).toArray();

      const conteoTematicas: Record<string, number> = {};
      const conteoEstatus: Record<string, number> = {};
      const conteoTipoApoyo: Record<string, number> = {};
      const conteoUnidades: Record<string, number> = {};
      const conteoTipoConvocatoria: Record<string, number> = {};
      const conteoInstitucionConvocatoria: Record<string, number> = {};
      const academicosUnicos = new Set<string>();

      for (const doc of docs) {
        // --- Temáticas
        const tema = String(doc["Temática"] || "Sin temática").trim();
        if (tema && tema.toLowerCase() !== "n/a") {
          conteoTematicas[tema] = (conteoTematicas[tema] || 0) + 1;
        }

        // --- Estatus
        const estatus = String(doc["Estatus"] || "Sin estatus").trim();
        if (estatus && estatus.toLowerCase() !== "n/a") {
          conteoEstatus[estatus] = (conteoEstatus[estatus] || 0) + 1;
        }

        // --- Tipo Apoyo
        const tipoApoyo = String(
          doc["Tipo Apoyo"] || "Sin tipo de apoyo"
        ).trim();
        if (tipoApoyo && tipoApoyo.toLowerCase() !== "n/a") {
          conteoTipoApoyo[tipoApoyo] = (conteoTipoApoyo[tipoApoyo] || 0) + 1;
        }

        // --- Unidades Académicas (combinadas: "Unidad Académica" y "Unidad Académica ++")
        let unidadesBase: string[] = [];
        const unidadBase = doc["Unidad Académica"];
        if (typeof unidadBase === "string" && unidadBase.trim()) {
          unidadesBase = unidadBase
            .split(",")
            .map((u) => u.trim())
            .filter((u) => u && u.toLowerCase() !== "n/a");
        }

        let unidadesExtra: string[] = [];
        const unidadExtra = doc["Unidad Académica ++"];
        if (Array.isArray(unidadExtra)) {
          unidadesExtra = unidadExtra
            .map((u) => String(u).trim())
            .filter((u) => u && u.toLowerCase() !== "n/a");
        } else if (typeof unidadExtra === "string" && unidadExtra.trim()) {
          unidadesExtra = unidadExtra
            .split(",")
            .map((u) => u.trim())
            .filter((u) => u && u.toLowerCase() !== "n/a");
        }

        const todasUnidades = [...new Set([...unidadesBase, ...unidadesExtra])];
        for (const unidad of todasUnidades) {
          conteoUnidades[unidad] = (conteoUnidades[unidad] || 0) + 1;
        }

        // --- Tipo Convocatoria
        const tipoConvocatoria = String(
          doc["Tipo Convocatoria"] || "Sin tipo de convocatoria"
        ).trim();
        if (tipoConvocatoria && tipoConvocatoria.toLowerCase() !== "n/a") {
          conteoTipoConvocatoria[tipoConvocatoria] =
            (conteoTipoConvocatoria[tipoConvocatoria] || 0) + 1;
        }

        // --- Institucion Convocatoria
        const institucionConvocatoria = String(
          doc["Institucion Convocatoria"] || "Sin institucion de convocatoria"
        ).trim();
        if (
          institucionConvocatoria &&
          institucionConvocatoria.toLowerCase() !== "n/a"
        ) {
          conteoInstitucionConvocatoria[institucionConvocatoria] =
            (conteoInstitucionConvocatoria[institucionConvocatoria] || 0) + 1;
        }

        // --- Académicos (Líder y Partner)
        const lider = String(doc["Académic@/s-Líder"] || "").trim();
        if (lider && lider.toLowerCase() !== "n/a") {
          lider
            .split(",")
            .map((a) => a.trim())
            .filter((a) => a)
            .forEach((a) => academicosUnicos.add(a));
        }

        const partner = String(doc["Académic@/s-Partner"] || "").trim();
        if (partner && partner.toLowerCase() !== "n/a") {
          partner
            .split(",")
            .map((a) => a.trim())
            .filter((a) => a)
            .forEach((a) => academicosUnicos.add(a));
        }
      }

      const tematicasResultado = Object.entries(conteoTematicas)
        .map(([nombre, cantidad]) => ({ nombre, cantidad }))
        .sort((a, b) => b.cantidad - a.cantidad);

      const estatusResultado = Object.entries(conteoEstatus)
        .map(([nombre, cantidad]) => ({ nombre, cantidad }))
        .sort((a, b) => b.cantidad - a.cantidad);

      const tipoApoyoResultado = Object.entries(conteoTipoApoyo)
        .map(([nombre, cantidad]) => ({ nombre, cantidad }))
        .sort((a, b) => b.cantidad - a.cantidad);

      const unidadesResultado = Object.entries(conteoUnidades)
        .map(([nombre, cantidad]) => ({ nombre, cantidad }))
        .sort((a, b) => b.cantidad - a.cantidad);

      const tipoConvocatoriaResultado = Object.entries(conteoTipoConvocatoria)
        .map(([nombre, cantidad]) => ({ nombre, cantidad }))
        .sort((a, b) => b.cantidad - a.cantidad);

      const institucionConvocatoriaResultado = Object.entries(
        conteoInstitucionConvocatoria
      )
        .map(([nombre, cantidad]) => ({ nombre, cantidad }))
        .sort((a, b) => b.cantidad - a.cantidad);

      return {
        ok: true,
        message:
          "Análisis completo de proyectos en EXCEL-BUN: Conteo total, temáticas, estatus, tipo de apoyo, unidades académicas, tipos/instituciones de convocatoria y total de académicos únicos.",
        totalProyectos: totalProyectos,
        tematicas: {
          totalTematicasDistintas: tematicasResultado.length,
          datos: tematicasResultado,
        },
        estatus: {
          totalEstatusDistintos: estatusResultado.length,
          datos: estatusResultado,
        },
        tipoApoyo: {
          totalTiposApoyoDistintos: tipoApoyoResultado.length,
          datos: tipoApoyoResultado,
        },
        unidadesAcademicas: {
          totalUnidadesDistintas: unidadesResultado.length,
          datos: unidadesResultado,
        },
        tipoConvocatoria: {
          totalTiposConvocatoriaDistintos: tipoConvocatoriaResultado.length,
          datos: tipoConvocatoriaResultado,
        },
        institucionConvocatoria: {
          totalInstitucionesConvocatoriaDistintas:
            institucionConvocatoriaResultado.length,
          datos: institucionConvocatoriaResultado,
        },
        academicos: {
          totalAcademicosUnicos: academicosUnicos.size,
        },
      };
    } catch (error) {
      console.error("❌ Error al realizar el análisis completo:", error);
      return {
        ok: false,
        error: "No se pudo realizar el análisis completo de datos.",
      };
    }
  },
  {
    detail: {
      summary:
        "Obtiene un análisis completo de la colección EXCEL-BUN, incluyendo conteo total, temáticas, estatus, tipo de apoyo, unidades académicas (combinadas), tipos/instituciones de convocatoria y el número de académicos únicos (Líder/Partner).",
      tags: ["ANALISIS DE LOS DATOS"],
    },
  }
);
