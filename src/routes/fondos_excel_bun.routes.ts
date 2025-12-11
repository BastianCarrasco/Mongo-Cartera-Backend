import { Elysia } from "elysia";
import type { Document } from "mongodb";
import { getDb } from "../bd/mongo";

// Rutas para FONDOS_EXCEL_BUN con GET y POST básicos
export const fondos_excel_bunRoutes = new Elysia({
  prefix: "/fondos-excel-bun", // Prefijo del endpoint
})
  // GET: Obtiene todos los documentos de FONDOS_EXCEL
  .get(
    "/",
    async () => {
      try {
        const db = await getDb();
        const collection = db.collection("FONDOS_EXEL"); // Colección FONDOS_EXCEL

        const fondos = (await collection.find({}).toArray()) as Document[];

        return {
          ok: true,
          count: fondos.length,
          data: fondos,
          message:
            "✅ Documentos de fondos recuperados correctamente de FONDOS_EXCEL.",
        };
      } catch (error) {
        console.error("❌ Error al obtener documentos de FONDOS_EXCEL:", error);
        return {
          ok: false,
          error:
            "No se pudieron obtener los documentos de fondos de FONDOS_EXCEL.",
        };
      }
    },
    {
      detail: {
        summary: "Obtiene todos los documentos de la colección FONDOS_EXCEL",
        tags: ["Fondos"],
      },
    }
  )

  // POST: Inserta uno o varios documentos en FONDOS_EXCEL
  .post(
    "/",
    async ({ body }) => {
      try {
        const db = await getDb();
        const collection = db.collection("FONDOS_EXEL"); // Colección FONDOS_EXCEL

        if (Array.isArray(body)) {
          const parsed = JSON.parse(JSON.stringify(body));
          const result = await collection.insertMany(parsed as Document[]);
          return {
            ok: true,
            message: `✅ Se insertaron ${result.insertedCount} documentos correctamente en FONDOS_EXCEL.`,
          };
        }

        const parsed = JSON.parse(JSON.stringify(body));
        const result = await collection.insertOne(parsed as Document);
        return {
          ok: true,
          message: "✅ Documento insertado correctamente en FONDOS_EXCEL",
          insertedId: result.insertedId,
        };
      } catch (error) {
        console.error("❌ Error al insertar en FONDOS_EXCEL:", error);
        return {
          ok: false,
          error: "No se pudo insertar el documento en FONDOS_EXCEL",
        };
      }
    },
    {
      detail: {
        summary:
          "Inserta cualquier JSON (objeto o array) en la colección FONDOS_EXCEL",
        tags: ["Fondos"],
      },
    }
  );
