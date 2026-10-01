import express from "express";

import prisma from "../lib/prisma.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authenticateToken);

// Kullanıcının panolarını listele
router.get("/", async (req, res) => {
  try {
    const boards = await prisma.board.findMany({
      where: {
        ownerId: req.user.userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json(boards);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Panolar alınırken bir hata oluştu.",
    });
  }
});

// Yeni pano oluştur
router.post("/", async (req, res) => {
  try {
    const { title, description } = req.body;

    const cleanTitle = title?.trim();
    const cleanDescription = description?.trim();

    if (!cleanTitle) {
      return res.status(400).json({
        message: "Pano başlığı zorunludur.",
      });
    }

    if (cleanTitle.length < 2 || cleanTitle.length > 100) {
      return res.status(400).json({
        message: "Pano başlığı 2-100 karakter arasında olmalıdır.",
      });
    }

    if (cleanDescription && cleanDescription.length > 500) {
      return res.status(400).json({
        message: "Pano açıklaması en fazla 500 karakter olabilir.",
      });
    }

    const board = await prisma.board.create({
      data: {
        title: cleanTitle,
        description: cleanDescription || null,
        ownerId: req.user.userId,
      },
    });

    return res.status(201).json(board);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Pano oluşturulurken bir hata oluştu.",
    });
  }
});

// Pano düzenle
router.put("/:id", async (req, res) => {
  try {
    const boardId = Number(req.params.id);
    const { title, description } = req.body;

    if (!Number.isInteger(boardId)) {
      return res.status(400).json({
        message: "Geçersiz pano kimliği.",
      });
    }

    const existingBoard = await prisma.board.findFirst({
      where: {
        id: boardId,
        ownerId: req.user.userId,
      },
    });

    if (!existingBoard) {
      return res.status(404).json({
        message: "Pano bulunamadı.",
      });
    }

    const cleanTitle = title?.trim();
    const cleanDescription = description?.trim();

    if (!cleanTitle) {
      return res.status(400).json({
        message: "Pano başlığı zorunludur.",
      });
    }

    if (cleanTitle.length < 2 || cleanTitle.length > 100) {
      return res.status(400).json({
        message: "Pano başlığı 2-100 karakter arasında olmalıdır.",
      });
    }

    if (cleanDescription && cleanDescription.length > 500) {
      return res.status(400).json({
        message: "Pano açıklaması en fazla 500 karakter olabilir.",
      });
    }

    const board = await prisma.board.update({
      where: {
        id: boardId,
      },
      data: {
        title: cleanTitle,
        description: cleanDescription || null,
      },
    });

    return res.json(board);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Pano güncellenirken bir hata oluştu.",
    });
  }
});

// Pano sil
router.delete("/:id", async (req, res) => {
  try {
    const boardId = Number(req.params.id);

    if (!Number.isInteger(boardId)) {
      return res.status(400).json({
        message: "Geçersiz pano kimliği.",
      });
    }

    const existingBoard = await prisma.board.findFirst({
      where: {
        id: boardId,
        ownerId: req.user.userId,
      },
    });

    if (!existingBoard) {
      return res.status(404).json({
        message: "Pano bulunamadı.",
      });
    }

    await prisma.board.delete({
      where: {
        id: boardId,
      },
    });

    return res.json({
      message: "Pano başarıyla silindi.",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Pano silinirken bir hata oluştu.",
    });
  }
});

export default router;