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
type UpdateFotoByNameBody = {
  nombre: string;
  a_paterno: string;
  a_materno: string | null;
  Link_Foto: string;
};

// Nuevo tipo para el cuerpo de la solicitud de actualización de foto por nombre (para múltiples académicos)
type UpdateFotosBatchBody = UpdateFotoByNameBody[]; // Es un arreglo del tipo UpdateFotoByNameBody

export const academicoRoutes = new Elysia({ prefix: "/academicos" }) // Agrupa las rutas con un prefijo
  .get(
    "/",
    async () => {
      const db = getDb();
      const academicosCollection: Collection<Academico> = db.collection(
        ACADEMICOS_COLLECTION_NAME
      );
      const academicos = await academicosCollection.find({}).toArray();
      // MODIFICACIÓN: Retorna directamente el arreglo
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
      body: t.Object({
        nombre: t.String({ description: "Nombre del académico" }),
        email: t.String({
          format: "email",
          description: "Email del académico",
        }),
        a_materno: t.Union([t.String(), t.Null()], {
          description: "Apellido materno del académico (opcional)",
        }),
        a_paterno: t.String({ description: "Apellido paterno del académico" }),
        unidad: t.String({
          description: "Unidad o departamento del académico",
        }),
        Link_Foto: t.String({
          format: "uri",
          description: "URL de la foto del académico",
        }),
      }),
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
      body: t.Partial(
        t.Object({
          nombre: t.String(),
          email: t.String({ format: "email" }),
          a_materno: t.Union([t.String(), t.Null()]),
          a_paterno: t.String(),
          unidad: t.String(),
          Link_Foto: t.String({ format: "uri" }),
        })
      ),
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

      const { nombre, a_paterno, a_materno, Link_Foto } =
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
        { $set: { Link_Foto: Link_Foto } } // Solo actualizamos Link_Foto
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
          message: "Link_Foto del académico no modificado (ya es idéntico)",
        };
      }

      return {
        success: true,
        message: "Link_Foto del académico actualizado exitosamente",
      };
    },
    {
      body: t.Object({
        nombre: t.String({ description: "Nombre del académico a buscar" }),
        a_paterno: t.String({
          description: "Apellido paterno del académico a buscar",
        }),
        a_materno: t.Union([t.String(), t.Null()], {
          description: "Apellido materno del académico a buscar (opcional)",
        }),
        Link_Foto: t.String({
          format: "uri",
          description: "Nuevo URL de la foto del académico",
        }),
      }),
      detail: {
        summary:
          "Actualizar Link_Foto de un académico por nombre, apellido paterno y materno",
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
        const { nombre, a_paterno, a_materno, Link_Foto } = updateData;

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
            $set: { Link_Foto: Link_Foto },
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
              message: "Link_Foto del académico no modificado (ya es idéntico)",
            });
          } else {
            results.push({
              query: updateData,
              status: "success",
              message: "Link_Foto del académico actualizado exitosamente",
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
          message: "Ningún Link_Foto de académico fue modificado",
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
        // ¡Aquí la clave! Espera un arreglo de los objetos de actualización
        t.Object({
          nombre: t.String({ description: "Nombre del académico a buscar" }),
          a_paterno: t.String({
            description: "Apellido paterno del académico a buscar",
          }),
          a_materno: t.Union([t.String(), t.Null()], {
            description: "Apellido materno del académico a buscar (opcional)",
          }),
          Link_Foto: t.String({
            format: "uri",
            description: "Nuevo URL de la foto del académico",
          }),
        }),
        {
          description:
            "Arreglo de datos para actualizar la foto de múltiples académicos",
        }
      ),
      detail: {
        summary:
          "Actualizar Link_Foto de múltiples académicos por nombre, apellido paterno y materno (batch)",
        tags: ["Académicos"],
      },
    }
  );
