import { Elysia, t } from "elysia";
import { Collection, ObjectId } from "mongodb";
import { getDb } from "../bd/mongo";
import type { Academico } from "../types/academicos"; // Importa tipos desde 'types'

// Nombre de la colección de académicos
const ACADEMICOS_COLLECTION_NAME = "ACADEMICOS";

// --- TIPOS DEDICADOS PARA LAS OPERACIONES ---

// Tipo para el cuerpo de la solicitud POST al crear un Academico
type CreateAcademicoBody = Omit<Academico, "_id">;

// Tipo para el cuerpo de la solicitud PUT (parcial) al actualizar un Academico
type UpdateAcademicoBody = Partial<Omit<Academico, "_id">>;

// Tipo para el cuerpo de la solicitud de actualización de foto por nombre (para un solo académico)
// Ajustado para permitir link_foto como string o null, consistente con el esquema de Elysia
type UpdateFotoByNameBody = {
  nombre: string;
  a_paterno: string;
  a_materno: string | null;
  link_foto: string | null; // <--- Cambio aquí: permite null
};

// Nuevo tipo para el cuerpo de la solicitud de actualización de foto por nombre (para múltiples académicos)
type UpdateFotosBatchBody = UpdateFotoByNameBody[]; // Es un arreglo del tipo UpdateFotoByNameBody

// --- ESQUEMAS DE VALIDACIÓN REUTILIZABLES ---
const academicoBaseSchema = t.Object({
  nombre: t.String({ description: "Nombre del académico" }),
  // Email ahora puede ser email válido, null, o string vacío
  email: t.Union([t.String({ format: "email" }), t.Null(), t.Literal("")], {
    description: "Email del académico (puede ser email válido, null, o vacío)",
  }),
  // a_materno puede ser string, null, o string vacío
  a_materno: t.Union([t.String(), t.Null(), t.Literal("")], {
    description:
      "Apellido materno del académico (opcional, puede ser nulo o vacío)",
  }),
  a_paterno: t.String({ description: "Apellido paterno del académico" }),
  // unidad puede ser string, null, o string vacío
  unidad: t.Union([t.String(), t.Null(), t.Literal("")], {
    description: "Unidad o departamento del académico (puede ser nulo o vacío)",
  }),
  // link_foto ahora puede ser URI válida, null, o string vacío
  link_foto: t.Union([t.String({ format: "uri" }), t.Null(), t.Literal("")], {
    description:
      "URL de la foto del académico (puede ser URI válida, null, o vacío)",
  }),
});

const updateFotoBodySchema = t.Object({
  nombre: t.String({ description: "Nombre del académico a buscar" }),
  a_paterno: t.String({
    description: "Apellido paterno del académico a buscar",
  }),
  // a_materno en updateFotoBodySchema
  a_materno: t.Union([t.String(), t.Null(), t.Literal("")], {
    description:
      "Apellido materno del académico a buscar (opcional, puede ser nulo o vacío)",
  }),
  // link_foto en updateFotoBodySchema
  link_foto: t.Union([t.String({ format: "uri" }), t.Null(), t.Literal("")], {
    description:
      "Nuevo URL de la foto del académico (puede ser URI válida, null, o vacío)",
  }),
});

export const academicoRoutes = new Elysia({ prefix: "/academicos" }) // Agrupa las rutas con un prefijo
  .get(
    "/",
    async () => {
      const db = getDb();
      const academicosCollection: Collection<Academico> = db.collection(
        ACADEMICOS_COLLECTION_NAME
      );
      const academicos = await academicosCollection.find({}).toArray();
      // Retorna directamente el arreglo
      return academicos;
    },
    {
      detail: {
        summary: "Obtener todos los académicos",
        tags: ["Académicos"],
      },
    }
  )
  .get(
    "/:id",
    async ({ params, set }) => {
      const db = getDb();
      const academicosCollection: Collection<Academico> = db.collection(
        ACADEMICOS_COLLECTION_NAME
      );

      // Validar si el ID es un ObjectId válido antes de buscar
      if (!ObjectId.isValid(params.id)) {
        set.status = 400;
        return { success: false, message: "ID de académico inválido" };
      }

      const academico = await academicosCollection.findOne({
        _id: new ObjectId(params.id),
      });

      if (!academico) {
        set.status = 404;
        return { success: false, message: "Académico no encontrado" };
      }
      return { success: true, data: academico };
    },
    {
      params: t.Object({
        id: t.String({
          pattern: "^[0-9a-fA-F]{24}$",
          description: "ID de MongoDB válido para el académico",
        }),
      }),
      detail: {
        summary: "Obtener un académico por ID",
        tags: ["Académicos"],
      },
    }
  )
  .post(
    "/",
    async ({ body, set }) => {
      const db = getDb();
      const academicosCollection: Collection<Academico> = db.collection(
        ACADEMICOS_COLLECTION_NAME
      );

      const newAcademicoData: CreateAcademicoBody = body;

      const result = await academicosCollection.insertOne(newAcademicoData);

      if (!result.acknowledged) {
        set.status = 500;
        return { success: false, message: "Fallo al crear académico" };
      }

      set.status = 201; // Created
      return {
        success: true,
        data: { _id: result.insertedId, ...newAcademicoData },
        message: "Académico creado exitosamente",
      };
    },
    {
      body: academicoBaseSchema, // <--- Reutilización del esquema base
      detail: {
        summary: "Crear un nuevo académico",
        tags: ["Académicos"],
      },
    }
  )
  .put(
    "/:id",
    async ({ params, body, set }) => {
      const db = getDb();
      const academicosCollection: Collection<Academico> = db.collection(
        ACADEMICOS_COLLECTION_NAME
      );

      // Validar si el ID es un ObjectId válido antes de buscar
      if (!ObjectId.isValid(params.id)) {
        set.status = 400;
        return { success: false, message: "ID de académico inválido" };
      }

      const updateData: UpdateAcademicoBody = body;

      // Asegurarse de que el cuerpo no esté vacío para evitar actualizaciones sin sentido
      if (Object.keys(updateData).length === 0) {
        set.status = 400;
        return {
          success: false,
          message: "El cuerpo de la solicitud no puede estar vacío para PUT",
        };
      }

      const result = await academicosCollection.updateOne(
        { _id: new ObjectId(params.id) },
        { $set: updateData }
      );

      if (result.matchedCount === 0) {
        set.status = 404;
        return { success: false, message: "Académico no encontrado" };
      }
      if (result.modifiedCount === 0) {
        // Esto puede ocurrir si los datos enviados son idénticos a los existentes
        set.status = 200;
        return {
          success: true,
          message: "Académico no modificado (datos idénticos)",
        };
      }

      return { success: true, message: "Académico actualizado exitosamente" };
    },
    {
      params: t.Object({
        id: t.String({
          pattern: "^[0-9a-fA-F]{24}$",
          description: "ID de MongoDB válido para el académico a actualizar",
        }),
      }),
      body: t.Partial(academicoBaseSchema), // <--- Reutilización del esquema parcial
      detail: {
        summary: "Actualizar un académico existente",
        tags: ["Académicos"],
      },
    }
  )
  .delete(
    "/:id",
    async ({ params, set }) => {
      const db = getDb();
      const academicosCollection: Collection<Academico> = db.collection(
        ACADEMICOS_COLLECTION_NAME
      );

      // Validar si el ID es un ObjectId válido antes de buscar
      if (!ObjectId.isValid(params.id)) {
        set.status = 400;
        return { success: false, message: "ID de académico inválido" };
      }

      const result = await academicosCollection.deleteOne({
        _id: new ObjectId(params.id),
      });

      if (result.deletedCount === 0) {
        set.status = 404;
        return { success: false, message: "Académico no encontrado" };
      }
      return { success: true, message: "Académico eliminado exitosamente" };
    },
    {
      params: t.Object({
        id: t.String({
          pattern: "^[0-9a-fA-F]{24}$",
          description: "ID de MongoDB válido para el académico a eliminar",
        }),
      }),
      detail: {
        summary: "Eliminar un académico por ID",
        tags: ["Académicos"],
      },
    }
  )
  .patch(
    "/update-photo", // Este endpoint actualiza UN solo académico
    async ({ body, set }) => {
      const db = getDb();
      const academicosCollection: Collection<Academico> = db.collection(
        ACADEMICOS_COLLECTION_NAME
      );

      const { nombre, a_paterno, a_materno, link_foto } =
        body as UpdateFotoByNameBody;

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

      const result = await academicosCollection.updateOne(
        filter,
        { $set: { link_foto: link_foto } } // Solo actualizamos link_foto
      );

      if (result.matchedCount === 0) {
        set.status = 404;
        return {
          success: false,
          message: "Académico no encontrado con esos datos",
        };
      }
      if (result.modifiedCount === 0) {
        set.status = 200;
        return {
          success: true,
          message: "link_foto del académico no modificado (ya es idéntico)",
        };
      }

      return {
        success: true,
        message: "link_foto del académico actualizado exitosamente",
      };
    },
    {
      body: updateFotoBodySchema, // <--- Reutilización del esquema
      detail: {
        summary:
          "Actualizar link_foto de un académico por nombre, apellido paterno y materno",
        tags: ["Académicos"],
      },
    }
  )
  .patch(
    "/update-photos-batch", // Nuevo endpoint para actualizar MÚLTIPLES académicos
    async ({ body, set }) => {
      const db = getDb();
      const academicosCollection: Collection<Academico> = db.collection(
        ACADEMICOS_COLLECTION_NAME
      );

      const updates: UpdateFotosBatchBody = body as UpdateFotosBatchBody;
      const results: Array<{
        query: UpdateFotoByNameBody; // Incluir los datos de la consulta para mejor depuración
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
          // Usamos updateOne aquí porque cada objeto en el arreglo representa un único académico
          // que queremos actualizar. Si hubiera múltiples con los mismos criterios de nombre,
          // solo se actualizaría el primero que encuentre.
          const result = await academicosCollection.updateOne(filter, {
            $set: { link_foto: link_foto },
          });

          if (result.matchedCount === 0) {
            results.push({
              query: updateData,
              status: "failed",
              message: "Académico no encontrado con esos datos",
            });
          } else if (result.modifiedCount === 0) {
            results.push({
              query: updateData,
              status: "skipped",
              message: "link_foto del académico no modificado (ya es idéntico)",
            });
          } else {
            results.push({
              query: updateData,
              status: "success",
              message: "link_foto del académico actualizado exitosamente",
            });
          }
        } catch (error: any) {
          console.error("Error al actualizar académico:", error);
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
        set.status = 400; // O 500 si hubo errores de servidor irrecuperables para todas
        return {
          success: false,
          message:
            "Todas las actualizaciones fallaron o no se encontraron académicos",
          results,
        };
      } else if (!anySuccess) {
        set.status = 200; // Ningún tuvo éxito, pero tampoco hubo errores de búsqueda/validación
        return {
          success: true,
          message: "Ningún link_foto de académico fue modificado",
          results,
        };
      }

      set.status = 200; // Al menos uno tuvo éxito
      return {
        success: true,
        message: "Proceso de actualización por lotes completado",
        results,
      };
    },
    {
      body: t.Array(
        updateFotoBodySchema, // <--- Reutilización del esquema
        {
          description:
            "Arreglo de datos para actualizar la foto de múltiples académicos",
        }
      ),
      detail: {
        summary:
          "Actualizar link_foto de múltiples académicos por nombre, apellido paterno y materno (batch)",
        tags: ["Académicos"],
      },
    }
  );
