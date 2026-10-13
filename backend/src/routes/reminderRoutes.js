import express from "express";

import prisma from "../lib/prisma.js";

import {
  authenticateToken,
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authenticateToken);

router.get(
  "/reminders",
  async (req, res) => {
    try {
      const userId =
        Number(
          req.user.userId
        );

      const tasks =
        await prisma.task.findMany({
          where: {
            dueDate: {
              not: null,
            },

            list: {
              board: {
                OR: [
                  {
                    ownerId:
                      userId,
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
            },
          },

          orderBy: [
            {
              dueDate: "asc",
            },

            {
              priority: "desc",
            },
          ],

          include: {
            assignee: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },

            list: {
              select: {
                id: true,
                title: true,
                boardId: true,

                board: {
                  select: {
                    id: true,
                    title: true,
                    ownerId: true,
                  },
                },
              },
            },
          },
        });

      return res.json(
        tasks
      );
    } catch (error) {
      console.error(
        "Hatırlatmalar alınamadı:",
        error
      );

      return res
        .status(500)
        .json({
          message:
            "Hatırlatmalar alınırken bir hata oluştu.",
        });
    }
  }
);

export default router;