import { Elysia, t } from "elysia";
import { Collection, ObjectId } from "mongodb";
import { getDb } from "../bd/mongo";
import type { Fondos } from "../types/fondos"; // Tu modelo Fondos actualizado

// Nombre de la colección de fondos
const FONDOS_COLLECTION_NAME = "FONDOS";

// --- Rutas CRUD para Fondos ---

export const fondosRoutes = new Elysia({ prefix: "/fondos" }) // Prefijo para estas rutas
  // GET /fondos/ - Obtener todos los fondos
  .get(
    "/",
    async () => {
      const db = getDb();
      const fondosCollection: Collection<Fondos> = db.collection<Fondos>(
        FONDOS_COLLECTION_NAME
      );
      const allFondos = await fondosCollection.find({}).toArray();
      return { success: true, data: allFondos };
    },
    {
      detail: {
        summary: "Obtener todos los fondos",
        tags: ["Fondos"],
      },
    }
  )

  // GET /fondos/:id - Obtener un fondo por ID (ObjectId)
  .get(
    "/:id",
    async ({ params, set }) => {
      const db = getDb();
      const fondosCollection: Collection<Fondos> = db.collection<Fondos>(
        FONDOS_COLLECTION_NAME
      );

      try {
        const fondo = await fondosCollection.findOne({
          _id: new ObjectId(params.id),
        });

        if (!fondo) {
          set.status = 404;
          return { success: false, message: "Fondo no encontrado" };
        }
        return { success: true, data: fondo };
      } catch (error) {
        set.status = 400; // Bad Request si el ID no es válido (ObjectId)
        return { success: false, message: "ID de fondo inválido" };
      }
    },
    {
      params: t.Object({
        id: t.String({
          pattern: "^[0-9a-fA-F]{24}$", // Valida que sea un ObjectId válido
        }),
      }),
      detail: {
        summary: "Obtener un fondo por ID",
        tags: ["Fondos"],
      },
    }
  )

  // POST /fondos/ - Crear un nuevo fondo
  .post(
    "/",
    async ({ body, set }) => {
      const db = getDb();
      const fondosCollection: Collection<Fondos> = db.collection<Fondos>(
        FONDOS_COLLECTION_NAME
      );

      // El body no debe incluir _id
      const newFondoData: Omit<Fondos, "_id"> = body;

      // Opcional: Validación de unicidad por 'nombre' (ya que 'id' fue eliminado)
      const existingFondo = await fondosCollection.findOne({
        nombre: newFondoData.nombre,
      });
      if (existingFondo) {
        set.status = 409; // Conflict
        return {
          success: false,
          message: "Ya existe un fondo con este nombre.", // Mensaje ajustado
        };
      }

      const result = await fondosCollection.insertOne(newFondoData as Fondos); // Casteo necesario

      if (!result.acknowledged) {
        set.status = 500;
        return { success: false, message: "Fallo al crear el fondo" };
      }

      set.status = 201; // Created
      return {
        success: true,
        data: { _id: result.insertedId, ...newFondoData },
        message: "Fondo creado exitosamente",
      };
    },
    {
      body: t.Object({
        // Se ha eliminado 'id' de aquí
        nombre: t.String({
          minLength: 1,
          error: "El nombre del fondo es requerido.",
        }),
        inicio: t.String({
          minLength: 1,
          error: "La fecha de inicio es requerida.",
        }),
        cierre: t.String({
          minLength: 1,
          error: "La fecha de cierre es requerida.",
        }),
        financiamiento: t.String({
          minLength: 1,
          error: "El financiamiento es requerido.",
        }),
        plazo: t.String({ minLength: 1, error: "El plazo es requerido." }),
        objetivo: t.String({
          minLength: 1,
          error: "El objetivo es requerido.",
        }),
        trl: t.Number({ minimum: 0, error: "TRL debe ser un número." }),
        crl: t.Union([t.Number(), t.Null()]),
        team: t.Union([t.Number(), t.Null()]),
        brl: t.Union([t.Number(), t.Null()]),
        iprl: t.Union([t.Number(), t.Null()]),
        frl: t.Union([t.Number(), t.Null()]),
        tipo: t.Number({ minimum: 1, error: "El tipo es requerido." }),
        req: t.Union([t.String(), t.Null()]),
      }),
      detail: {
        summary: "Crear un nuevo fondo",
        tags: ["Fondos"],
      },
    }
  )

  // PUT /fondos/:id - Actualizar un fondo existente
  .put(
    "/:id",
    async ({ params, body, set }) => {
      const db = getDb();
      const fondosCollection: Collection<Fondos> = db.collection<Fondos>(
        FONDOS_COLLECTION_NAME
      );

      const updateData: Partial<Omit<Fondos, "_id">> = body;

      if (Object.keys(updateData).length === 0) {
        set.status = 400;
        return { success: false, message: "No hay datos para actualizar." };
      }

      try {
        const result = await fondosCollection.updateOne(
          { _id: new ObjectId(params.id) },
          { $set: updateData }
        );

        if (result.matchedCount === 0) {
          set.status = 404;
          return { success: false, message: "Fondo no encontrado" };
        }
        if (result.modifiedCount === 0) {
          set.status = 200;
          return {
            success: true,
            message: "Fondo no modificado (los datos eran los mismos).",
          };
        }

        return { success: true, message: "Fondo actualizado exitosamente" };
      } catch (error) {
        set.status = 400;
        return {
          success: false,
          message: "ID de fondo inválido o error en la actualización.",
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
          // Se ha eliminado 'id' de aquí
          nombre: t.String({ minLength: 1 }),
          inicio: t.String({ minLength: 1 }),
          cierre: t.String({ minLength: 1 }),
          financiamiento: t.String({ minLength: 1 }),
          plazo: t.String({ minLength: 1 }),
          objetivo: t.String({ minLength: 1 }),
          trl: t.Number({ minimum: 0 }),
          crl: t.Union([t.Number(), t.Null()]),
          team: t.Union([t.Number(), t.Null()]),
          brl: t.Union([t.Number(), t.Null()]),
          iprl: t.Union([t.Number(), t.Null()]),
          frl: t.Union([t.Number(), t.Null()]),
          tipo: t.Number({ minimum: 1 }),
          req: t.Union([t.String(), t.Null()]),
        })
      ),
      detail: {
        summary: "Actualizar un fondo existente",
        tags: ["Fondos"],
      },
    }
  )

  // DELETE /fondos/:id - Eliminar un fondo
  .delete(
    "/:id",
    async ({ params, set }) => {
      const db = getDb();
      const fondosCollection: Collection<Fondos> = db.collection<Fondos>(
        FONDOS_COLLECTION_NAME
      );

      try {
        const result = await fondosCollection.deleteOne({
          _id: new ObjectId(params.id),
        });

        if (result.deletedCount === 0) {
          set.status = 404;
          return { success: false, message: "Fondo no encontrado" };
        }
        return { success: true, message: "Fondo eliminado exitosamente" };
      } catch (error) {
        set.status = 400;
        return { success: false, message: "ID de fondo inválido" };
      }
    },
    {
      params: t.Object({
        id: t.String({
          pattern: "^[0-9a-fA-F]{24}$",
        }),
      }),
      detail: {
        summary: "Eliminar un fondo por ID",
        tags: ["Fondos"],
      },
    }
  );
