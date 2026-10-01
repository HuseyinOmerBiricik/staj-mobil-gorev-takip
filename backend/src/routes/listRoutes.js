import express from "express";

import prisma from "../lib/prisma.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authenticateToken);

// Panoya ait kolonları listele
router.get("/boards/:boardId/lists", async (req, res) => {
  try {
    const boardId = Number(req.params.boardId);

    if (!Number.isInteger(boardId)) {
      return res.status(400).json({
        message: "Geçersiz pano kimliği.",
      });
    }

    const board = await prisma.board.findFirst({
      where: {
        id: boardId,
        ownerId: req.user.userId,
      },
    });

    if (!board) {
      return res.status(404).json({
        message: "Pano bulunamadı.",
      });
    }

    const lists = await prisma.list.findMany({
      where: {
        boardId,
      },
      orderBy: {
        order: "asc",
      },
    });

    return res.json(lists);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Kolonlar alınırken bir hata oluştu.",
    });
  }
});

// Yeni kolon oluştur
router.post("/boards/:boardId/lists", async (req, res) => {
  try {
    const boardId = Number(req.params.boardId);
    const { title } = req.body;

    if (!Number.isInteger(boardId)) {
      return res.status(400).json({
        message: "Geçersiz pano kimliği.",
      });
    }

    const board = await prisma.board.findFirst({
      where: {
        id: boardId,
        ownerId: req.user.userId,
      },
    });

    if (!board) {
      return res.status(404).json({
        message: "Pano bulunamadı.",
      });
    }

    const cleanTitle = title?.trim();

    if (!cleanTitle) {
      return res.status(400).json({
        message: "Kolon başlığı zorunludur.",
      });
    }

    if (cleanTitle.length > 50) {
      return res.status(400).json({
        message: "Kolon başlığı en fazla 50 karakter olabilir.",
      });
    }

    const lastList = await prisma.list.findFirst({
      where: {
        boardId,
      },
      orderBy: {
        order: "desc",
      },
    });

    const nextOrder = lastList ? lastList.order + 1 : 0;

    const list = await prisma.list.create({
      data: {
        boardId,
        title: cleanTitle,
        order: nextOrder,
      },
    });

    return res.status(201).json(list);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Kolon oluşturulurken bir hata oluştu.",
    });
  }
});

// Kolon güncelle
router.put("/lists/:id", async (req, res) => {
  try {
    const listId = Number(req.params.id);
    const { title, order } = req.body;

    if (!Number.isInteger(listId)) {
      return res.status(400).json({
        message: "Geçersiz kolon kimliği.",
      });
    }

    const existingList = await prisma.list.findUnique({
      where: {
        id: listId,
      },
      include: {
        board: true,
      },
    });

    if (
      !existingList ||
      existingList.board.ownerId !== req.user.userId
    ) {
      return res.status(404).json({
        message: "Kolon bulunamadı.",
      });
    }

    const data = {};

    if (title !== undefined) {
      const cleanTitle = title.trim();

      if (!cleanTitle) {
        return res.status(400).json({
          message: "Kolon başlığı zorunludur.",
        });
      }

      if (cleanTitle.length > 50) {
        return res.status(400).json({
          message: "Kolon başlığı en fazla 50 karakter olabilir.",
        });
      }

      data.title = cleanTitle;
    }

    if (order !== undefined) {
      if (!Number.isInteger(order) || order < 0) {
        return res.status(400).json({
          message: "Kolon sırası geçersiz.",
        });
      }

      data.order = order;
    }

    const updatedList = await prisma.list.update({
      where: {
        id: listId,
      },
      data,
    });

    return res.json(updatedList);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Kolon güncellenirken bir hata oluştu.",
    });
  }
});

// Kolon sil
router.delete("/lists/:id", async (req, res) => {
  try {
    const listId = Number(req.params.id);

    if (!Number.isInteger(listId)) {
      return res.status(400).json({
        message: "Geçersiz kolon kimliği.",
      });
    }

    const existingList = await prisma.list.findUnique({
      where: {
        id: listId,
      },
      include: {
        board: true,
      },
    });

    if (
      !existingList ||
      existingList.board.ownerId !== req.user.userId
    ) {
      return res.status(404).json({
        message: "Kolon bulunamadı.",
      });
    }

    await prisma.list.delete({
      where: {
        id: listId,
      },
    });

    return res.json({
      message: "Kolon başarıyla silindi.",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Kolon silinirken bir hata oluştu.",
    });
  }
});

export default router;