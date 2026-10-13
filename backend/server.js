import "dotenv/config";

import express from "express";

import authRoutes from "./src/routes/authRoutes.js";
import boardRoutes from "./src/routes/boardRoutes.js";
import listRoutes from "./src/routes/listRoutes.js";
import taskRoutes from "./src/routes/taskRoutes.js";
import userRoutes from "./src/routes/userRoutes.js";
import commentRoutes from "./src/routes/commentRoutes.js";
import boardMemberRoutes from "./src/routes/boardMemberRoutes.js";
import reminderRoutes from "./src/routes/reminderRoutes.js";

const app =
  express();

const PORT =
  process.env.PORT ||
  3000;

app.use(
  express.json()
);

app.get(
  "/",
  (req, res) => {
    res.json({
      message:
        "Staj Mobil Proje API çalışıyor.",
    });
  }
);

app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/boards",
  boardRoutes
);

app.use(
  "/api",
  listRoutes
);

app.use(
  "/api",
  taskRoutes
);

app.use(
  "/api",
  userRoutes
);

app.use(
  "/api",
  commentRoutes
);

app.use(
  "/api",
  boardMemberRoutes
);

app.use(
  "/api",
  reminderRoutes
);

app.listen(
  PORT,
  "0.0.0.0",
  () => {
    console.log(
      `Server http://localhost:${PORT} adresinde çalışıyor.`
    );
  }
);