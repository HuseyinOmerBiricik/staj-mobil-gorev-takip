import express from "express";

import prisma from "../lib/prisma.js";

import {
  authenticateToken,
} from "../middleware/authMiddleware.js";

import {
  getTaskAccess,
} from "../utils/boardAccess.js";

const router = express.Router();

router.use(authenticateToken);

// Yorumları getir
router.get(
  "/tasks/:taskId/comments",
  async (req, res) => {
    try {
      const taskId = Number(
        req.params.taskId
      );

      const userId = Number(
        req.user.userId
      );

      if (
        !Number.isInteger(taskId)
      ) {
        return res
          .status(400)
          .json({
            message:
              "Geçersiz görev kimliği.",
          });
      }

      const access =
        await getTaskAccess(
          taskId,
          userId
        );

      if (!access) {
        return res
          .status(404)
          .json({
            message:
              "Görev bulunamadı veya erişim yetkiniz yok.",
          });
      }

      const comments =
        await prisma.comment.findMany({
          where: {
            taskId,
          },

          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },

          orderBy: {
            createdAt: "asc",
          },
        });

      return res.json(comments);
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        message:
          "Yorumlar alınırken bir hata oluştu.",
      });
    }
  }
);

// Yorum ekle
router.post(
  "/tasks/:taskId/comments",
  async (req, res) => {
    try {
      const taskId = Number(
        req.params.taskId
      );

      const userId = Number(
        req.user.userId
      );

      const content =
        req.body.content?.trim();

      if (
        !Number.isInteger(taskId)
      ) {
        return res
          .status(400)
          .json({
            message:
              "Geçersiz görev kimliği.",
          });
      }

      if (!content) {
        return res
          .status(400)
          .json({
            message:
              "Yorum metni boş bırakılamaz.",
          });
      }

      if (
        content.length > 1000
      ) {
        return res
          .status(400)
          .json({
            message:
              "Yorum en fazla 1000 karakter olabilir.",
          });
      }

      const access =
        await getTaskAccess(
          taskId,
          userId
        );

      if (!access) {
        return res
          .status(404)
          .json({
            message:
              "Görev bulunamadı veya erişim yetkiniz yok.",
          });
      }

      const comment =
        await prisma.comment.create({
          data: {
            taskId,
            userId,
            content,
          },

          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });

      return res
        .status(201)
        .json(comment);
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        message:
          "Yorum oluşturulurken bir hata oluştu.",
      });
    }
  }
);

// Kendi yorumunu düzenle
router.put(
  "/comments/:id",
  async (req, res) => {
    try {
      const commentId =
        Number(
          req.params.id
        );

      const userId = Number(
        req.user.userId
      );

      const content =
        req.body.content?.trim();

      if (
        !Number.isInteger(
          commentId
        )
      ) {
        return res
          .status(400)
          .json({
            message:
              "Geçersiz yorum kimliği.",
          });
      }

      if (!content) {
        return res
          .status(400)
          .json({
            message:
              "Yorum metni boş bırakılamaz.",
          });
      }

      if (
        content.length > 1000
      ) {
        return res
          .status(400)
          .json({
            message:
              "Yorum en fazla 1000 karakter olabilir.",
          });
      }

      const comment =
        await prisma.comment.findUnique({
          where: {
            id: commentId,
          },
        });

      if (!comment) {
        return res
          .status(404)
          .json({
            message:
              "Yorum bulunamadı.",
          });
      }

      const access =
        await getTaskAccess(
          comment.taskId,
          userId
        );

      if (!access) {
        return res
          .status(403)
          .json({
            message:
              "Bu yoruma erişim yetkiniz yok.",
          });
      }

      if (
        comment.userId !==
        userId
      ) {
        return res
          .status(403)
          .json({
            message:
              "Yalnızca kendi yorumunuzu düzenleyebilirsiniz.",
          });
      }

      const updated =
        await prisma.comment.update({
          where: {
            id: commentId,
          },

          data: {
            content,
          },

          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });

      return res.json(updated);
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        message:
          "Yorum güncellenirken bir hata oluştu.",
      });
    }
  }
);

// Kendi yorumunu sil
router.delete(
  "/comments/:id",
  async (req, res) => {
    try {
      const commentId =
        Number(
          req.params.id
        );

      const userId = Number(
        req.user.userId
      );

      if (
        !Number.isInteger(
          commentId
        )
      ) {
        return res
          .status(400)
          .json({
            message:
              "Geçersiz yorum kimliği.",
          });
      }

      const comment =
        await prisma.comment.findUnique({
          where: {
            id: commentId,
          },
        });

      if (!comment) {
        return res
          .status(404)
          .json({
            message:
              "Yorum bulunamadı.",
          });
      }

      const access =
        await getTaskAccess(
          comment.taskId,
          userId
        );

      if (!access) {
        return res
          .status(403)
          .json({
            message:
              "Bu yoruma erişim yetkiniz yok.",
          });
      }

      if (
        comment.userId !==
        userId
      ) {
        return res
          .status(403)
          .json({
            message:
              "Yalnızca kendi yorumunuzu silebilirsiniz.",
          });
      }

      await prisma.comment.delete({
        where: {
          id: commentId,
        },
      });

      return res.json({
        message:
          "Yorum silindi.",
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        message:
          "Yorum silinirken bir hata oluştu.",
      });
    }
  }
);

export default router;