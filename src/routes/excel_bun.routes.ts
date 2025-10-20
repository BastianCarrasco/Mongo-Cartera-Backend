import { Elysia } from "elysia";
import { ObjectId } from "mongodb";
import { getDb } from "../bd/mongo";

export const excelBunRoutes = new Elysia({ prefix: "/excel-bun" })

  // POST: insertar un documento en EXCEL-BUN
  .post(
    "/",
    async ({ body }) => {
      try {
        const db = await getDb();
        const collection = db.collection("EXCEL-BUN");
        const result = await collection.insertOne(body);
        return {
          message: "Documento insertado correctamente",
          insertedId: result.insertedId,
        };
      } catch (error) {
        console.error("❌ Error al insertar en EXCEL-BUN:", error);
        return { error: "No se pudo insertar el documento" };
      }
    },
    {
      detail: {
        summary: "Inserta un nuevo documento en la colección EXCEL-BUN",
        tags: ["Proyectos"],
      },
    }
  )

  // DELETE: eliminar un documento por su _id
  .delete(
    "/:id",
    async ({ params }) => {
      try {
        const db = await getDb();
        const collection = db.collection("EXCEL-BUN");
        const result = await collection.deleteOne({
          _id: new ObjectId(params.id),
        });

        if (result.deletedCount === 0)
          return { message: "No se encontró el documento para eliminar." };

        return { message: "Documento eliminado correctamente." };
      } catch (error) {
        console.error("❌ Error al eliminar en EXCEL-BUN:", error);
        return { error: "No se pudo eliminar el documento" };
      }
    },
    {
      detail: {
        summary: "Elimina un documento de la colección EXCEL-BUN por ID",
        tags: ["Proyectos"],
      },
    }
  );
