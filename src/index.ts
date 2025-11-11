import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { cors } from "@elysiajs/cors";
import { connectToMongo } from "./bd/mongo";

import { perfilProyectoRoutes } from "./routes/preguntas_perfil.routes";
import { respuestasPerfilRoutes } from "./routes/respuestas_perfil.routes";
import { excelBunRoutes } from "./routes/excel_bun.routes";
import { analisisBunRoutes } from "./routes/analisisBun.Routes";
import { estadisticasBunRoutes } from "./routes/estadisticasBun.Routes";

const app = new Elysia();

// Conectar a MongoDB al iniciar la aplicación
app.onStart(async () => {
  await connectToMongo();
  console.log("Server starting and MongoDB connected.");
});

// CORS
app.use(
  cors({
    origin: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Swagger
app.use(
  swagger({
    path: "/swagger",
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

// 🔗 Montar las rutas
app.use(perfilProyectoRoutes);
app.use(respuestasPerfilRoutes);
app.use(excelBunRoutes); // <- NUEVO
app.use(analisisBunRoutes); // <- NUEVO
app.use(estadisticasBunRoutes); // <- NUEVO
// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(
    `🚀 Servidor Elysia corriendo en http://${app.server?.hostname}:${app.server?.port}`
  );
  console.log(
    `📚 Documentación Swagger en http://${app.server?.hostname}:${app.server?.port}/swagger`
  );
});
