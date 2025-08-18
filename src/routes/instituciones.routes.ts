import { Elysia, t } from "elysia";
import { Collection, ObjectId } from "mongodb";
import { getDb } from "../bd/mongo";
import type { Institucion } from "../types/instituciones"; // Importa tipos desde 'types'

// Nombre de la colección de instituciones
const INSTITUCIONES_COLLECTION_NAME = "INSTITUCIONES";

// --- TIPOS DEDICADOS PARA LAS OPERACIONES ---

// Tipo para el cuerpo de la solicitud POST al crear una Institucion
type CreateInstitucionBody = Omit<Institucion, "_id">;

// Tipo para el cuerpo de la solicitud PUT (parcial) al actualizar una Institucion
type UpdateInstitucionBody = Partial<Omit<Institucion, "_id">>;

export const institucionRoutes = new Elysia({ prefix: "/instituciones" }) // Agrupa las rutas con un prefijo
  // GET /instituciones - Obtener todas las instituciones
  .get(
    "/",
    async () => {
      const db = getDb();
      const institucionesCollection: Collection<Institucion> = db.collection(
        INSTITUCIONES_COLLECTION_NAME
      );
      const instituciones = await institucionesCollection.find({}).toArray();
      return { success: true, data: instituciones };
    },
    {
      detail: {
        summary: "Obtener todas las instituciones",
        tags: ["Instituciones"],
      },
    }
  )

  // GET /instituciones/:id - Obtener una institución por ID
  .get(
    "/:id",
    async ({ params, set }) => {
      const db = getDb();
      const institucionesCollection: Collection<Institucion> = db.collection(
        INSTITUCIONES_COLLECTION_NAME
      );

      // Validar si el ID es un ObjectId válido antes de buscar
      if (!ObjectId.isValid(params.id)) {
        set.status = 400;
        return { success: false, message: "ID de institución inválido" };
      }

      const institucion = await institucionesCollection.findOne({
        _id: new ObjectId(params.id),
      });

      if (!institucion) {
        set.status = 404;
        return { success: false, message: "Institución no encontrada" };
      }
      return { success: true, data: institucion };
    },
    {
      params: t.Object({
        id: t.String({
          pattern: "^[0-9a-fA-F]{24}$",
          description: "ID de MongoDB válido para la institución",
        }),
      }),
      detail: {
        summary: "Obtener una institución por ID",
        tags: ["Instituciones"],
      },
    }
  )

  // POST /instituciones - Crear una nueva institución
  .post(
    "/",
    async ({ body, set }) => {
      const db = getDb();
      const institucionesCollection: Collection<Institucion> = db.collection(
        INSTITUCIONES_COLLECTION_NAME
      );

      const newInstitucionData: CreateInstitucionBody = body;

      // Opcional: Validar si ya existe una institución con el mismo nombre
      const existingInstitucion = await institucionesCollection.findOne({
        nombre: newInstitucionData.nombre,
      });
      if (existingInstitucion) {
        set.status = 409; // Conflict
        return {
          success: false,
          message: "Ya existe una institución con ese nombre",
        };
      }

      const result = await institucionesCollection.insertOne(
        newInstitucionData
      );

      if (!result.acknowledged) {
        set.status = 500;
        return { success: false, message: "Fallo al crear institución" };
      }

      set.status = 201; // Created
      return {
        success: true,
        data: { _id: result.insertedId, ...newInstitucionData },
        message: "Institución creada exitosamente",
      };
    },
    {
      body: t.Object({
        nombre: t.String({
          description: "Nombre de la institución (campo requerido)",
          minLength: 1, // El nombre no debe estar vacío
        }),
      }),
      detail: {
        summary: "Crear una nueva institución",
        tags: ["Instituciones"],
      },
    }
  )

  // PUT /instituciones/:id - Actualizar una institución existente
  .put(
    "/:id",
    async ({ params, body, set }) => {
      const db = getDb();
      const institucionesCollection: Collection<Institucion> = db.collection(
        INSTITUCIONES_COLLECTION_NAME
      );

      // Validar si el ID es un ObjectId válido antes de buscar
      if (!ObjectId.isValid(params.id)) {
        set.status = 400;
        return { success: false, message: "ID de institución inválido" };
      }

      const updateData: UpdateInstitucionBody = body;

      // Asegurarse de que el cuerpo no esté vacío para evitar actualizaciones sin sentido
      if (Object.keys(updateData).length === 0) {
        set.status = 400;
        return {
          success: false,
          message: "El cuerpo de la solicitud no puede estar vacío para PUT",
        };
      }

      // Opcional: Validar si el nuevo nombre ya existe en otra institución
      if (updateData.nombre) {
        const existingInstitucion = await institucionesCollection.findOne({
          _id: { $ne: new ObjectId(params.id) }, // Que no sea la misma institución que estamos actualizando
          nombre: updateData.nombre,
        });
        if (existingInstitucion) {
          set.status = 409; // Conflict
          return {
            success: false,
            message: "Ya existe otra institución con ese nombre",
          };
        }
      }

      const result = await institucionesCollection.updateOne(
        { _id: new ObjectId(params.id) },
        { $set: updateData }
      );

      if (result.matchedCount === 0) {
        set.status = 404;
        return { success: false, message: "Institución no encontrada" };
      }
      if (result.modifiedCount === 0) {
        set.status = 200;
        return {
          success: true,
          message: "Institución no modificada (datos idénticos)",
        };
      }

      return { success: true, message: "Institución actualizada exitosamente" };
    },
    {
      params: t.Object({
        id: t.String({
          pattern: "^[0-9a-fA-F]{24}$",
          description: "ID de MongoDB válido para la institución a actualizar",
        }),
      }),
      body: t.Partial(
        // Usa Partial porque el nombre es el único campo actualizable, pero podría no enviarse
        t.Object({
          nombre: t.String({
            description: "Nuevo nombre para la institución",
            minLength: 1,
          }),
        })
      ),
      detail: {
        summary: "Actualizar una institución existente",
        tags: ["Instituciones"],
      },
    }
  )

  // DELETE /instituciones/:id - Eliminar una institución por ID
  .delete(
    "/:id",
    async ({ params, set }) => {
      const db = getDb();
      const institucionesCollection: Collection<Institucion> = db.collection(
        INSTITUCIONES_COLLECTION_NAME
      );
      // Validar si el ID es un ObjectId válido antes de buscar
      if (!ObjectId.isValid(params.id)) {
        set.status = 400;
        return { success: false, message: "ID de institución inválido" };
      }

      const result = await institucionesCollection.deleteOne({
        _id: new ObjectId(params.id),
      });

      if (result.deletedCount === 0) {
        set.status = 404;
        return { success: false, message: "Institución no encontrada" };
      }
      return { success: true, message: "Institución eliminada exitosamente" };
    },
    {
      params: t.Object({
        id: t.String({
          pattern: "^[0-9a-fA-F]{24}$",
          description: "ID de MongoDB válido para la institución a eliminar",
        }),
      }),
      detail: {
        summary: "Eliminar una institución por ID",
        tags: ["Instituciones"],
      },
    }
  );
