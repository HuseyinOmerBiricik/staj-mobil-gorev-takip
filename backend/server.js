import "dotenv/config";
import express from "express";

import authRoutes from "./src/routes/authRoutes.js";
import boardRoutes from "./src/routes/boardRoutes.js";

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

app.listen(PORT, () => {
  console.log(`Server http://localhost:${PORT} adresinde çalışıyor.`);
});