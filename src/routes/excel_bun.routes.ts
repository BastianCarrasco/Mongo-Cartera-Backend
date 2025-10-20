import { Elysia } from "elysia";
import type { Document } from "mongodb";
import { getDb } from "../bd/mongo";

export const excelBunRoutes = new Elysia({ prefix: "/excel-bun" })

  // POST: Inserta uno o varios documentos
  .post(
    "/",
    async ({ body }) => {
      try {
        const db = await getDb();
        const collection = db.collection("EXCEL-BUN");

        // 🔹 Si el body es un array, usar insertMany
        if (Array.isArray(body)) {
          // Asegurarse de convertir Proxy -> JSON plano (por seguridad)
          const parsed = JSON.parse(JSON.stringify(body));
          const result = await collection.insertMany(parsed as Document[]);
          return {
            ok: true,
            message: `✅ Se insertaron ${result.insertedCount} documentos correctamente.`,
          };
        }

        // 🔹 Si es un solo objeto, usar insertOne
        const parsed = JSON.parse(JSON.stringify(body));
        const result = await collection.insertOne(parsed as Document);
        return {
          ok: true,
          message: "✅ Documento insertado correctamente",
          insertedId: result.insertedId,
        };
      } catch (error) {
        console.error("❌ Error al insertar en EXCEL-BUN:", error);
        return { ok: false, error: "No se pudo insertar el documento" };
      }
    },
    {
      detail: {
        summary: "Inserta cualquier JSON o array en la colección EXCEL-BUN",
        tags: ["Proyectos"],
      },
    }
  )

  // DELETE: Borrar todo
  .delete(
    "/",
    async () => {
      try {
        const db = await getDb();
        const collection = db.collection("EXCEL-BUN");
        const result = await collection.deleteMany({});
        return {
          ok: true,
          message: `🗑 Se eliminaron ${result.deletedCount} documentos.`,
        };
      } catch (error) {
        console.error("❌ Error al eliminar EXCEL-BUN:", error);
        return { ok: false, error: "No se pudo eliminar los documentos." };
      }
    },
    {
      detail: {
        summary: "Elimina todos los registros de EXCEL-BUN",
        tags: ["Proyectos"],
      },
    }
  );
