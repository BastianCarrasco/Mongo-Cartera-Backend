import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { connectToMongo } from "./bd/mongo";
import { projectRoutes } from "../src/routes/project.routes"; // Importa las rutas de proyectos
import { academicoRoutes } from "../src/routes/academicos.routes";
import { institucionRoutes } from "../src/routes/instituciones.routes"; // Importa las rutas de instituciones
import { unidadAcademicaRoutes } from "../src/routes/ua.routes"; // Importa las rutas de unidades académicas
import { EstadisticasRoutes } from "./routes/funciones/Estadisticas.routes";

const app = new Elysia();

// Conectar a MongoDB al iniciar la aplicación
app.onStart(async () => {
  await connectToMongo();
  console.log("Server starting and MongoDB connected.");
});

// Plugin de Swagger para la documentación
app.use(
  swagger({
    path: "/swagger", // La ruta donde estará la UI de Swagger
    documentation: {
      info: {
        title: "API de Gestión de Proyectos de Cartera",
        version: "1.0.0",
        description: "Backend para la gestión de proyectos de cartera.",
      },
      tags: [
        { name: "General", description: "Rutas generales de la API" },
        { name: "Proyectos", description: "Operaciones CRUD para proyectos" },
      ],
    },
  })
);

// Ruta principal
app.get("/", () => "¡Hola desde tu API de Cartera!", {
  detail: {
    summary: "Ruta de bienvenida",
    tags: ["General"],
  },
});

// Montar las rutas de proyectos
app.use(projectRoutes);
app.use(academicoRoutes);
app.use(institucionRoutes);
app.use(unidadAcademicaRoutes);
app.use(EstadisticasRoutes);

// Iniciar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(
    `🚀 Servidor Elysia corriendo en http://${app.server?.hostname}:${app.server?.port}`
  );
  console.log(
    `📚 Documentación Swagger en http://${app.server?.hostname}:${app.server?.port}/swagger`
  );
});
