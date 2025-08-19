import { Elysia, t } from "elysia";
import { Collection, ObjectId } from "mongodb";
import { getDb } from "../bd/mongo";
import type { tipo_convocatoria } from "../types/tipo_con"; // Tu modelo tipo_convocatoria

// Nombre de la colección de tipos de convocatoria
const TIPO_CONV_COLLECTION_NAME = "TIPO_CONV";

// --- Rutas CRUD para Tipo de Convocatoria ---

export const tipoConvRoutes = new Elysia({ prefix: "/tipos-convocatoria" })
  // GET /tipos-convocatoria/ - Obtener todos los tipos de convocatoria
  .get(
    "/",
    async () => {
      const db = getDb();
      const tipoConvCollection: Collection<tipo_convocatoria> =
        db.collection<tipo_convocatoria>(TIPO_CONV_COLLECTION_NAME);
      const tipos = await tipoConvCollection.find({}).toArray();
      return tipos;
    },
    {
      detail: {
        summary: "Obtener todos los tipos de convocatoria",
        tags: ["Tipos de Convocatoria"],
      },
    }
  )

  // GET /tipos-convocatoria/:id - Obtener un tipo de convocatoria por ID
  .get(
    "/:id",
    async ({ params, set }) => {
      const db = getDb();
      const tipoConvCollection: Collection<tipo_convocatoria> =
        db.collection<tipo_convocatoria>(TIPO_CONV_COLLECTION_NAME);

      try {
        const tipo = await tipoConvCollection.findOne({
          _id: new ObjectId(params.id),
        });

        if (!tipo) {
          set.status = 404;
          return {
            success: false,
            message: "Tipo de convocatoria no encontrado",
          };
        }
        return { success: true, data: tipo };
      } catch (error) {
        set.status = 400; // Bad Request si el ID no es válido (ObjectId)
        return {
          success: false,
          message: "ID de tipo de convocatoria inválido",
        };
      }
    },
    {
      params: t.Object({
        id: t.String({
          pattern: "^[0-9a-fA-F]{24}$", // Valida que sea un ObjectId válido
        }),
      }),
      detail: {
        summary: "Obtener un tipo de convocatoria por ID",
        tags: ["Tipos de Convocatoria"],
      },
    }
  )

  // POST /tipos-convocatoria/ - Crear un nuevo tipo de convocatoria
  .post(
    "/",
    async ({ body, set }) => {
      const db = getDb();
      const tipoConvCollection: Collection<tipo_convocatoria> =
        db.collection<tipo_convocatoria>(TIPO_CONV_COLLECTION_NAME);

      // El body solo necesita 'nombre' según tu interfaz
      const newTipoConv: Omit<tipo_convocatoria, "_id"> = body;

      // Opcional: Validación de unicidad por nombre
      const existingTipo = await tipoConvCollection.findOne({
        nombre: newTipoConv.nombre,
      });
      if (existingTipo) {
        set.status = 409; // Conflict
        return {
          success: false,
          message: `El tipo de convocatoria '${newTipoConv.nombre}' ya existe`,
        };
      }

      const result = await tipoConvCollection.insertOne(
        newTipoConv as tipo_convocatoria
      );

      if (!result.acknowledged) {
        set.status = 500;
        return {
          success: false,
          message: "Fallo al crear el tipo de convocatoria",
        };
      }

      set.status = 201; // Created
      return {
        success: true,
        data: { _id: result.insertedId, ...newTipoConv },
        message: "Tipo de convocatoria creado exitosamente",
      };
    },
    {
      body: t.Object({
        nombre: t.String({
          minLength: 1,
          error:
            "El nombre del tipo de convocatoria es requerido y no puede estar vacío.",
        }),
      }),
      detail: {
        summary: "Crear un nuevo tipo de convocatoria",
        tags: ["Tipos de Convocatoria"],
      },
    }
  )

  // PUT /tipos-convocatoria/:id - Actualizar un tipo de convocatoria existente
  .put(
    "/:id",
    async ({ params, body, set }) => {
      const db = getDb();
      const tipoConvCollection: Collection<tipo_convocatoria> =
        db.collection<tipo_convocatoria>(TIPO_CONV_COLLECTION_NAME);

      const updateData: Partial<Omit<tipo_convocatoria, "_id">> = body;

      if (Object.keys(updateData).length === 0) {
        set.status = 400;
        return { success: false, message: "No hay datos para actualizar." };
      }

      try {
        const result = await tipoConvCollection.updateOne(
          { _id: new ObjectId(params.id) },
          { $set: updateData }
        );

        if (result.matchedCount === 0) {
          set.status = 404;
          return {
            success: false,
            message: "Tipo de convocatoria no encontrado",
          };
        }
        if (result.modifiedCount === 0) {
          set.status = 200;
          return {
            success: true,
            message:
              "Tipo de convocatoria no modificado (los datos eran los mismos).",
          };
        }

        return {
          success: true,
          message: "Tipo de convocatoria actualizado exitosamente",
        };
      } catch (error) {
        set.status = 400;
        return {
          success: false,
          message:
            "ID de tipo de convocatoria inválido o error en la actualización.",
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
            error: "El nombre del tipo de convocatoria no puede estar vacío.",
          }),
        })
      ),
      detail: {
        summary: "Actualizar un tipo de convocatoria existente",
        tags: ["Tipos de Convocatoria"],
      },
    }
  )

  // DELETE /tipos-convocatoria/:id - Eliminar un tipo de convocatoria
  .delete(
    "/:id",
    async ({ params, set }) => {
      const db = getDb();
      const tipoConvCollection: Collection<tipo_convocatoria> =
        db.collection<tipo_convocatoria>(TIPO_CONV_COLLECTION_NAME);

      try {
        const result = await tipoConvCollection.deleteOne({
          _id: new ObjectId(params.id),
        });

        if (result.deletedCount === 0) {
          set.status = 404;
          return {
            success: false,
            message: "Tipo de convocatoria no encontrado",
          };
        }
        return {
          success: true,
          message: "Tipo de convocatoria eliminado exitosamente",
        };
      } catch (error) {
        set.status = 400;
        return {
          success: false,
          message: "ID de tipo de convocatoria inválido",
        };
      }
    },
    {
      params: t.Object({
        id: t.String({
          pattern: "^[0-9a-fA-F]{24}$",
        }),
      }),
      detail: {
        summary: "Eliminar un tipo de convocatoria por ID",
        tags: ["Tipos de Convocatoria"],
      },
    }
  );
