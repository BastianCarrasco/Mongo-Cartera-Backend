import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { cors } from "@elysiajs/cors"; // <--- Importa el plugin CORS
import { connectToMongo } from "./bd/mongo";
import { projectRoutes } from "../src/routes/project.routes";
import { academicoRoutes } from "../src/routes/academicos.routes";
import { institucionRoutes } from "../src/routes/instituciones.routes";
import { unidadAcademicaRoutes } from "../src/routes/ua.routes";
import { EstadisticasRoutes } from "./routes/funciones/Estadisticas.routes";
import { tipoConvRoutes } from "./routes/tipo_conv.routes";
import { estatusRoutes } from "./routes/estatus.routes";
import { tematicasRoutes } from "./routes/tematicas.routes";
import { fondosRoutes } from "./routes/fondos.routes";
import { tipoApoyoRoutes } from "./routes/tipo_apoyo.routes";
import { perfilProyectoRoutes } from "./routes/preguntas_perfil.routes";
import { respuestasPerfilRoutes } from "./routes/respuestas_perfil.routes";
import { estudiantesRoutes } from "./routes/estudiantes.routes"; // Asegúrate de importar las rutas de estudiantes

const app = new Elysia();

// Conectar a MongoDB al iniciar la aplicación
app.onStart(async () => {
  await connectToMongo();
  console.log("Server starting and MongoDB connected.");
});

// AÑADE ESTO: Plugin de CORS
app.use(
  cors({
    origin: true, // <--- CAMBIO AQUÍ: Esto permite cualquier origen ('*')
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

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
app.use(academicoRoutes);
app.use(estatusRoutes);
app.use(fondosRoutes);
app.use(institucionRoutes);
app.use(perfilProyectoRoutes);
app.use(projectRoutes);
app.use(tematicasRoutes);
app.use(tipoApoyoRoutes);
app.use(tipoConvRoutes);
app.use(unidadAcademicaRoutes);
app.use(respuestasPerfilRoutes);
app.use(estudiantesRoutes); // Asegúrate de montar las rutas de estudiantes
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
