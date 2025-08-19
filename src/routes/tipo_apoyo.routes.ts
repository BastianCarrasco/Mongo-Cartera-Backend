import { Elysia, t } from "elysia";
import { Collection, ObjectId } from "mongodb";
import { getDb } from "../bd/mongo";
import type { tipo_apoyo } from "../types/tipo_apoyo"; // Tu modelo tipo_apoyo

// Nombre de la colección de tipos de apoyo
const TIPO_APOYO_COLLECTION_NAME = "TIPO_APOYO";

// --- Rutas CRUD para Tipos de Apoyo ---

export const tipoApoyoRoutes = new Elysia({ prefix: "/tipos-apoyo" }) // Prefijo para estas rutas
  // GET /tipos-apoyo/ - Obtener todos los tipos de apoyo
  .get(
    "/",
    async () => {
      const db = getDb();
      const tipoApoyoCollection: Collection<tipo_apoyo> =
        db.collection<tipo_apoyo>(TIPO_APOYO_COLLECTION_NAME);
      const allTipos = await tipoApoyoCollection.find({}).toArray();
      return allTipos;
    },
    {
      detail: {
        summary: "Obtener todos los tipos de apoyo",
        tags: ["Tipos de Apoyo"],
      },
    }
  )

  // GET /tipos-apoyo/:id - Obtener un tipo de apoyo por ID
  .get(
    "/:id",
    async ({ params, set }) => {
      const db = getDb();
      const tipoApoyoCollection: Collection<tipo_apoyo> =
        db.collection<tipo_apoyo>(TIPO_APOYO_COLLECTION_NAME);

      try {
        const tipo = await tipoApoyoCollection.findOne({
          _id: new ObjectId(params.id),
        });

        if (!tipo) {
          set.status = 404;
          return { success: false, message: "Tipo de apoyo no encontrado" };
        }
        return { success: true, data: tipo };
      } catch (error) {
        set.status = 400; // Bad Request si el ID no es válido (ObjectId)
        return { success: false, message: "ID de tipo de apoyo inválido" };
      }
    },
    {
      params: t.Object({
        id: t.String({
          pattern: "^[0-9a-fA-F]{24}$", // Valida que sea un ObjectId válido
        }),
      }),
      detail: {
        summary: "Obtener un tipo de apoyo por ID",
        tags: ["Tipos de Apoyo"],
      },
    }
  )

  // POST /tipos-apoyo/ - Crear un nuevo tipo de apoyo
  .post(
    "/",
    async ({ body, set }) => {
      const db = getDb();
      const tipoApoyoCollection: Collection<tipo_apoyo> =
        db.collection<tipo_apoyo>(TIPO_APOYO_COLLECTION_NAME);

      const newTipo: Omit<tipo_apoyo, "_id"> = body;

      // Opcional: Validación de unicidad por el campo 'tipo'
      const existingTipo = await tipoApoyoCollection.findOne({
        tipo: newTipo.tipo,
      });
      if (existingTipo) {
        set.status = 409; // Conflict
        return {
          success: false,
          message: `El tipo de apoyo '${newTipo.tipo}' ya existe`,
        };
      }

      const result = await tipoApoyoCollection.insertOne(newTipo as tipo_apoyo);

      if (!result.acknowledged) {
        set.status = 500;
        return { success: false, message: "Fallo al crear el tipo de apoyo" };
      }

      set.status = 201; // Created
      return {
        success: true,
        data: { _id: result.insertedId, ...newTipo },
        message: "Tipo de apoyo creado exitosamente",
      };
    },
    {
      body: t.Object({
        tipo: t.String({
          minLength: 1,
          error: "El tipo de apoyo es requerido y no puede estar vacío.",
        }),
      }),
      detail: {
        summary: "Crear un nuevo tipo de apoyo",
        tags: ["Tipos de Apoyo"],
      },
    }
  )

  // PUT /tipos-apoyo/:id - Actualizar un tipo de apoyo existente
  .put(
    "/:id",
    async ({ params, body, set }) => {
      const db = getDb();
      const tipoApoyoCollection: Collection<tipo_apoyo> =
        db.collection<tipo_apoyo>(TIPO_APOYO_COLLECTION_NAME);

      const updateData: Partial<Omit<tipo_apoyo, "_id">> = body;

      if (Object.keys(updateData).length === 0) {
        set.status = 400;
        return { success: false, message: "No hay datos para actualizar." };
      }

      try {
        const result = await tipoApoyoCollection.updateOne(
          { _id: new ObjectId(params.id) },
          { $set: updateData }
        );

        if (result.matchedCount === 0) {
          set.status = 404;
          return { success: false, message: "Tipo de apoyo no encontrado" };
        }
        if (result.modifiedCount === 0) {
          set.status = 200;
          return {
            success: true,
            message: "Tipo de apoyo no modificado (los datos eran los mismos).",
          };
        }

        return {
          success: true,
          message: "Tipo de apoyo actualizado exitosamente",
        };
      } catch (error) {
        set.status = 400;
        return {
          success: false,
          message: "ID de tipo de apoyo inválido o error en la actualización.",
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
            error: "El tipo de apoyo no puede estar vacío.",
          }),
        })
      ),
      detail: {
        summary: "Actualizar un tipo de apoyo existente",
        tags: ["Tipos de Apoyo"],
      },
    }
  )

  // DELETE /tipos-apoyo/:id - Eliminar un tipo de apoyo
  .delete(
    "/:id",
    async ({ params, set }) => {
      const db = getDb();
      const tipoApoyoCollection: Collection<tipo_apoyo> =
        db.collection<tipo_apoyo>(TIPO_APOYO_COLLECTION_NAME);

      try {
        const result = await tipoApoyoCollection.deleteOne({
          _id: new ObjectId(params.id),
        });

        if (result.deletedCount === 0) {
          set.status = 404;
          return { success: false, message: "Tipo de apoyo no encontrado" };
        }
        return {
          success: true,
          message: "Tipo de apoyo eliminado exitosamente",
        };
      } catch (error) {
        set.status = 400;
        return { success: false, message: "ID de tipo de apoyo inválido" };
      }
    },
    {
      params: t.Object({
        id: t.String({
          pattern: "^[0-9a-fA-F]{24}$",
        }),
      }),
      detail: {
        summary: "Eliminar un tipo de apoyo por ID",
        tags: ["Tipos de Apoyo"],
      },
    }
  );
