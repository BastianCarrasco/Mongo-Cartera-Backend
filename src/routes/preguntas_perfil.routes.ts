import { Elysia, t } from "elysia";
import { Collection, ObjectId } from "mongodb";
import { getDb } from "../bd/mongo";
import type { perfil_proyecto } from "../types/preguntas_perfil"; // Importa tipos desde 'types'

// Nombre de la colección de preguntas de perfil
const PREGUNTAS_PERFIL_COLLECTION_NAME = "PERFIL_PROYECTO";

// --- TIPOS DEDICADOS PARA LAS OPERACIONES ---

// Tipo para el cuerpo de la solicitud POST al crear una pregunta de perfil
type CreatePerfilProyectoBody = Omit<perfil_proyecto, "_id">;

// Tipo para el cuerpo de la solicitud PUT (parcial) al actualizar una pregunta de perfil
type UpdatePerfilProyectoBody = Partial<Omit<perfil_proyecto, "_id">>;

export const perfilProyectoRoutes = new Elysia({ prefix: "/perfil-proyecto" }) // Agrupa las rutas con un prefijo
  // GET /perfil-proyecto - Obtener todas las preguntas de perfil
  .get(
    "/",
    async () => {
      const db = getDb();
      const preguntasCollection: Collection<perfil_proyecto> = db.collection(
        PREGUNTAS_PERFIL_COLLECTION_NAME
      );
      const preguntas = await preguntasCollection.find({}).toArray();
      return preguntas;
    },
    {
      detail: {
        summary: "Obtener todas las preguntas de perfil de proyecto",
        tags: ["Perfil Proyecto"],
      },
    }
  )

  // GET /perfil-proyecto/:id - Obtener una pregunta de perfil por ID
  .get(
    "/:id",
    async ({ params, set }) => {
      const db = getDb();
      const preguntasCollection: Collection<perfil_proyecto> = db.collection(
        PREGUNTAS_PERFIL_COLLECTION_NAME
      );

      // Validar si el ID es un ObjectId válido antes de buscar
      if (!ObjectId.isValid(params.id)) {
        set.status = 400;
        return {
          success: false,
          message: "ID de pregunta de perfil inválido",
        };
      }

      const pregunta = await preguntasCollection.findOne({
        _id: new ObjectId(params.id),
      });

      if (!pregunta) {
        set.status = 404;
        return { success: false, message: "Pregunta de perfil no encontrada" };
      }
      return { success: true, data: pregunta };
    },
    {
      params: t.Object({
        id: t.String({
          pattern: "^[0-9a-fA-F]{24}$",
          description: "ID de MongoDB válido para la pregunta de perfil",
        }),
      }),
      detail: {
        summary: "Obtener una pregunta de perfil de proyecto por ID",
        tags: ["Perfil Proyecto"],
      },
    }
  )

  // POST /perfil-proyecto - Crear una nueva pregunta de perfil
  .post(
    "/",
    async ({ body, set }) => {
      const db = getDb();
      const preguntasCollection: Collection<perfil_proyecto> = db.collection(
        PREGUNTAS_PERFIL_COLLECTION_NAME
      );

      const newPreguntaData: CreatePerfilProyectoBody = body;

      // Opcional: Validar si ya existe una pregunta con el mismo número o texto
      const existingPregunta = await preguntasCollection.findOne({
        $or: [
          { numero: newPreguntaData.numero },
          { pregunta: newPreguntaData.pregunta },
        ],
      });
      if (existingPregunta) {
        set.status = 409; // Conflict
        return {
          success: false,
          message:
            "Ya existe una pregunta con el mismo número o texto de pregunta",
        };
      }

      const result = await preguntasCollection.insertOne(newPreguntaData);

      if (!result.acknowledged) {
        set.status = 500;
        return {
          success: false,
          message: "Fallo al crear la pregunta de perfil",
        };
      }

      set.status = 201; // Created
      return {
        success: true,
        data: { _id: result.insertedId, ...newPreguntaData },
        message: "Pregunta de perfil creada exitosamente",
      };
    },
    {
      body: t.Object({
        numero: t.Number({
          description: "Número de la pregunta (campo requerido)",
          minimum: 1, // El número debe ser al menos 1
        }),
        pregunta: t.String({
          description: "Texto de la pregunta (campo requerido)",
          minLength: 1, // La pregunta no debe estar vacía
        }),
      }),
      detail: {
        summary: "Crear una nueva pregunta de perfil de proyecto",
        tags: ["Perfil Proyecto"],
      },
    }
  )

  // PUT /perfil-proyecto/:id - Actualizar una pregunta de perfil existente
  .put(
    "/:id",
    async ({ params, body, set }) => {
      const db = getDb();
      const preguntasCollection: Collection<perfil_proyecto> = db.collection(
        PREGUNTAS_PERFIL_COLLECTION_NAME
      );

      // Validar si el ID es un ObjectId válido antes de buscar
      if (!ObjectId.isValid(params.id)) {
        set.status = 400;
        return {
          success: false,
          message: "ID de pregunta de perfil inválido",
        };
      }

      const updateData: UpdatePerfilProyectoBody = body;

      // Asegurarse de que el cuerpo no esté vacío para evitar actualizaciones sin sentido
      if (Object.keys(updateData).length === 0) {
        set.status = 400;
        return {
          success: false,
          message: "El cuerpo de la solicitud no puede estar vacío para PUT",
        };
      }

      // Opcional: Validar si el nuevo número o texto ya existe en otra pregunta
      if (updateData.numero || updateData.pregunta) {
        const query: any = {
          _id: { $ne: new ObjectId(params.id) }, // Que no sea la misma pregunta que estamos actualizando
        };
        const orConditions: any[] = [];
        if (updateData.numero) {
          orConditions.push({ numero: updateData.numero });
        }
        if (updateData.pregunta) {
          orConditions.push({ pregunta: updateData.pregunta });
        }
        if (orConditions.length > 0) {
          query.$or = orConditions;
        }

        const existingPregunta = await preguntasCollection.findOne(query);

        if (existingPregunta) {
          set.status = 409; // Conflict
          return {
            success: false,
            message:
              "Ya existe otra pregunta con el mismo número o texto de pregunta",
          };
        }
      }

      const result = await preguntasCollection.updateOne(
        { _id: new ObjectId(params.id) },
        { $set: updateData }
      );

      if (result.matchedCount === 0) {
        set.status = 404;
        return { success: false, message: "Pregunta de perfil no encontrada" };
      }
      if (result.modifiedCount === 0) {
        set.status = 200;
        return {
          success: true,
          message: "Pregunta de perfil no modificada (datos idénticos)",
        };
      }

      return {
        success: true,
        message: "Pregunta de perfil actualizada exitosamente",
      };
    },
    {
      params: t.Object({
        id: t.String({
          pattern: "^[0-9a-fA-F]{24}$",
          description:
            "ID de MongoDB válido para la pregunta de perfil a actualizar",
        }),
      }),
      body: t.Partial(
        t.Object({
          numero: t.Number({
            description: "Nuevo número para la pregunta",
            minimum: 1,
          }),
          pregunta: t.String({
            description: "Nuevo texto para la pregunta",
            minLength: 1,
          }),
        })
      ),
      detail: {
        summary: "Actualizar una pregunta de perfil de proyecto existente",
        tags: ["Perfil Proyecto"],
      },
    }
  )

  // DELETE /perfil-proyecto/:id - Eliminar una pregunta de perfil por ID
  .delete(
    "/:id",
    async ({ params, set }) => {
      const db = getDb();
      const preguntasCollection: Collection<perfil_proyecto> = db.collection(
        PREGUNTAS_PERFIL_COLLECTION_NAME
      );
      // Validar si el ID es un ObjectId válido antes de buscar
      if (!ObjectId.isValid(params.id)) {
        set.status = 400;
        return {
          success: false,
          message: "ID de pregunta de perfil inválido",
        };
      }

      const result = await preguntasCollection.deleteOne({
        _id: new ObjectId(params.id),
      });

      if (result.deletedCount === 0) {
        set.status = 404;
        return { success: false, message: "Pregunta de perfil no encontrada" };
      }
      return {
        success: true,
        message: "Pregunta de perfil eliminada exitosamente",
      };
    },
    {
      params: t.Object({
        id: t.String({
          pattern: "^[0-9a-fA-F]{24}$",
          description:
            "ID de MongoDB válido para la pregunta de perfil a eliminar",
        }),
      }),
      detail: {
        summary: "Eliminar una pregunta de perfil de proyecto por ID",
        tags: ["Perfil Proyecto"],
      },
    }
  );
