import { Elysia, t } from "elysia";
import { Collection, ObjectId } from "mongodb";
import { getDb } from "../bd/mongo";
import type { tematicas } from "../types/tematicas"; // Tu modelo tematicas

// Nombre de la colección de temáticas
const TEMATICAS_COLLECTION_NAME = "TEMATICAS";

// --- Rutas CRUD para Temáticas ---

export const tematicasRoutes = new Elysia({ prefix: "/tematicas" }) // Prefijo para estas rutas
  // GET /tematicas/ - Obtener todas las temáticas
  .get(
    "/",
    async () => {
      const db = getDb();
      const tematicasCollection: Collection<tematicas> =
        db.collection<tematicas>(TEMATICAS_COLLECTION_NAME);
      const temas = await tematicasCollection.find({}).toArray();
      return { success: true, data: temas };
    },
    {
      detail: {
        summary: "Obtener todas las temáticas",
        tags: ["Temáticas"],
      },
    }
  )

  // GET /tematicas/:id - Obtener una temática por ID
  .get(
    "/:id",
    async ({ params, set }) => {
      const db = getDb();
      const tematicasCollection: Collection<tematicas> =
        db.collection<tematicas>(TEMATICAS_COLLECTION_NAME);

      try {
        const tema = await tematicasCollection.findOne({
          _id: new ObjectId(params.id),
        });

        if (!tema) {
          set.status = 404;
          return { success: false, message: "Temática no encontrada" };
        }
        return { success: true, data: tema };
      } catch (error) {
        set.status = 400; // Bad Request si el ID no es válido (ObjectId)
        return { success: false, message: "ID de temática inválido" };
      }
    },
    {
      params: t.Object({
        id: t.String({
          pattern: "^[0-9a-fA-F]{24}$", // Valida que sea un ObjectId válido
        }),
      }),
      detail: {
        summary: "Obtener una temática por ID",
        tags: ["Temáticas"],
      },
    }
  )

  // POST /tematicas/ - Crear una nueva temática
  .post(
    "/",
    async ({ body, set }) => {
      const db = getDb();
      const tematicasCollection: Collection<tematicas> =
        db.collection<tematicas>(TEMATICAS_COLLECTION_NAME);

      const newTema: Omit<tematicas, "_id"> = body; // El body solo necesita 'nombre' según tu interfaz

      // Opcional: Validación de unicidad por nombre
      const existingTema = await tematicasCollection.findOne({
        nombre: newTema.nombre,
      });
      if (existingTema) {
        set.status = 409; // Conflict
        return {
          success: false,
          message: `La temática '${newTema.nombre}' ya existe`,
        };
      }

      const result = await tematicasCollection.insertOne(newTema as tematicas);

      if (!result.acknowledged) {
        set.status = 500;
        return { success: false, message: "Fallo al crear la temática" };
      }

      set.status = 201; // Created
      return {
        success: true,
        data: { _id: result.insertedId, ...newTema },
        message: "Temática creada exitosamente",
      };
    },
    {
      body: t.Object({
        nombre: t.String({
          minLength: 1,
          error:
            "El nombre de la temática es requerido y no puede estar vacío.",
        }),
      }),
      detail: {
        summary: "Crear una nueva temática",
        tags: ["Temáticas"],
      },
    }
  )

  // PUT /tematicas/:id - Actualizar una temática existente
  .put(
    "/:id",
    async ({ params, body, set }) => {
      const db = getDb();
      const tematicasCollection: Collection<tematicas> =
        db.collection<tematicas>(TEMATICAS_COLLECTION_NAME);

      const updateData: Partial<Omit<tematicas, "_id">> = body;

      if (Object.keys(updateData).length === 0) {
        set.status = 400;
        return { success: false, message: "No hay datos para actualizar." };
      }

      try {
        const result = await tematicasCollection.updateOne(
          { _id: new ObjectId(params.id) },
          { $set: updateData }
        );

        if (result.matchedCount === 0) {
          set.status = 404;
          return { success: false, message: "Temática no encontrada" };
        }
        if (result.modifiedCount === 0) {
          set.status = 200; // OK, pero no se modificó nada (quizás los datos eran los mismos)
          return {
            success: true,
            message: "Temática no modificada (los datos eran los mismos).",
          };
        }

        return { success: true, message: "Temática actualizada exitosamente" };
      } catch (error) {
        set.status = 400;
        return {
          success: false,
          message: "ID de temática inválido o error en la actualización.",
        };
      }
    },
    {
      params: t.Object({
        id: t.String({
          pattern: "^[0-9a-fA-F]{24}$",
        }),
      }),
      body: t.Partial(
        t.Object({
          nombre: t.String({
            minLength: 1,
            error: "El nombre de la temática no puede estar vacío.",
          }),
        })
      ),
      detail: {
        summary: "Actualizar una temática existente",
        tags: ["Temáticas"],
      },
    }
  )

  // DELETE /tematicas/:id - Eliminar una temática
  .delete(
    "/:id",
    async ({ params, set }) => {
      const db = getDb();
      const tematicasCollection: Collection<tematicas> =
        db.collection<tematicas>(TEMATICAS_COLLECTION_NAME);

      try {
        const result = await tematicasCollection.deleteOne({
          _id: new ObjectId(params.id),
        });

        if (result.deletedCount === 0) {
          set.status = 404;
          return { success: false, message: "Temática no encontrada" };
        }
        return { success: true, message: "Temática eliminada exitosamente" };
      } catch (error) {
        set.status = 400;
        return { success: false, message: "ID de temática inválido" };
      }
    },
    {
      params: t.Object({
        id: t.String({
          pattern: "^[0-9a-fA-F]{24}$",
        }),
      }),
      detail: {
        summary: "Eliminar una temática por ID",
        tags: ["Temáticas"],
      },
    }
  );
