import { Elysia, t } from "elysia";
import { Collection, ObjectId } from "mongodb";
import { getDb } from "../bd/mongo";
import type { respuestas_perfil } from "../types/respuestas_perfil";

// Nombre de la colección de respuestas de perfil
const RESPUESTAS_PERFIL_COLLECTION_NAME = "RESPUESTAS_PERFIL";

export const respuestasPerfilRoutes = new Elysia({
  prefix: "/respuestas-perfil",
}) // Agrupa las rutas con un prefijo
  // GET /respuestas-perfil - Obtener todas las respuestas de perfil
  .get(
    "/",
    async () => {
      const db = getDb();
      const respuestasCollection: Collection<respuestas_perfil> = db.collection(
        RESPUESTAS_PERFIL_COLLECTION_NAME
      );
      const respuestas = await respuestasCollection.find({}).toArray();
      return respuestas;
    },
    {
      detail: {
        summary: "Obtener todas las respuestas de perfil de proyecto",
        tags: ["Respuestas Perfil"],
      },
    }
  )

  // GET /respuestas-perfil/:id - Obtener una respuesta de perfil por ID
  .get(
    "/:id",
    async ({ params, set }) => {
      const db = getDb();
      const respuestasCollection: Collection<respuestas_perfil> = db.collection(
        RESPUESTAS_PERFIL_COLLECTION_NAME
      );

      // Validar si el ID es un ObjectId válido antes de buscar
      if (!ObjectId.isValid(params.id)) {
        set.status = 400;
        return {
          success: false,
          message: "ID de respuesta de perfil inválido",
        };
      }

      const respuesta = await respuestasCollection.findOne({
        _id: new ObjectId(params.id),
      });

      if (!respuesta) {
        set.status = 404;
        return { success: false, message: "Respuesta de perfil no encontrada" };
      }
      return { success: true, data: respuesta };
    },
    {
      params: t.Object({
        id: t.String({
          pattern: "^[0-9a-fA-F]{24}$",
          description: "ID de MongoDB válido para la respuesta de perfil",
        }),
      }),
      detail: {
        summary: "Obtener una respuesta de perfil de proyecto por ID",
        tags: ["Respuestas Perfil"],
      },
    }
  )

  // POST /respuestas-perfil - Crear una nueva respuesta de perfil
  .post(
    "/",
    async ({ body, set }) => {
      const db = getDb();
      const respuestasCollection: Collection<respuestas_perfil> = db.collection(
        RESPUESTAS_PERFIL_COLLECTION_NAME
      );

      // El tipo de 'body' ya está inferido correctamente por Elysia desde t.Object
      const newRespuestaData: Omit<respuestas_perfil, "_id"> = {
        ...(body as Omit<respuestas_perfil, "_id" | "fecha_creacion">), // Casteo para satisfacer el tipo 'Omit<respuestas_perfil, "_id">'
        fecha_creacion: new Date(), // Asignar la fecha de creación en el servidor
      };

      const result = await respuestasCollection.insertOne(newRespuestaData);

      if (!result.acknowledged) {
        set.status = 500;
        return {
          success: false,
          message: "Fallo al crear la respuesta de perfil",
        };
      }

      set.status = 201; // Created
      return {
        success: true,
        data: { _id: result.insertedId, ...newRespuestaData },
        message: "Respuesta de perfil creada exitosamente",
      };
    },
    {
      body: t.Object({
        titulo: t.String({
          description: "Título del proyecto/respuesta (campo requerido)",
          minLength: 1,
        }),
        investigador: t.String({
          description: "Nombre del investigador (campo requerido)",
          minLength: 1,
        }),
        escuela: t.String({
          description: "Escuela del investigador (campo requerido)",
          minLength: 1,
        }),
        respuestas: t.Array(
          t.String({
            description: "Cada elemento es una respuesta a una pregunta",
            minLength: 1, // Asegura que cada respuesta no esté vacía
          }),
          {
            description: "Array de respuestas a las preguntas del perfil",
            minItems: 1, // Al menos una respuesta
          }
        ),
      }),
      detail: {
        summary: "Crear una nueva respuesta de perfil de proyecto",
        tags: ["Respuestas Perfil"],
      },
    }
  )

  // PUT /respuestas-perfil/:id - Actualizar una respuesta de perfil existente
  .put(
    "/:id",
    async ({ params, body, set }) => {
      const db = getDb();
      const respuestasCollection: Collection<respuestas_perfil> = db.collection(
        RESPUESTAS_PERFIL_COLLECTION_NAME
      );

      // Validar si el ID es un ObjectId válido antes de buscar
      if (!ObjectId.isValid(params.id)) {
        set.status = 400;
        return {
          success: false,
          message: "ID de respuesta de perfil inválido",
        };
      }

      // El tipo de 'body' ya está inferido correctamente por Elysia desde t.Partial(t.Object)
      const updateData: Partial<
        Omit<respuestas_perfil, "_id" | "fecha_creacion">
      > = body;

      // Asegurarse de que el cuerpo no esté vacío para evitar actualizaciones sin sentido
      if (Object.keys(updateData).length === 0) {
        set.status = 400;
        return {
          success: false,
          message: "El cuerpo de la solicitud no puede estar vacío para PUT",
        };
      }

      const result = await respuestasCollection.updateOne(
        { _id: new ObjectId(params.id) },
        { $set: updateData }
      );

      if (result.matchedCount === 0) {
        set.status = 404;
        return { success: false, message: "Respuesta de perfil no encontrada" };
      }
      if (result.modifiedCount === 0) {
        set.status = 200;
        return {
          success: true,
          message: "Respuesta de perfil no modificada (datos idénticos)",
        };
      }

      return {
        success: true,
        message: "Respuesta de perfil actualizada exitosamente",
      };
    },
    {
      params: t.Object({
        id: t.String({
          pattern: "^[0-9a-fA-F]{24}$",
          description: "ID de MongoDB válido para la respuesta a actualizar",
        }),
      }),
      body: t.Partial(
        t.Object({
          titulo: t.String({
            description: "Nuevo título para la respuesta",
            minLength: 1,
          }),
          investigador: t.String({
            description: "Nuevo nombre del investigador",
            minLength: 1,
          }),
          escuela: t.String({
            description: "Nueva escuela del investigador",
            minLength: 1,
          }),
          respuestas: t.Array(
            t.String({
              description: "Cada elemento es una respuesta a una pregunta",
              minLength: 1,
            }),
            {
              description: "Array actualizado de respuestas",
              minItems: 1,
            }
          ),
        })
      ),
      detail: {
        summary: "Actualizar una respuesta de perfil de proyecto existente",
        tags: ["Respuestas Perfil"],
      },
    }
  )

  // DELETE /respuestas-perfil/:id - Eliminar una respuesta de perfil por ID
  .delete(
    "/:id",
    async ({ params, set }) => {
      const db = getDb();
      const respuestasCollection: Collection<respuestas_perfil> = db.collection(
        RESPUESTAS_PERFIL_COLLECTION_NAME
      );
      // Validar si el ID es un ObjectId válido antes de buscar
      if (!ObjectId.isValid(params.id)) {
        set.status = 400;
        return {
          success: false,
          message: "ID de respuesta de perfil inválido",
        };
      }

      const result = await respuestasCollection.deleteOne({
        _id: new ObjectId(params.id),
      });

      if (result.deletedCount === 0) {
        set.status = 404;
        return { success: false, message: "Respuesta de perfil no encontrada" };
      }
      return {
        success: true,
        message: "Respuesta de perfil eliminada exitosamente",
      };
    },
    {
      params: t.Object({
        id: t.String({
          pattern: "^[0-9a-fA-F]{24}$",
          description: "ID de MongoDB válido para la respuesta a eliminar",
        }),
      }),
      detail: {
        summary: "Eliminar una respuesta de perfil de proyecto por ID",
        tags: ["Respuestas Perfil"],
      },
    }
  );
