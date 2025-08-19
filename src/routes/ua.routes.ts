import { Elysia, t } from "elysia";
import { Collection, ObjectId } from "mongodb";
import { getDb } from "../bd/mongo";
import type { UnidadAcademica } from "../types/ua"; // Importa tipos desde 'types'

// Nombre de la colección de unidades académicas
const UA_COLLECTION_NAME = "UA";

// --- TIPOS DEDICADOS PARA LAS OPERACIONES ---

// Tipo para el cuerpo de la solicitud POST al crear una UnidadAcademica
type CreateUnidadAcademicaBody = Omit<UnidadAcademica, "_id">;

// Tipo para el cuerpo de la solicitud PUT (parcial) al actualizar una UnidadAcademica
type UpdateUnidadAcademicaBody = Partial<Omit<UnidadAcademica, "_id">>;

export const unidadAcademicaRoutes = new Elysia({
  prefix: "/unidades-academicas",
}) // Agrupa las rutas con un prefijo
  // GET /unidades-academicas - Obtener todas las unidades académicas
  .get(
    "/",
    async () => {
      const db = getDb();
      const uaCollection: Collection<UnidadAcademica> =
        db.collection(UA_COLLECTION_NAME);
      const unidadesAcademicas = await uaCollection.find({}).toArray();
      return unidadesAcademicas;
    },
    {
      detail: {
        summary: "Obtener todas las unidades académicas",
        tags: ["Unidades Académicas"],
      },
    }
  )

  // GET /unidades-academicas/:id - Obtener una unidad académica por ID
  .get(
    "/:id",
    async ({ params, set }) => {
      const db = getDb();
      const uaCollection: Collection<UnidadAcademica> =
        db.collection(UA_COLLECTION_NAME);

      // Validar si el ID es un ObjectId válido antes de buscar
      if (!ObjectId.isValid(params.id)) {
        set.status = 400;
        return { success: false, message: "ID de unidad académica inválido" };
      }

      const unidadAcademica = await uaCollection.findOne({
        _id: new ObjectId(params.id),
      });

      if (!unidadAcademica) {
        set.status = 404;
        return { success: false, message: "Unidad académica no encontrada" };
      }
      return { success: true, data: unidadAcademica };
    },
    {
      params: t.Object({
        id: t.String({
          pattern: "^[0-9a-fA-F]{24}$",
          description: "ID de MongoDB válido para la unidad académica",
        }),
      }),
      detail: {
        summary: "Obtener una unidad académica por ID",
        tags: ["Unidades Académicas"],
      },
    }
  )

  // POST /unidades-academicas - Crear una nueva unidad académica
  .post(
    "/",
    async ({ body, set }) => {
      const db = getDb();
      const uaCollection: Collection<UnidadAcademica> =
        db.collection(UA_COLLECTION_NAME);

      const newUnidadAcademicaData: CreateUnidadAcademicaBody = body;

      // Opcional: Validar si ya existe una unidad académica con el mismo nombre
      const existingUnidadAcademica = await uaCollection.findOne({
        nombre: newUnidadAcademicaData.nombre,
      });
      if (existingUnidadAcademica) {
        set.status = 409; // Conflict
        return {
          success: false,
          message: "Ya existe una unidad académica con ese nombre",
        };
      }

      const result = await uaCollection.insertOne(newUnidadAcademicaData);

      if (!result.acknowledged) {
        set.status = 500;
        return { success: false, message: "Fallo al crear unidad académica" };
      }

      set.status = 201; // Created
      return {
        success: true,
        data: { _id: result.insertedId, ...newUnidadAcademicaData },
        message: "Unidad académica creada exitosamente",
      };
    },
    {
      body: t.Object({
        nombre: t.String({
          description: "Nombre de la unidad académica (campo requerido)",
          minLength: 1, // El nombre no debe estar vacío
        }),
      }),
      detail: {
        summary: "Crear una nueva unidad académica",
        tags: ["Unidades Académicas"],
      },
    }
  )

  // PUT /unidades-academicas/:id - Actualizar una unidad académica existente
  .put(
    "/:id",
    async ({ params, body, set }) => {
      const db = getDb();
      const uaCollection: Collection<UnidadAcademica> =
        db.collection(UA_COLLECTION_NAME);

      // Validar si el ID es un ObjectId válido antes de buscar
      if (!ObjectId.isValid(params.id)) {
        set.status = 400;
        return { success: false, message: "ID de unidad académica inválido" };
      }

      const updateData: UpdateUnidadAcademicaBody = body;

      // Asegurarse de que el cuerpo no esté vacío para evitar actualizaciones sin sentido
      if (Object.keys(updateData).length === 0) {
        set.status = 400;
        return {
          success: false,
          message: "El cuerpo de la solicitud no puede estar vacío para PUT",
        };
      }

      // Opcional: Validar si el nuevo nombre ya existe en otra unidad académica
      if (updateData.nombre) {
        const existingUnidadAcademica = await uaCollection.findOne({
          _id: { $ne: new ObjectId(params.id) }, // Que no sea la misma unidad académica que estamos actualizando
          nombre: updateData.nombre,
        });
        if (existingUnidadAcademica) {
          set.status = 409; // Conflict
          return {
            success: false,
            message: "Ya existe otra unidad académica con ese nombre",
          };
        }
      }

      const result = await uaCollection.updateOne(
        { _id: new ObjectId(params.id) },
        { $set: updateData }
      );

      if (result.matchedCount === 0) {
        set.status = 404;
        return { success: false, message: "Unidad académica no encontrada" };
      }
      if (result.modifiedCount === 0) {
        set.status = 200;
        return {
          success: true,
          message: "Unidad académica no modificada (datos idénticos)",
        };
      }

      return {
        success: true,
        message: "Unidad académica actualizada exitosamente",
      };
    },
    {
      params: t.Object({
        id: t.String({
          pattern: "^[0-9a-fA-F]{24}$",
          description:
            "ID de MongoDB válido para la unidad académica a actualizar",
        }),
      }),
      body: t.Partial(
        // Usa Partial porque el nombre es el único campo actualizable, pero podría no enviarse
        t.Object({
          nombre: t.String({
            description: "Nuevo nombre para la unidad académica",
            minLength: 1,
          }),
        })
      ),
      detail: {
        summary: "Actualizar una unidad académica existente",
        tags: ["Unidades Académicas"],
      },
    }
  )

  // DELETE /unidades-academicas/:id - Eliminar una unidad académica por ID
  .delete(
    "/:id",
    async ({ params, set }) => {
      const db = getDb();
      const uaCollection: Collection<UnidadAcademica> =
        db.collection(UA_COLLECTION_NAME);
      // Validar si el ID es un ObjectId válido antes de buscar
      if (!ObjectId.isValid(params.id)) {
        set.status = 400;
        return { success: false, message: "ID de unidad académica inválido" };
      }

      const result = await uaCollection.deleteOne({
        _id: new ObjectId(params.id),
      });

      if (result.deletedCount === 0) {
        set.status = 404;
        return { success: false, message: "Unidad académica no encontrada" };
      }
      return {
        success: true,
        message: "Unidad académica eliminada exitosamente",
      };
    },
    {
      params: t.Object({
        id: t.String({
          pattern: "^[0-9a-fA-F]{24}$",
          description:
            "ID de MongoDB válido para la unidad académica a eliminar",
        }),
      }),
      detail: {
        summary: "Eliminar una unidad académica por ID",
        tags: ["Unidades Académicas"],
      },
    }
  );
