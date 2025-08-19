import { Elysia, t } from "elysia";
import { Collection, ObjectId } from "mongodb";
import { getDb } from "../bd/mongo";
import type { estatus } from "../types/estatus"; // Tu modelo estatus

// Nombre de la colección de estatus
const ESTATUS_COLLECTION_NAME = "ESTATUS";

// --- Rutas CRUD para Estatus ---

export const estatusRoutes = new Elysia({ prefix: "/estatus" }) // Prefijo para estas rutas
  // GET /estatus/ - Obtener todos los estatus
  .get(
    "/",
    async () => {
      const db = getDb();
      const estatusCollection: Collection<estatus> = db.collection<estatus>(
        ESTATUS_COLLECTION_NAME
      );
      const statuses = await estatusCollection.find({}).toArray();
      return statuses;
    },
    {
      detail: {
        summary: "Obtener todos los estatus",
        tags: ["Estatus"],
      },
    }
  )

  // GET /estatus/:id - Obtener un estatus por ID
  .get(
    "/:id",
    async ({ params, set }) => {
      const db = getDb();
      const estatusCollection: Collection<estatus> = db.collection<estatus>(
        ESTATUS_COLLECTION_NAME
      );

      try {
        const status = await estatusCollection.findOne({
          _id: new ObjectId(params.id),
        });

        if (!status) {
          set.status = 404;
          return { success: false, message: "Estatus no encontrado" };
        }
        return { success: true, data: status };
      } catch (error) {
        set.status = 400; // Bad Request si el ID no es válido (ObjectId)
        return { success: false, message: "ID de estatus inválido" };
      }
    },
    {
      params: t.Object({
        id: t.String({
          pattern: "^[0-9a-fA-F]{24}$", // Valida que sea un ObjectId válido
        }),
      }),
      detail: {
        summary: "Obtener un estatus por ID",
        tags: ["Estatus"],
      },
    }
  )

  // POST /estatus/ - Crear un nuevo estatus
  .post(
    "/",
    async ({ body, set }) => {
      const db = getDb();
      const estatusCollection: Collection<estatus> = db.collection<estatus>(
        ESTATUS_COLLECTION_NAME
      );

      const newStatus: Omit<estatus, "_id"> = body; // El body solo necesita 'tipo' según tu interfaz

      // Opcional: Validación de unicidad por tipo
      const existingStatus = await estatusCollection.findOne({
        tipo: newStatus.tipo,
      });
      if (existingStatus) {
        set.status = 409; // Conflict
        return {
          success: false,
          message: `El estatus '${newStatus.tipo}' ya existe`,
        };
      }

      const result = await estatusCollection.insertOne(newStatus as estatus);

      if (!result.acknowledged) {
        set.status = 500;
        return { success: false, message: "Fallo al crear el estatus" };
      }

      set.status = 201; // Created
      return {
        success: true,
        data: { _id: result.insertedId, ...newStatus },
        message: "Estatus creado exitosamente",
      };
    },
    {
      body: t.Object({
        tipo: t.String({
          minLength: 1,
          error: "El tipo de estatus es requerido y no puede estar vacío.",
        }),
      }),
      detail: {
        summary: "Crear un nuevo estatus",
        tags: ["Estatus"],
      },
    }
  )

  // PUT /estatus/:id - Actualizar un estatus existente
  .put(
    "/:id",
    async ({ params, body, set }) => {
      const db = getDb();
      const estatusCollection: Collection<estatus> = db.collection<estatus>(
        ESTATUS_COLLECTION_NAME
      );

      const updateData: Partial<Omit<estatus, "_id">> = body;

      if (Object.keys(updateData).length === 0) {
        set.status = 400;
        return { success: false, message: "No hay datos para actualizar." };
      }

      try {
        const result = await estatusCollection.updateOne(
          { _id: new ObjectId(params.id) },
          { $set: updateData }
        );

        if (result.matchedCount === 0) {
          set.status = 404;
          return { success: false, message: "Estatus no encontrado" };
        }
        if (result.modifiedCount === 0) {
          set.status = 200; // OK, pero no se modificó nada (quizás los datos eran los mismos)
          return {
            success: true,
            message: "Estatus no modificado (los datos eran los mismos).",
          };
        }

        return { success: true, message: "Estatus actualizado exitosamente" };
      } catch (error) {
        set.status = 400;
        return {
          success: false,
          message: "ID de estatus inválido o error en la actualización.",
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
          tipo: t.String({
            minLength: 1,
            error: "El tipo de estatus no puede estar vacío.",
          }),
        })
      ),
      detail: {
        summary: "Actualizar un estatus existente",
        tags: ["Estatus"],
      },
    }
  )

  // DELETE /estatus/:id - Eliminar un estatus
  .delete(
    "/:id",
    async ({ params, set }) => {
      const db = getDb();
      const estatusCollection: Collection<estatus> = db.collection<estatus>(
        ESTATUS_COLLECTION_NAME
      );

      try {
        const result = await estatusCollection.deleteOne({
          _id: new ObjectId(params.id),
        });

        if (result.deletedCount === 0) {
          set.status = 404;
          return { success: false, message: "Estatus no encontrado" };
        }
        return { success: true, message: "Estatus eliminado exitosamente" };
      } catch (error) {
        set.status = 400;
        return { success: false, message: "ID de estatus inválido" };
      }
    },
    {
      params: t.Object({
        id: t.String({
          pattern: "^[0-9a-fA-F]{24}$",
        }),
      }),
      detail: {
        summary: "Eliminar un estatus por ID",
        tags: ["Estatus"],
      },
    }
  );
