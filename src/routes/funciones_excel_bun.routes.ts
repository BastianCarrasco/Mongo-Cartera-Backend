import { Elysia } from "elysia";
import { getDb } from "../bd/mongo";

export const funcionesExcelBunRoutes = new Elysia({ prefix: "/excel-bun" })

  // ✅ GET: cuenta total de proyectos
  .get(
    "/numero-proyectos",
    async () => {
      try {
        const db = await getDb();
        const collection = db.collection("EXCEL-BUN");
        const count = await collection.countDocuments();
        return {
          ok: true,
          message: "Conteo total de proyectos en EXCEL-BUN",
          count,
        };
      } catch (error) {
        console.error("❌ Error al contar proyectos:", error);
        return { ok: false, error: "No se pudo obtener el conteo." };
      }
    },
    {
      detail: {
        summary:
          "Obtiene el número total de proyectos en la colección EXCEL-BUN -MongoDB",
        tags: ["ANALISIS DE LOS DATOS"],
      },
    }
  )

  // ✅ GET: análisis general — incluye número total de proyectos y valores distintos
  .get(
    "/analisis",
    async () => {
      try {
        const db = await getDb();
        const collection = db.collection("EXCEL-BUN");

        // 🔹 Contar número total de proyectos
        const totalProyectos = await collection.countDocuments();

        // 🔹 Obtener todos los documentos para el análisis
        const docs = await collection.find({}).toArray();

        const temas = new Set<string>();
        const estatus = new Set<string>();
        const tipoApoyo = new Set<string>();
        const detalleApoyo = new Set<string>();
        const academicos = new Set<string>();
        const estudiantes = new Set<string>();
        const unidades = new Set<string>();
        const convocatoriasNombre = new Set<string>();
        const tipoConvocatoria = new Set<string>();
        const instituciones = new Set<string>();

        for (const doc of docs) {
          if (doc["Temática"]) temas.add(String(doc["Temática"]).trim());
          if (doc["Estatus"]) estatus.add(String(doc["Estatus"]).trim());
          if (doc["Tipo Apoyo"])
            tipoApoyo.add(String(doc["Tipo Apoyo"]).trim());
          if (doc["Detalle Apoyo"])
            detalleApoyo.add(String(doc["Detalle Apoyo"]).trim());
          if (doc["Unidad Académica"])
            unidades.add(String(doc["Unidad Académica"]).trim());
          if (doc["Nombre Convocatoria a la que se postuló"])
            convocatoriasNombre.add(
              String(doc["Nombre Convocatoria a la que se postuló"]).trim()
            );
          if (doc["Tipo Convocatoria"])
            tipoConvocatoria.add(String(doc["Tipo Convocatoria"]).trim());
          if (doc["Institucion Convocatoria"])
            instituciones.add(String(doc["Institucion Convocatoria"]).trim());

          // 🧩 Académicos (líder + partner)
          const lider = doc["Académic@/s-Líder"];
          const partner = doc["Académic@/s-Partner"];
          const combined = [lider, partner]
            .filter(Boolean)
            .join(",")
            .split(",")
            .map((n) => n.trim())
            .filter((n) => n && n.toLowerCase() !== "n/a");
          combined.forEach((n) => academicos.add(n));

          // 🧩 Estudiantes
          const estudiantesRaw = String(doc["Estudiantes"] || "")
            .split(",")
            .map((n) => n.trim())
            .filter((n) => n && n.toLowerCase() !== "n/a");
          estudiantesRaw.forEach((n) => estudiantes.add(n));
        }

        return {
          ok: true,
          message:
            "Análisis general: número total de proyectos y valores distintos por categoría en EXCEL-BUN",
          resumen: {
            "Total proyectos": totalProyectos,
            "Temática ": temas.size,
            "Estatus ": estatus.size,
            "Tipo Apoyo ": tipoApoyo.size,
            "Detalle Apoyo ": detalleApoyo.size,
            "Académic@/s ": academicos.size,
            "Estudiantes ": estudiantes.size,
            "Unidad Académica ": unidades.size,
            "Nombre Convocatoria a la que se postuló ":
              convocatoriasNombre.size,
            "Tipo Convocatoria ": tipoConvocatoria.size,
            "Institucion Convocatoria ": instituciones.size,
          },
        };
      } catch (error) {
        console.error("❌ Error en análisis EXCEL-BUN:", error);
        return {
          ok: false,
          error: "No se pudo realizar el análisis de datos en EXCEL-BUN .",
        };
      }
    },
    {
      detail: {
        summary:
          "Obtiene el número total de proyectos y la cantidad de valores distintos por categoría en EXCEL-BUN -MongoDB",
        tags: ["ANALISIS DE LOS DATOS"],
      },
    }
  )
  // ✅ GET: temáticas y sus ocurrencias
  .get(
    "/tematicas",
    async () => {
      try {
        const db = await getDb();
        const collection = db.collection("EXCEL-BUN");
        const docs = await collection.find({}).toArray();

        const conteoTematicas: Record<string, number> = {};

        for (const doc of docs) {
          const tema = String(doc["Temática"] || "Sin temática").trim();
          if (tema && tema.toLowerCase() !== "n/a") {
            conteoTematicas[tema] = (conteoTematicas[tema] || 0) + 1;
          }
        }

        const resultado = Object.entries(conteoTematicas)
          .map(([nombre, cantidad]) => ({ nombre, cantidad }))
          .sort((a, b) => b.cantidad - a.cantidad); // opcional: ordenar desc

        return {
          ok: true,
          message: "Temáticas y su cantidad de ocurrencias en EXCEL-BUN",
          totalTematicas: resultado.length,
          datos: resultado,
        };
      } catch (error) {
        console.error("❌ Error al contar temáticas:", error);
        return { ok: false, error: "No se pudo calcular las temáticas." };
      }
    },
    {
      detail: {
        summary:
          "Devuelve las temáticas y cuántas veces se repiten en EXCEL-BUN -MongoDB",
        tags: ["ANALISIS DE LOS DATOS"],
      },
    }
  )

  .get(
    "/estatus",
    async () => {
      try {
        const db = await getDb();
        const collection = db.collection("EXCEL-BUN");
        const docs = await collection.find({}).toArray();

        const conteoEstatus: Record<string, number> = {};

        for (const doc of docs) {
          const estatus = String(doc["Estatus"] || "Sin estatus").trim();
          if (estatus && estatus.toLowerCase() !== "n/a") {
            conteoEstatus[estatus] = (conteoEstatus[estatus] || 0) + 1;
          }
        }

        const resultado = Object.entries(conteoEstatus)
          .map(([nombre, cantidad]) => ({ nombre, cantidad }))
          .sort((a, b) => b.cantidad - a.cantidad); // opcional: ordenar desc

        return {
          ok: true,
          message: "Estatus y su cantidad de ocurrencias en EXCEL-BUN",
          totalEstatus: resultado.length,
          datos: resultado,
        };
      } catch (error) {
        console.error("❌ Error al contar estatus:", error);
        return { ok: false, error: "No se pudo calcular los estatus." };
      }
    },
    {
      detail: {
        summary:
          "Devuelve los estatus y cuántas veces se repiten en EXCEL-BUN -MongoDB",
        tags: ["ANALISIS DE LOS DATOS"],
      },
    }
  )
  .get(
    "/ua",
    async () => {
      try {
        const db = await getDb();
        const collection = db.collection("EXCEL-BUN");
        const docs = await collection.find({}).toArray();

        const conteoUnidadAcademica: Record<string, number> = {};

        for (const doc of docs) {
          const estatus = String(
            doc["Unidad Académica"] || "Sin unidad académica"
          ).trim();
          if (estatus && estatus.toLowerCase() !== "n/a") {
            conteoUnidadAcademica[estatus] =
              (conteoUnidadAcademica[estatus] || 0) + 1;
          }
        }

        const resultado = Object.entries(conteoUnidadAcademica)
          .map(([nombre, cantidad]) => ({ nombre, cantidad }))
          .sort((a, b) => b.cantidad - a.cantidad); // opcional: ordenar desc

        return {
          ok: true,
          message: "Unidad Académica y su cantidad de ocurrencias en EXCEL-BUN",
          totalUnidadAcademica: resultado.length,
          datos: resultado,
        };
      } catch (error) {
        console.error("❌ Error al contar unidad académica:", error);
        return { ok: false, error: "No se pudo calcular la unidad académica." };
      }
    },
    {
      detail: {
        summary:
          "Devuelve los estatus y cuántas veces se repiten en EXCEL-BUN -MongoDB",
        tags: ["ANALISIS DE LOS DATOS"],
      },
    }
  )
  .get(
    "/tipo_convocatoria",
    async () => {
      try {
        const db = await getDb();
        const collection = db.collection("EXCEL-BUN");
        const docs = await collection.find({}).toArray();

        const conteoTipoConvocatoria: Record<string, number> = {};

        for (const doc of docs) {
          const estatus = String(
            doc["Tipo Convocatoria"] || "Sin tipo de convocatoria"
          ).trim();
          if (estatus && estatus.toLowerCase() !== "n/a") {
            conteoTipoConvocatoria[estatus] =
              (conteoTipoConvocatoria[estatus] || 0) + 1;
          }
        }

        const resultado = Object.entries(conteoTipoConvocatoria)
          .map(([nombre, cantidad]) => ({ nombre, cantidad }))
          .sort((a, b) => b.cantidad - a.cantidad); // opcional: ordenar desc

        return {
          ok: true,
          message:
            "Tipo de Convocatoria y su cantidad de ocurrencias en EXCEL-BUN",
          totalTipoConvocatoria: resultado.length,
          datos: resultado,
        };
      } catch (error) {
        console.error("❌ Error al contar tipo de convocatoria:", error);
        return {
          ok: false,
          error: "No se pudo calcular el tipo de convocatoria.",
        };
      }
    },
    {
      detail: {
        summary:
          "Devuelve los estatus y cuántas veces se repiten en EXCEL-BUN -MongoDB",
        tags: ["ANALISIS DE LOS DATOS"],
      },
    }
  )
  .get(
    "/institucion_convocatoria",
    async () => {
      try {
        const db = await getDb();
        const collection = db.collection("EXCEL-BUN");
        const docs = await collection.find({}).toArray();

        const conteoInstitucionConvocatoria: Record<string, number> = {};

        for (const doc of docs) {
          const estatus = String(
            doc["Institucion Convocatoria"] || "Sin institucion de convocatoria"
          ).trim();
          if (estatus && estatus.toLowerCase() !== "n/a") {
            conteoInstitucionConvocatoria[estatus] =
              (conteoInstitucionConvocatoria[estatus] || 0) + 1;
          }
        }

        const resultado = Object.entries(conteoInstitucionConvocatoria)
          .map(([nombre, cantidad]) => ({ nombre, cantidad }))
          .sort((a, b) => b.cantidad - a.cantidad); // opcional: ordenar desc

        return {
          ok: true,
          message:
            "Institucion de Convocatoria y su cantidad de ocurrencias en EXCEL-BUN",
          totalInstitucionConvocatoria: resultado.length,
          datos: resultado,
        };
      } catch (error) {
        console.error("❌ Error al contar institucion de convocatoria:", error);
        return {
          ok: false,
          error: "No se pudo calcular la institucion de convocatoria.",
        };
      }
    },
    {
      detail: {
        summary:
          "Devuelve los estatus y cuántas veces se repiten en EXCEL-BUN -MongoDB",
        tags: ["ANALISIS DE LOS DATOS"],
      },
    }
  )

  .get(
    "/fechas_postulacion",
    async () => {
      try {
        const db = await getDb();
        const collection = db.collection("EXCEL-BUN");
        const docs = await collection.find({}).toArray();

        const conteoFechasPostulacion: Record<string, number> = {};

        for (const doc of docs) {
          const estatus = String(
            doc["Fecha Postulación"] || "Sin fecha de postulación"
          ).trim();
          if (estatus && estatus.toLowerCase() !== "n/a") {
            conteoFechasPostulacion[estatus] =
              (conteoFechasPostulacion[estatus] || 0) + 1;
          }
        }

        const resultado = Object.entries(conteoFechasPostulacion)
          .map(([nombre, cantidad]) => ({ nombre, cantidad }))
          .sort((a, b) => b.cantidad - a.cantidad); // opcional: ordenar desc

        return {
          ok: true,
          message:
            "Fechas de Postulación y su cantidad de ocurrencias en EXCEL-BUN",
          totalFechasPostulacion: resultado.length,
          datos: resultado,
        };
      } catch (error) {
        console.error("❌ Error al contar fechas de postulación:", error);
        return {
          ok: false,
          error: "No se pudo calcular las fechas de postulación.",
        };
      }
    },
    {
      detail: {
        summary:
          "Devuelve los estatus y cuántas veces se repiten en EXCEL-BUN -MongoDB",
        tags: ["ANALISIS DE LOS DATOS"],
      },
    }
  );
