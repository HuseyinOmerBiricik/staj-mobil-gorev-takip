import express from "express";

import prisma from "../lib/prisma.js";
import {
  authenticateToken,
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authenticateToken);

// Kullanıcının sahibi olduğu veya üye olduğu panolar
router.get("/", async (req, res) => {
  try {
    const userId =
      Number(req.user.userId);

    const boards =
      await prisma.board.findMany({
        where: {
          OR: [
            {
              ownerId: userId,
            },
            {
              members: {
                some: {
                  userId,
                },
              },
            },
          ],
        },

        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },

          members: {
            where: {
              userId,
            },

            select: {
              role: true,
            },
          },
        },

        orderBy: {
          createdAt: "desc",
        },
      });

    const result = boards.map(
      (board) => ({
        id: board.id,
        title: board.title,
        description:
          board.description,
        ownerId: board.ownerId,
        createdAt: board.createdAt,
        updatedAt: board.updatedAt,
        owner: board.owner,

        accessRole:
          board.ownerId === userId
            ? "owner"
            : board.members[0]
                ?.role ||
              "member",
      })
    );

    return res.json(result);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message:
        "Panolar alınırken bir hata oluştu.",
    });
  }
});

// Yeni pano oluştur
router.post("/", async (req, res) => {
  try {
    const {
      title,
      description,
    } = req.body;

    const cleanTitle =
      title?.trim();

    const cleanDescription =
      description?.trim();

    if (!cleanTitle) {
      return res.status(400).json({
        message:
          "Pano başlığı zorunludur.",
      });
    }

    if (
      cleanTitle.length < 2 ||
      cleanTitle.length > 100
    ) {
      return res.status(400).json({
        message:
          "Pano başlığı 2-100 karakter arasında olmalıdır.",
      });
    }

    if (
      cleanDescription &&
      cleanDescription.length > 500
    ) {
      return res.status(400).json({
        message:
          "Pano açıklaması en fazla 500 karakter olabilir.",
      });
    }

    const board =
      await prisma.board.create({
        data: {
          title: cleanTitle,
          description:
            cleanDescription || null,
          ownerId:
            req.user.userId,
        },

        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

    return res.status(201).json({
      ...board,
      accessRole: "owner",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message:
        "Pano oluşturulurken bir hata oluştu.",
    });
  }
});

// Pano düzenleme yalnızca owner
router.put(
  "/:id",
  async (req, res) => {
    try {
      const boardId = Number(
        req.params.id
      );

      const {
        title,
        description,
      } = req.body;

      if (
        !Number.isInteger(boardId)
      ) {
        return res
          .status(400)
          .json({
            message:
              "Geçersiz pano kimliği.",
          });
      }

      const existingBoard =
        await prisma.board.findFirst({
          where: {
            id: boardId,
            ownerId:
              req.user.userId,
          },
        });

      if (!existingBoard) {
        return res
          .status(404)
          .json({
            message:
              "Pano bulunamadı veya düzenleme yetkiniz yok.",
          });
      }

      const cleanTitle =
        title?.trim();

      const cleanDescription =
        description?.trim();

      if (!cleanTitle) {
        return res
          .status(400)
          .json({
            message:
              "Pano başlığı zorunludur.",
          });
      }

      if (
        cleanTitle.length < 2 ||
        cleanTitle.length > 100
      ) {
        return res
          .status(400)
          .json({
            message:
              "Pano başlığı 2-100 karakter arasında olmalıdır.",
          });
      }

      if (
        cleanDescription &&
        cleanDescription.length >
          500
      ) {
        return res
          .status(400)
          .json({
            message:
              "Pano açıklaması en fazla 500 karakter olabilir.",
          });
      }

      const board =
        await prisma.board.update({
          where: {
            id: boardId,
          },

          data: {
            title: cleanTitle,
            description:
              cleanDescription ||
              null,
          },

          include: {
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });

      return res.json({
        ...board,
        accessRole: "owner",
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        message:
          "Pano güncellenirken bir hata oluştu.",
      });
    }
  }
);

// Pano silme yalnızca owner
router.delete(
  "/:id",
  async (req, res) => {
    try {
      const boardId = Number(
        req.params.id
      );

      if (
        !Number.isInteger(boardId)
      ) {
        return res
          .status(400)
          .json({
            message:
              "Geçersiz pano kimliği.",
          });
      }

      const existingBoard =
        await prisma.board.findFirst({
          where: {
            id: boardId,
            ownerId:
              req.user.userId,
          },
        });

      if (!existingBoard) {
        return res
          .status(404)
          .json({
            message:
              "Pano bulunamadı veya silme yetkiniz yok.",
          });
      }

      await prisma.board.delete({
        where: {
          id: boardId,
        },
      });

      return res.json({
        message:
          "Pano başarıyla silindi.",
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        message:
          "Pano silinirken bir hata oluştu.",
      });
    }
  }
);

export default router;