import "dotenv/config";
import express from "express";

import authRoutes from "./src/routes/authRoutes.js";
import boardRoutes from "./src/routes/boardRoutes.js";
import listRoutes from "./src/routes/listRoutes.js";
import taskRoutes from "./src/routes/taskRoutes.js";

const app = express();
const PORT = 3000;

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Staj Mobil Proje API çalışıyor.",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/boards", boardRoutes);
app.use("/api", listRoutes);
app.use("/api", taskRoutes);

app.listen(PORT, () => {
  console.log(`Server http://localhost:${PORT} adresinde çalışıyor.`);
});