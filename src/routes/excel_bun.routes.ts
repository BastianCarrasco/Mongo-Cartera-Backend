import { Elysia } from "elysia";
import type { Document } from "mongodb";
import { getDb } from "../bd/mongo";

export const excelBunRoutes = new Elysia({ prefix: "/excel-bun" })
  // GET: Obtiene todos los documentos
  .get(
    "/",
    async () => {
      try {
        const db = await getDb();
        const projectsCollection = db.collection("EXCEL-BUN");
        const academicosCollection = db.collection("ACADEMICOS"); // Colección de académicos

        const projects = (await projectsCollection
          .find({})
          .toArray()) as Document[];

        // Usaremos un Map para almacenar las búsquedas de académicos únicas
        // Key: "primer_nombre_del_proyecto|apellido_paterno_del_proyecto"
        // Value: Objeto de consulta para MongoDB { nombre: { $regex: ... }, a_paterno: "..." }
        const academicSearchKeys = new Map<
          string,
          { firstName: string; lastName: string }
        >();

        // Helper para extraer nombre y apellido paterno del campo de proyecto
        const extractNameParts = (fullName: string) => {
          const parts = fullName
            .split(" ")
            .map((p) => p.trim())
            .filter((p) => p);
          const firstName = parts.length > 0 ? parts[0] : "";
          const lastName = parts.length > 1 ? parts[parts.length - 1] : ""; // Asumimos último como apellido paterno
          return { firstName, lastName };
        };

        projects.forEach((project) => {
          // Procesar Académic@/s-Líder
          if (project["Académic@/s-Líder"]) {
            const leaders = String(project["Académic@/s-Líder"])
              .split(",")
              .map((namePart) => namePart.trim())
              .filter((namePart) => namePart); // Filtrar partes vacías

            leaders.forEach((leaderFullName) => {
              const { firstName, lastName } = extractNameParts(leaderFullName);
              if (firstName && lastName) {
                academicSearchKeys.set(`${firstName}|${lastName}`, {
                  firstName,
                  lastName,
                });
              }
            });
          }

          // Procesar Académic@/s-Partner
          if (project["Académic@/s-Partner"]) {
            const partners = String(project["Académic@/s-Partner"])
              .split(",")
              .map((namePart) => namePart.trim())
              .filter((namePart) => namePart);

            partners.forEach((partnerFullName) => {
              const { firstName, lastName } = extractNameParts(partnerFullName);
              if (firstName && lastName) {
                academicSearchKeys.set(`${firstName}|${lastName}`, {
                  firstName,
                  lastName,
                });
              }
            });
          }
        });

        // Crear las condiciones $or para la consulta a la colección de académicos
        const orConditions: Document[] = [];
        academicSearchKeys.forEach(({ firstName, lastName }) => {
          // Búsqueda flexible para 'nombre' (que contenga el primer nombre)
          // Búsqueda exacta para 'a_paterno'
          orConditions.push({
            nombre: { $regex: firstName, $options: "i" }, // 'i' para búsqueda case-insensitive
            a_paterno: lastName,
          });
        });

        let academicos: Document[] = [];
        if (orConditions.length > 0) {
          // Solo si hay condiciones para buscar
          academicos = await academicosCollection
            .find({
              $or: orConditions,
            })
            .project({ nombre: 1, a_paterno: 1, link_foto: 1, _id: 0 })
            .toArray();
        }

        // Mapear académicos a un objeto para fácil acceso por "primer_nombre_del_proyecto|apellido_paterno_del_proyecto"
        // La clave del Map ahora usa el primer nombre y apellido tal como se extrajeron del proyecto
        const academicosMap = new Map<string, string>(); // Map<"firstName|lastName_from_project", link_foto>
        academicos.forEach((academico) => {
          // Normalizar el nombre completo del académico para obtener el primer nombre
          const acadFirstName = String(academico.nombre).split(" ")[0];
          const acadLastName = String(academico.a_paterno);

          if (acadFirstName && acadLastName && academico.link_foto) {
            // Recrear la clave exacta que usamos para buscar en academicSearchKeys
            // para que coincida con lo que esperamos buscar en el map
            academicosMap.set(
              `${acadFirstName}|${acadLastName}`,
              String(academico.link_foto)
            );
          }
        });

        // Enriquecer cada proyecto con los link_foto
        const enrichedProjects = projects.map((project) => {
          const newProject = { ...project }; // Clonar el proyecto

          // Función auxiliar para procesar líderes/partners con la nueva lógica
          const processAcademicFieldAndGetPhoto = (field: string) => {
            const names = String(newProject[field] || "")
              .split(",")
              .map((namePart) => namePart.trim())
              .filter((namePart) => namePart);

            const photos: string[] = [];
            names.forEach((fullName) => {
              const { firstName, lastName } = extractNameParts(fullName); // Usar la misma lógica de extracción

              if (firstName && lastName) {
                const queryKey = `${firstName}|${lastName}`; // Recrear la clave para el map
                const photoLink = academicosMap.get(queryKey);
                if (photoLink) {
                  photos.push(photoLink);
                }
              }
            });
            return photos.length > 0 ? photos.join(", ") : null; // Unir las URLs de fotos o null
          };

          newProject["link_foto_lider"] =
            processAcademicFieldAndGetPhoto("Académic@/s-Líder");
          newProject["link_foto_partner"] = processAcademicFieldAndGetPhoto(
            "Académic@/s-Partner"
          );

          return newProject;
        });

        return {
          ok: true,
          count: enrichedProjects.length,
          data: enrichedProjects,
          message:
            "✅ Documentos de proyectos recuperados y enriquecidos correctamente con link_foto de académicos (búsqueda flexible por nombre).",
        };
      } catch (error) {
        console.error(
          "❌ Error al obtener y enriquecer documentos de EXCEL-BUN:",
          error
        );
        return {
          ok: false,
          error:
            "No se pudieron obtener o enriquecer los documentos de proyectos.",
        };
      }
    },
    {
      detail: {
        summary:
          "Obtiene todos los documentos de EXCEL-BUN, incluyendo link_foto de académicos (búsqueda flexible por nombre y apellido paterno)",
        tags: ["Proyectos"],
      },
    }
  )

  // POST: Inserta uno o varios documentos
  .post(
    "/",
    async ({ body }) => {
      try {
        const db = await getDb();
        const collection = db.collection("EXCEL-BUN");

        // 🔹 Si el body es un array, usar insertMany
        if (Array.isArray(body)) {
          // Asegurarse de convertir Proxy -> JSON plano (por seguridad)
          const parsed = JSON.parse(JSON.stringify(body));
          const result = await collection.insertMany(parsed as Document[]);
          return {
            ok: true,
            message: `✅ Se insertaron ${result.insertedCount} documentos correctamente.`,
          };
        }

        // 🔹 Si es un solo objeto, usar insertOne
        const parsed = JSON.parse(JSON.stringify(body));
        const result = await collection.insertOne(parsed as Document);
        return {
          ok: true,
          message: "✅ Documento insertado correctamente",
          insertedId: result.insertedId,
        };
      } catch (error) {
        console.error("❌ Error al insertar en EXCEL-BUN:", error);
        return { ok: false, error: "No se pudo insertar el documento" };
      }
    },
    {
      detail: {
        summary: "Inserta cualquier JSON o array en la colección EXCEL-BUN",
        tags: ["Proyectos"],
      },
    }
  )

  // DELETE: Borrar todo
  .delete(
    "/",
    async () => {
      try {
        const db = await getDb();
        const collection = db.collection("EXCEL-BUN");
        const result = await collection.deleteMany({});
        return {
          ok: true,
          message: `🗑 Se eliminaron ${result.deletedCount} documentos.`,
        };
      } catch (error) {
        console.error("❌ Error al eliminar EXCEL-BUN:", error);
        return { ok: false, error: "No se pudo eliminar los documentos." };
      }
    },
    {
      detail: {
        summary: "Elimina todos los registros de EXCEL-BUN",
        tags: ["Proyectos"],
      },
    }
  );
