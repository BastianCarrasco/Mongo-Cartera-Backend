import { Elysia, t } from "elysia";
import { Collection, ObjectId } from "mongodb";
import { getDb } from "../bd/mongo";
import type { Estudiantes } from "../types/estudiantes"; // Asegúrate de que este tipo sea correcto

// Nombre de la colección de estudiantes
const ESTUDIANTES_COLLECTION_NAME = "ESTUDIANTES";

// --- TIPOS DEDICADOS PARA LAS OPERACIONES ---

// Tipo para el cuerpo de la solicitud POST al crear un Estudiante
type CreateEstudianteBody = Omit<Estudiantes, "_id">;

// Tipo para el cuerpo de la solicitud PUT (parcial) al actualizar un Estudiante
type UpdateEstudianteBody = Partial<Omit<Estudiantes, "_id">>;

// Reutilizamos este tipo para los PATCH, pero lo renombramos para ser más genérico y reflejar que aplica a estudiantes
type UpdateEstudianteFotoByNameBody = {
  nombre: string;
  a_paterno: string;
  a_materno: string | null;
  link_foto: string | null;
};

// Nuevo tipo para el cuerpo de la solicitud de actualización de foto por nombre (para múltiples estudiantes)
type UpdateEstudianteFotosBatchBody = UpdateEstudianteFotoByNameBody[]; // Es un arreglo del tipo UpdateEstudianteFotoByNameBody

// --- ESQUEMAS DE VALIDACIÓN REUTILIZABLES ---
const estudianteBaseSchema = t.Object({
  nombre: t.String({ description: "Nombre del estudiante" }),
  // CAMBIO CLAVE AQUÍ: email ahora acepta string con formato, null, o string vacío
  email: t.Union([t.String({ format: "email" }), t.Null(), t.Literal("")], {
    description: "Email del estudiante (puede ser email válido, null, o vacío)",
  }),
  // a_materno ya lo tenías bien si quieres que soporte string vacío también
  a_materno: t.Union([t.String(), t.Null(), t.Literal("")], {
    description:
      "Apellido materno del estudiante (opcional, puede ser nulo o vacío)",
  }),
  a_paterno: t.String({ description: "Apellido paterno del estudiante" }),
  // unidad también lo tenías bien si quieres que soporte string vacío
  unidad: t.Union([t.String(), t.Null(), t.Literal("")], {
    description:
      "Unidad o departamento al que pertenece el estudiante (puede ser nulo o vacío)",
  }),
  // CAMBIO CLAVE AQUÍ: link_foto ahora acepta string con formato, null, o string vacío
  link_foto: t.Union([t.String({ format: "uri" }), t.Null(), t.Literal("")], {
    description:
      "URL de la foto del estudiante (puede ser URI válida, null, o vacío)",
  }),
});

const updateFotoBodySchema = t.Object({
  nombre: t.String({ description: "Nombre del estudiante a buscar" }),
  a_paterno: t.String({
    description: "Apellido paterno del estudiante a buscar",
  }),
  // a_materno en updateFotoBodySchema
  a_materno: t.Union([t.String(), t.Null(), t.Literal("")], {
    description:
      "Apellido materno del estudiante a buscar (opcional, puede ser nulo o vacío)",
  }),
  // CAMBIO CLAVE AQUÍ: link_foto en updateFotoBodySchema
  link_foto: t.Union([t.String({ format: "uri" }), t.Null(), t.Literal("")], {
    description:
      "Nuevo URL de la foto del estudiante (puede ser URI válida, null, o vacío)",
  }),
});

export const estudiantesRoutes = new Elysia({ prefix: "/estudiantes" }) // Agrupa las rutas con un prefijo
  .get(
    "/",
    async () => {
      const db = getDb();
      const estudiantesCollection: Collection<Estudiantes> = db.collection(
        ESTUDIANTES_COLLECTION_NAME
      );
      const estudiantes = await estudiantesCollection.find({}).toArray();
      // Retorna directamente el arreglo
      return estudiantes;
    },
    {
      detail: {
        summary: "Obtener todos los estudiantes",
        tags: ["Estudiantes"],
      },
    }
  )
  .get(
    "/:id",
    async ({ params, set }) => {
      const db = getDb();
      const estudiantesCollection: Collection<Estudiantes> = db.collection(
        ESTUDIANTES_COLLECTION_NAME
      );

      // Validar si el ID es un ObjectId válido antes de buscar
      if (!ObjectId.isValid(params.id)) {
        set.status = 400;
        return { success: false, message: "ID de estudiante inválido" };
      }

      const estudiante = await estudiantesCollection.findOne({
        _id: new ObjectId(params.id),
      });

      if (!estudiante) {
        set.status = 404;
        return { success: false, message: "Estudiante no encontrado" };
      }
      return { success: true, data: estudiante };
    },
    {
      params: t.Object({
        id: t.String({
          pattern: "^[0-9a-fA-F]{24}$",
          description: "ID de MongoDB válido para el estudiante",
        }),
      }),
      detail: {
        summary: "Obtener un estudiante por ID",
        tags: ["Estudiantes"],
      },
    }
  )
  .post(
    "/",
    async ({ body, set }) => {
      const db = getDb();
      const estudiantesCollection: Collection<Estudiantes> = db.collection(
        ESTUDIANTES_COLLECTION_NAME
      );

      const newEstudianteData: CreateEstudianteBody = body;

      const result = await estudiantesCollection.insertOne(newEstudianteData);

      if (!result.acknowledged) {
        set.status = 500;
        return { success: false, message: "Fallo al crear estudiante" };
      }

      set.status = 201; // Created
      return {
        success: true,
        data: { _id: result.insertedId, ...newEstudianteData },
        message: "Estudiante creado exitosamente",
      };
    },
    {
      body: estudianteBaseSchema, // Reutilización del esquema base
      detail: {
        summary: "Crear un nuevo estudiante",
        tags: ["Estudiantes"],
      },
    }
  )
  .put(
    "/:id",
    async ({ params, body, set }) => {
      const db = getDb();
      const estudiantesCollection: Collection<Estudiantes> = db.collection(
        ESTUDIANTES_COLLECTION_NAME
      );

      // Validar si el ID es un ObjectId válido antes de buscar
      if (!ObjectId.isValid(params.id)) {
        set.status = 400;
        return { success: false, message: "ID de estudiante inválido" };
      }

      const updateData: UpdateEstudianteBody = body;

      // Asegurarse de que el cuerpo no esté vacío para evitar actualizaciones sin sentido
      if (Object.keys(updateData).length === 0) {
        set.status = 400;
        return {
          success: false,
          message: "El cuerpo de la solicitud no puede estar vacío para PUT",
        };
      }

      const result = await estudiantesCollection.updateOne(
        { _id: new ObjectId(params.id) },
        { $set: updateData }
      );

      if (result.matchedCount === 0) {
        set.status = 404;
        return { success: false, message: "Estudiante no encontrado" };
      }
      if (result.modifiedCount === 0) {
        // Esto puede ocurrir si los datos enviados son idénticos a los existentes
        set.status = 200;
        return {
          success: true,
          message: "Estudiante no modificado (datos idénticos)",
        };
      }

      return { success: true, message: "Estudiante actualizado exitosamente" };
    },
    {
      params: t.Object({
        id: t.String({
          pattern: "^[0-9a-fA-F]{24}$",
          description: "ID de MongoDB válido para el estudiante a actualizar",
        }),
      }),
      body: t.Partial(estudianteBaseSchema), // Reutilización del esquema parcial
      detail: {
        summary: "Actualizar un estudiante existente",
        tags: ["Estudiantes"],
      },
    }
  )
  .delete(
    "/:id",
    async ({ params, set }) => {
      const db = getDb();
      const estudiantesCollection: Collection<Estudiantes> = db.collection(
        ESTUDIANTES_COLLECTION_NAME
      );

      // Validar si el ID es un ObjectId válido antes de buscar
      if (!ObjectId.isValid(params.id)) {
        set.status = 400;
        return { success: false, message: "ID de estudiante inválido" };
      }

      const result = await estudiantesCollection.deleteOne({
        _id: new ObjectId(params.id),
      });

      if (result.deletedCount === 0) {
        set.status = 404;
        return { success: false, message: "Estudiante no encontrado" };
      }
      return { success: true, message: "Estudiante eliminado exitosamente" };
    },
    {
      params: t.Object({
        id: t.String({
          pattern: "^[0-9a-fA-F]{24}$",
          description: "ID de MongoDB válido para el estudiante a eliminar",
        }),
      }),
      detail: {
        summary: "Eliminar un estudiante por ID",
        tags: ["Estudiantes"],
      },
    }
  )
  .patch(
    "/update-photo", // Este endpoint actualiza UN solo estudiante
    async ({ body, set }) => {
      const db = getDb();
      const estudiantesCollection: Collection<Estudiantes> = db.collection(
        ESTUDIANTES_COLLECTION_NAME
      );

      const { nombre, a_paterno, a_materno, link_foto } =
        body as UpdateEstudianteFotoByNameBody;

      // Construir el filtro de búsqueda
      const filter: {
        nombre: string;
        a_paterno: string;
        a_materno?: string | null; // a_materno es opcional en el filtro
      } = {
        nombre,
        a_paterno,
      };

      // Si a_materno está presente (incluso como null), lo incluimos en el filtro
      if (a_materno !== undefined) {
        filter.a_materno = a_materno;
      }
      // Si a_materno es undefined, el filtro no lo incluirá, buscando cualquier valor para a_materno.

      const result = await estudiantesCollection.updateOne(
        filter,
        { $set: { link_foto: link_foto } } // Solo actualizamos link_foto
      );

      if (result.matchedCount === 0) {
        set.status = 404;
        return {
          success: false,
          message: "Estudiante no encontrado con esos datos",
        };
      }
      if (result.modifiedCount === 0) {
        set.status = 200;
        return {
          success: true,
          message: "link_foto del estudiante no modificado (ya es idéntico)",
        };
      }

      return {
        success: true,
        message: "link_foto del estudiante actualizado exitosamente",
      };
    },
    {
      body: updateFotoBodySchema, // Reutilización del esquema
      detail: {
        summary:
          "Actualizar link_foto de un estudiante por nombre, apellido paterno y materno",
        tags: ["Estudiantes"],
      },
    }
  )
  .patch(
    "/update-photos-batch", // Nuevo endpoint para actualizar MÚLTIPLES estudiantes
    async ({ body, set }) => {
      const db = getDb();
      const estudiantesCollection: Collection<Estudiantes> = db.collection(
        ESTUDIANTES_COLLECTION_NAME
      );

      const updates: UpdateEstudianteFotosBatchBody =
        body as UpdateEstudianteFotosBatchBody;
      const results: Array<{
        query: UpdateEstudianteFotoByNameBody; // Incluir los datos de la consulta para mejor depuración
        status: string;
        message: string;
      }> = [];

      if (updates.length === 0) {
        set.status = 400;
        return {
          success: false,
          message: "El arreglo de actualizaciones no puede estar vacío",
        };
      }

      for (const updateData of updates) {
        const { nombre, a_paterno, a_materno, link_foto } = updateData;

        const filter: {
          nombre: string;
          a_paterno: string;
          a_materno?: string | null;
        } = {
          nombre,
          a_paterno,
        };

        if (a_materno !== undefined) {
          filter.a_materno = a_materno;
        }

        try {
          const result = await estudiantesCollection.updateOne(filter, {
            $set: { link_foto: link_foto },
          });

          if (result.matchedCount === 0) {
            results.push({
              query: updateData,
              status: "failed",
              message: "Estudiante no encontrado con esos datos",
            });
          } else if (result.modifiedCount === 0) {
            results.push({
              query: updateData,
              status: "skipped",
              message:
                "link_foto del estudiante no modificado (ya es idéntico)",
            });
          } else {
            results.push({
              query: updateData,
              status: "success",
              message: "link_foto del estudiante actualizado exitosamente",
            });
          }
        } catch (error: any) {
          console.error("Error al actualizar estudiante:", error);
          results.push({
            query: updateData,
            status: "error",
            message: `Error interno al procesar: ${error.message}`,
          });
        }
      }

      // Determinar el estado general de la respuesta
      const anySuccess = results.some((r) => r.status === "success");
      const allFailed = results.every(
        (r) => r.status === "failed" || r.status === "error"
      );

      if (allFailed) {
        set.status = 400;
        return {
          success: false,
          message:
            "Todas las actualizaciones fallaron o no se encontraron estudiantes",
          results,
        };
      } else if (!anySuccess) {
        set.status = 200;
        return {
          success: true,
          message: "Ningún link_foto de estudiante fue modificado",
          results,
        };
      }

      set.status = 200;
      return {
        success: true,
        message: "Proceso de actualización por lotes completado",
        results,
      };
    },
    {
      body: t.Array(
        updateFotoBodySchema, // Reutilización del esquema
        {
          description:
            "Arreglo de datos para actualizar la foto de múltiples estudiantes",
        }
      ),
      detail: {
        summary:
          "Actualizar link_foto de múltiples estudiantes por nombre, apellido paterno y materno (batch)",
        tags: ["Estudiantes"],
      },
    }
  );
