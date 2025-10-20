import { Elysia } from "elysia";
import type { Document } from "mongodb";
import { getDb } from "../bd/mongo";

export const excelBunRoutes = new Elysia({ prefix: "/excel-bun" })

  // 🔸 POST: Inserta cualquier JSON
  .post(
    "/",
    async ({ body }) => {
      try {
        const db = await getDb();
        const collection = db.collection("EXCEL-BUN");

        // Permitir cualquier JSON
        const result = await collection.insertOne(body as Document);

        return {
          ok: true,
          message: "Documento insertado correctamente",
          insertedId: result.insertedId,
        };
      } catch (error) {
        console.error("❌ Error al insertar en EXCEL-BUN:", error);
        return { ok: false, error: "No se pudo insertar el documento" };
      }
    },
    {
      detail: {
        summary: "Inserta cualquier JSON en la colección EXCEL-BUN",
        tags: ["Proyectos"],
      },
    }
  )

  // 🔻 DELETE TOTAL: Elimina todos los documentos
  .delete(
    "/",
    async () => {
      try {
        const db = await getDb();
        const collection = db.collection("EXCEL-BUN");

        const result = await collection.deleteMany({}); // 🔥 Borrar todo

        return {
          ok: true,
          message: `Se eliminaron ${result.deletedCount} documentos de EXCEL-BUN.`,
        };
      } catch (error) {
        console.error("❌ Error al eliminar documentos de EXCEL-BUN:", error);
        return { ok: false, error: "No se pudo eliminar la colección" };
      }
    },
    {
      detail: {
        summary: "Elimina todos los documentos de EXCEL-BUN",
        tags: ["Proyectos"],
      },
    }
  );
