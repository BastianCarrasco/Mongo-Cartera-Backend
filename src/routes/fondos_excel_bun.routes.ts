import { Elysia } from "elysia";
import type { Document } from "mongodb";
import { getDb } from "../bd/mongo";

// Importa dotenv para asegurar que VITE_MONGO_EXCEL esté disponible si no lo haces globalmente
import "dotenv/config";

// Obtén la URL externa desde las variables de entorno
const VITE_MONGO_EXCEL_URL = process.env.VITE_MONGO_EXCEL;

// Rutas para FONDOS_EXCEL_BUN
export const fondos_excel_bunRoutes = new Elysia({
  prefix: "/fondos-excel-bun", // Prefijo del endpoint
})
  // GET: Obtiene todos los documentos de FONDOS_EXEL
  .get(
    "/",
    async () => {
      try {
        const db = await getDb();
        const collection = db.collection("FONDOS_EXEL"); // ¡Importante: "FONDOS_EXEL" sin 'C'!

        const fondos = (await collection.find({}).toArray()) as Document[];

        return {
          ok: true,
          count: fondos.length,
          data: fondos,
          message:
            "✅ Documentos de fondos recuperados correctamente de FONDOS_EXEL.", // Ajustado el mensaje
        };
      } catch (error) {
        console.error("❌ Error al obtener documentos de FONDOS_EXEL:", error); // Ajustado el mensaje
        return {
          ok: false,
          error:
            "No se pudieron obtener los documentos de fondos de FONDOS_EXEL.", // Ajustado el mensaje
        };
      }
    },
    {
      detail: {
        summary: "Obtiene todos los documentos de la colección FONDOS_EXEL", // Ajustado el mensaje
        tags: ["Fondos"],
      },
    }
  )

  // POST: Inserta uno o varios documentos en FONDOS_EXEL
  .post(
    "/",
    async ({ body }) => {
      try {
        const db = await getDb();
        const collection = db.collection("FONDOS_EXEL"); // ¡Importante: "FONDOS_EXEL" sin 'C'!

        if (Array.isArray(body)) {
          // Asegurarse de que "VALIDAR" se convierta a booleano si es necesario
          const processedBody = (body as any[]).map((doc) => ({
            ...doc,
            VALIDAR: doc.VALIDAR === "TRUE" || doc.VALIDAR === true, // Convertir string "TRUE" a booleano
          })) as Document[];
          const result = await collection.insertMany(processedBody);
          return {
            ok: true,
            message: `✅ Se insertaron ${result.insertedCount} documentos correctamente en FONDOS_EXEL.`, // Ajustado el mensaje
          };
        }

        // Si es un solo objeto
        const processedBody = {
          ...(body as any),
          VALIDAR:
            (body as any).VALIDAR === "TRUE" || (body as any).VALIDAR === true, // Convertir string "TRUE" a booleano
        } as Document;
        const result = await collection.insertOne(processedBody);
        return {
          ok: true,
          message: "✅ Documento insertado correctamente en FONDOS_EXEL", // Ajustado el mensaje
          insertedId: result.insertedId,
        };
      } catch (error) {
        console.error("❌ Error al insertar en FONDOS_EXEL:", error); // Ajustado el mensaje
        return {
          ok: false,
          error: "No se pudo insertar el documento en FONDOS_EXEL", // Ajustado el mensaje
        };
      }
    },
    {
      detail: {
        summary:
          "Inserta cualquier JSON (objeto o array) en la colección FONDOS_EXEL", // Ajustado el mensaje
        tags: ["Fondos"],
      },
    }
  )

  // DELETE: Elimina todos los documentos de la colección FONDOS_EXEL
  .delete(
    "/",
    async () => {
      try {
        const db = await getDb();
        const collection = db.collection("FONDOS_EXEL"); // ¡Importante: "FONDOS_EXEL" sin 'C'!
        const result = await collection.deleteMany({}); // Elimina todos los documentos
        return {
          ok: true,
          message: `🗑️ Se eliminaron ${result.deletedCount} documentos de FONDOS_EXEL.`, // Ajustado el mensaje
        };
      } catch (error) {
        console.error(
          "❌ Error al eliminar documentos de FONDOS_EXEL:", // Ajustado el mensaje
          error
        );
        return {
          ok: false,
          error: "No se pudieron eliminar los documentos de FONDOS_EXEL.", // Ajustado el mensaje
        };
      }
    },
    {
      detail: {
        summary: "Elimina todos los documentos de la colección FONDOS_EXEL", // Ajustado el mensaje
        tags: ["Fondos"],
      },
    }
  )

  // NUEVA RUTA: POST para sincronizar datos desde VITE_MONGO_EXCEL
  .post(
    "/sync", // Nuevo endpoint para la sincronización
    async () => {
      // 1. Verificar que la URL externa esté definida
      if (!VITE_MONGO_EXCEL_URL) {
        console.error(
          "❌ VITE_MONGO_EXCEL no está definida en las variables de entorno."
        );
        return {
          ok: false,
          error: "VITE_MONGO_EXCEL URL no configurada en el servidor.",
        };
      }

      try {
        const db = await getDb();
        const collection = db.collection("FONDOS_EXEL"); // Colección de destino

        console.log(`📡 Sincronizando datos desde: ${VITE_MONGO_EXCEL_URL}`);

        // 2. Obtener datos de la URL externa
        const response = await fetch(VITE_MONGO_EXCEL_URL);
        if (!response.ok) {
          throw new Error(
            `Error al obtener datos de la URL externa: HTTP status ${response.status}`
          );
        }
        const externalData = (await response.json()) as any[];

        if (!Array.isArray(externalData)) {
          throw new Error("La URL externa no devolvió un array de documentos.");
        }

        // 3. Opcional: Procesar los datos antes de insertar (ej. convertir "TRUE" a booleano, eliminar _id si existe)
        const processedData = externalData.map((doc: any) => {
          const newDoc = { ...doc };
          // Asegurarse de que "VALIDAR" sea un booleano
          if (typeof newDoc.VALIDAR === "string") {
            newDoc.VALIDAR = newDoc.VALIDAR.toUpperCase() === "TRUE";
          } else if (typeof newDoc.VALIDAR === "undefined") {
            newDoc.VALIDAR = false; // Valor por defecto si no está definido
          }
          // Eliminar _id si lo trae la data externa, para que MongoDB genere uno nuevo al insertar
          delete newDoc._id;
          return newDoc;
        }) as Document[];

        // 4. Eliminar todos los documentos existentes en la colección de destino
        const deleteResult = await collection.deleteMany({});
        console.log(
          `🗑️ Eliminados ${deleteResult.deletedCount} documentos existentes de FONDOS_EXEL.`
        );

        // 5. Insertar los nuevos documentos
        const insertResult = await collection.insertMany(processedData);
        console.log(
          `✅ Insertados ${insertResult.insertedCount} nuevos documentos en FONDOS_EXEL.`
        );

        return {
          ok: true,
          countInserted: insertResult.insertedCount,
          countDeleted: deleteResult.deletedCount,
          message: `✅ Sincronización completa: ${insertResult.insertedCount} documentos insertados, ${deleteResult.deletedCount} eliminados.`,
        };
      } catch (error: any) {
        console.error("❌ Error durante la sincronización de fondos:", error);
        return {
          ok: false,
          error: "Error en la sincronización de fondos.",
          details: error.message,
        };
      }
    },
    {
      detail: {
        summary:
          "Sincroniza la colección FONDOS_EXEL con datos de una URL externa (borra y vuelve a insertar)",
        tags: ["Fondos"],
      },
    }
  );
