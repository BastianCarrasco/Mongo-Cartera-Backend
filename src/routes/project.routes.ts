import { Elysia, t } from "elysia";
import { Collection, ObjectId } from "mongodb";
import { getDb } from "../bd/mongo"; // Asegúrate de que esta ruta sea correcta
import type { Project, Academico, Estudiante } from "../types/project"; // Importa tipos actualizados

// Nombre de la colección de proyectos
const PROJECT_COLLECTION_NAME = "PROYECTOS";

// --- ESQUEMAS DE VALIDACIÓN REUTILIZABLES ---

// Esquema para un objeto Academico dentro del array
const academicoSubSchema = t.Object({
  nombre: t.Union([t.String(), t.Null(), t.Literal("")], {
    description: "Nombre del académico (string, null o vacío)",
  }),
  a_paterno: t.Union([t.String(), t.Null(), t.Literal("")], {
    description: "Apellido paterno del académico (string, null o vacío)",
  }),
  a_materno: t.Union([t.String(), t.Null(), t.Literal("")], {
    description: "Apellido materno del académico (string, null o vacío)",
  }),
});

// Esquema para un objeto Estudiante dentro del array
const estudianteSubSchema = t.Object({
  nombre: t.Union([t.String(), t.Null(), t.Literal("")], {
    description: "Nombre del estudiante (string, null o vacío)",
  }),
  a_paterno: t.Union([t.String(), t.Null(), t.Literal("")], {
    description: "Apellido paterno del estudiante (string, null o vacío)",
  }),
  a_materno: t.Union([t.String(), t.Null(), t.Literal("")], {
    description: "Apellido materno del estudiante (string, null o vacío)",
  }),
});

// Esquema principal para el cuerpo de la solicitud POST
const createProjectSchema = t.Object({
  id_kth: t.Union([t.String(), t.Null(), t.Literal("")], {
    description: "ID KTH (string, null o vacío)",
  }),
  comentarios: t.Union([t.String(), t.Null(), t.Literal("")], {
    description: "Comentarios (string, null o vacío)",
  }),
  nombre: t.String({
    minLength: 1, // <--- Obligatorio y no vacío
    description: "Nombre del proyecto (obligatorio, no nulo y no vacío)",
  }),
  academicos: t.Array(academicoSubSchema, {
    minItems: 1, // <--- Debe contener al menos un académico
    description: "Array de académicos (obligatorio, mínimo un elemento)",
  }),
  estudiantes: t.Array(estudianteSubSchema, {
    description: "Array de estudiantes (puede ser vacío)",
  }),
  monto: t.Union([t.Number(), t.Null()], {
    description: "Monto (número o null)",
  }),
  fecha_postulacion: t.Union([t.String(), t.Null(), t.Literal("")], {
    description: "Fecha de postulación (string, null o vacío)",
  }),
  unidad: t.Union([t.String(), t.Null(), t.Literal("")], {
    description: "Unidad (string, null o vacío)",
  }),
  tematica: t.Union([t.String(), t.Null(), t.Literal("")], {
    description: "Temática (string, null o vacío)",
  }),
  estatus: t.Union([t.String(), t.Null(), t.Literal("")], {
    description: "Estatus (string, null o vacío)",
  }),
  convocatoria: t.Union([t.String(), t.Null(), t.Literal("")], {
    description: "Convocatoria (string, null o vacío)",
  }),
  tipo_convocatoria: t.Union([t.String(), t.Null(), t.Literal("")], {
    description: "Tipo de convocatoria (string, null o vacío)",
  }),
  inst_conv: t.Union([t.String(), t.Null(), t.Literal("")], {
    description: "Institución de convocatoria (string, null o vacío)",
  }),
  detalle_apoyo: t.Union([t.String(), t.Null(), t.Literal("")], {
    description: "Detalle de apoyo (string, null o vacío)",
  }),
  apoyo: t.Union([t.String(), t.Null(), t.Literal("")], {
    description: "Tipo de apoyo (string, null o vacío)",
  }),
});

// Esquema para el cuerpo de la solicitud PUT (parcial)
// Usa t.Partial para hacer todos los campos opcionales, pero con las mismas reglas de tipo.
const updateProjectSchema = t.Partial(createProjectSchema);

// --- RUTAS DE ELYSIA ---
export const projectRoutes = new Elysia({ prefix: "/proyectos" })
  .get(
    "/",
    async () => {
      const db = getDb();
      const projectsCollection: Collection<Project> = db.collection(
        PROJECT_COLLECTION_NAME
      );
      const projects = await projectsCollection.find({}).toArray();
      return projects;
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

      // Validar si el ID es un ObjectId válido
      if (!ObjectId.isValid(params.id)) {
        set.status = 400;
        return { success: false, message: "ID de proyecto inválido" };
      }

      const project = await projectsCollection.findOne({
        _id: new ObjectId(params.id), // No es necesario 'as string', Elysia ya lo valida
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
          description: "ID de MongoDB válido para el proyecto",
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

      const newProjectData: Project = body as Project; // Elysia ya validó el 'body' con 'createProjectSchema'

      // Validación adicional: Al menos un campo de nombre/apellido debe tener valor para cualquier académico
      const hasValidAcademicoEntry = newProjectData.academicos.some(
        (academico) =>
          (academico.nombre !== null && academico.nombre.trim() !== "") ||
          (academico.a_paterno !== null && academico.a_paterno.trim() !== "") ||
          (academico.a_materno !== null && academico.a_materno.trim() !== "")
      );

      if (!hasValidAcademicoEntry) {
        set.status = 400;
        return {
          success: false,
          message:
            "Al menos un académico debe tener un nombre, apellido paterno o apellido materno no vacío/nulo.",
        };
      }

      const result = await projectsCollection.insertOne(newProjectData);

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
      body: createProjectSchema, // Usamos el esquema para la creación
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

      // Validar si el ID es un ObjectId válido
      if (!ObjectId.isValid(params.id)) {
        set.status = 400;
        return { success: false, message: "ID de proyecto inválido" };
      }

      const updateData: Partial<Project> = body as Partial<Project>;

      // Asegurarse de que el cuerpo no esté vacío
      if (Object.keys(updateData).length === 0) {
        set.status = 400;
        return {
          success: false,
          message: "El cuerpo de la solicitud no puede estar vacío para PUT",
        };
      }

      // Validación específica para 'nombre' si está presente en la actualización
      if (
        updateData.nombre !== undefined &&
        (updateData.nombre === null || updateData.nombre.trim() === "")
      ) {
        set.status = 400;
        return {
          success: false,
          message: "El nombre del proyecto no puede ser nulo o vacío.",
        };
      }

      // Validación para 'academicos' si está presente en la actualización
      if (updateData.academicos !== undefined) {
        if (updateData.academicos.length === 0) {
          set.status = 400;
          return {
            success: false,
            message: "El array de académicos no puede estar vacío.",
          };
        }

        const hasValidAcademicoEntry = updateData.academicos.some(
          (academico) =>
            (academico.nombre !== null && academico.nombre.trim() !== "") ||
            (academico.a_paterno !== null &&
              academico.a_paterno.trim() !== "") ||
            (academico.a_materno !== null && academico.a_materno.trim() !== "")
        );

        if (!hasValidAcademicoEntry) {
          set.status = 400;
          return {
            success: false,
            message:
              "Al menos un académico en la actualización debe tener un nombre, apellido paterno o apellido materno no vacío/nulo.",
          };
        }
      }

      const result = await projectsCollection.updateOne(
        { _id: new ObjectId(params.id) },
        { $set: updateData }
      );

      if (result.matchedCount === 0) {
        set.status = 404;
        return { success: false, message: "Proyecto no encontrado" };
      }
      if (result.modifiedCount === 0) {
        set.status = 200;
        return {
          success: true,
          message: "Proyecto no modificado (datos idénticos)",
        };
      }

      return { success: true, message: "Proyecto actualizado exitosamente" };
    },
    {
      params: t.Object({
        id: t.String({
          pattern: "^[0-9a-fA-F]{24}$",
          description: "ID de MongoDB válido para el proyecto a actualizar",
        }),
      }),
      body: updateProjectSchema, // Usamos el esquema parcial para la actualización
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

      // Validar si el ID es un ObjectId válido
      if (!ObjectId.isValid(params.id)) {
        set.status = 400;
        return { success: false, message: "ID de proyecto inválido" };
      }

      const result = await projectsCollection.deleteOne({
        _id: new ObjectId(params.id),
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
          description: "ID de MongoDB válido para el proyecto a eliminar",
        }),
      }),
      detail: {
        summary: "Eliminar un proyecto por ID",
        tags: ["Proyectos"],
      },
    }
  );
