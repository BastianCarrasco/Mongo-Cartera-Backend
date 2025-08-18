import { Elysia, t } from "elysia";
import { Collection, ObjectId } from "mongodb";
import { getDb } from "../bd/mongo";
import type { Project, Academico, Estudiante } from "../types/project"; // Importa tipos desde 'types'

// Nombre de la colección de proyectos
const PROJECT_COLLECTION_NAME = "PROYECTOS";

// --- CONTROLADORES (Funciones que manejan la lógica de negocio) ---

// Tipo para el cuerpo de la solicitud POST
type CreateProjectBody = Omit<Project, "_id"> & {
  estudiantes?: Estudiante[];
};

// Tipo para el cuerpo de la solicitud PUT (parcial)
type UpdateProjectBody = Partial<Omit<Project, "_id">>;

export const projectRoutes = new Elysia({ prefix: "/proyectos" }) // Agrupa las rutas con un prefijo
  .get(
    "/",
    async () => {
      const db = getDb();
      const projectsCollection: Collection<Project> = db.collection(
        PROJECT_COLLECTION_NAME
      );
      const projects = await projectsCollection.find({}).toArray();
      return { success: true, data: projects };
    },
    {
      detail: {
        summary: "Obtener todos los proyectos",
        tags: ["Proyectos"],
      },
    }
  )
  .get(
    "/:id",
    async ({ params, set }) => {
      const db = getDb();
      const projectsCollection: Collection<Project> = db.collection(
        PROJECT_COLLECTION_NAME
      );
      const project = await projectsCollection.findOne({
        _id: new ObjectId(params.id as string),
      });

      if (!project) {
        set.status = 404;
        return { success: false, message: "Proyecto no encontrado" };
      }
      return { success: true, data: project };
    },
    {
      params: t.Object({
        id: t.String({
          pattern: "^[0-9a-fA-F]{24}$",
        }),
      }),
      detail: {
        summary: "Obtener un proyecto por ID",
        tags: ["Proyectos"],
      },
    }
  )
  .post(
    "/",
    async ({ body, set }) => {
      const db = getDb();
      const projectsCollection: Collection<Project> = db.collection(
        PROJECT_COLLECTION_NAME
      );

      const newProjectData: CreateProjectBody = body as CreateProjectBody;

      // Asegurar que estudiantes sea un array, incluso si viene undefined o null
      if (!newProjectData.estudiantes) {
        newProjectData.estudiantes = [];
      }

      const result = await projectsCollection.insertOne(newProjectData as any);

      if (!result.acknowledged) {
        set.status = 500;
        return { success: false, message: "Fallo al crear proyecto" };
      }

      set.status = 201; // Created
      return {
        success: true,
        data: { _id: result.insertedId, ...newProjectData },
        message: "Proyecto creado exitosamente",
      };
    },
    {
      body: t.Object({
        id_kth: t.Optional(t.Union([t.String(), t.Null()])),
        comentarios: t.Optional(t.String()),
        nombre: t.String(),
        academicos: t.Array(
          t.Object({
            nombre: t.String(),
            a_paterno: t.String(),
            a_materno: t.String(),
          })
        ),
        estudiantes: t.Optional(t.Array(t.Any())), // Si la estructura es variable o no la necesitas validar fuertemente
        monto: t.Number(),
        fecha_postulacion: t.String(),
        unidad: t.String(),
        tematica: t.String(),
        estatus: t.String(),
        convocatoria: t.String(),
        tipo_convocatoria: t.String(),
        inst_conv: t.String(),
        detalle_apoyo: t.String(),
        apoyo: t.String(),
      }),
      detail: {
        summary: "Crear un nuevo proyecto",
        tags: ["Proyectos"],
      },
    }
  )
  .put(
    "/:id",
    async ({ params, body, set }) => {
      const db = getDb();
      const projectsCollection: Collection<Project> = db.collection(
        PROJECT_COLLECTION_NAME
      );

      const updateData: UpdateProjectBody = body as UpdateProjectBody;

      const result = await projectsCollection.updateOne(
        { _id: new ObjectId(params.id as string) },
        { $set: updateData }
      );

      if (result.matchedCount === 0) {
        set.status = 404;
        return { success: false, message: "Proyecto no encontrado" };
      }
      if (result.modifiedCount === 0) {
        set.status = 200;
        return { success: true, message: "Proyecto no modificado" };
      }

      return { success: true, message: "Proyecto actualizado exitosamente" };
    },
    {
      params: t.Object({
        id: t.String({
          pattern: "^[0-9a-fA-F]{24}$",
        }),
      }),
      body: t.Partial(
        t.Object({
          id_kth: t.Union([t.String(), t.Null()]),
          comentarios: t.String(),
          nombre: t.String(),
          academicos: t.Array(
            t.Object({
              nombre: t.String(),
              a_paterno: t.String(),
              a_materno: t.String(),
            })
          ),
          estudiantes: t.Array(t.Any()),
          monto: t.Number(),
          fecha_postulacion: t.String(),
          unidad: t.String(),
          tematica: t.String(),
          estatus: t.String(),
          convocatoria: t.String(),
          tipo_convocatoria: t.String(),
          inst_conv: t.String(),
          detalle_apoyo: t.String(),
          apoyo: t.String(),
        })
      ),
      detail: {
        summary: "Actualizar un proyecto existente",
        tags: ["Proyectos"],
      },
    }
  )
  .delete(
    "/:id",
    async ({ params, set }) => {
      const db = getDb();
      const projectsCollection: Collection<Project> = db.collection(
        PROJECT_COLLECTION_NAME
      );
      const result = await projectsCollection.deleteOne({
        _id: new ObjectId(params.id as string),
      });

      if (result.deletedCount === 0) {
        set.status = 404;
        return { success: false, message: "Proyecto no encontrado" };
      }
      return { success: true, message: "Proyecto eliminado exitosamente" };
    },
    {
      params: t.Object({
        id: t.String({
          pattern: "^[0-9a-fA-F]{24}$",
        }),
      }),
      detail: {
        summary: "Eliminar un proyecto por ID",
        tags: ["Proyectos"],
      },
    }
  );
