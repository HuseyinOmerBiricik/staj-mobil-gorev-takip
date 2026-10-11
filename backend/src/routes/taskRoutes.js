import express from "express";

import prisma from "../lib/prisma.js";

import {
  authenticateToken,
} from "../middleware/authMiddleware.js";

import {
  getListAccess,
  getTaskAccess,
  isBoardParticipant,
} from "../utils/boardAccess.js";

const router = express.Router();

router.use(authenticateToken);

const priorities = [
  "low",
  "medium",
  "high",
];

function validateDueDate(value) {
  if (!value) {
    return {
      valid: true,
      date: null,
    };
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return {
      valid: false,
      message:
        "Geçersiz son tarih.",
    };
  }

  const today = new Date();

  today.setHours(
    0,
    0,
    0,
    0
  );

  const selected =
    new Date(date);

  selected.setHours(
    0,
    0,
    0,
    0
  );

  if (selected < today) {
    return {
      valid: false,
      message:
        "Son tarih geçmiş bir tarih olamaz.",
    };
  }

  return {
    valid: true,
    date,
  };
}

async function validateAssignee(
  boardId,
  assigneeId
) {
  if (
    assigneeId === null ||
    assigneeId === undefined ||
    assigneeId === ""
  ) {
    return {
      valid: true,
      assigneeId: null,
    };
  }

  const cleanId =
    Number(assigneeId);

  if (
    !Number.isInteger(cleanId)
  ) {
    return {
      valid: false,
      message:
        "Geçersiz kullanıcı kimliği.",
    };
  }

  const user =
    await prisma.user.findUnique({
      where: {
        id: cleanId,
      },
    });

  if (!user) {
    return {
      valid: false,
      message:
        "Atanan kullanıcı bulunamadı.",
    };
  }

  const participant =
    await isBoardParticipant(
      boardId,
      cleanId
    );

  if (!participant) {
    return {
      valid: false,
      message:
        "Görev yalnızca pano üyelerine atanabilir.",
    };
  }

  return {
    valid: true,
    assigneeId: cleanId,
  };
}

// Görevleri getir
router.get(
  "/lists/:listId/tasks",
  async (req, res) => {
    try {
      const listId = Number(
        req.params.listId
      );

      if (
        !Number.isInteger(listId)
      ) {
        return res
          .status(400)
          .json({
            message:
              "Geçersiz kolon kimliği.",
          });
      }

      const access =
        await getListAccess(
          listId,
          req.user.userId
        );

      if (!access) {
        return res
          .status(404)
          .json({
            message:
              "Kolon bulunamadı veya erişim yetkiniz yok.",
          });
      }

      const tasks =
        await prisma.task.findMany({
          where: {
            listId,
          },

          orderBy: {
            order: "asc",
          },

          include: {
            assignee: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });

      return res.json(tasks);
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        message:
          "Görevler alınırken bir hata oluştu.",
      });
    }
  }
);

// Görev oluştur
router.post(
  "/lists/:listId/tasks",
  async (req, res) => {
    try {
      const listId = Number(
        req.params.listId
      );

      const {
        title,
        description,
        priority,
        dueDate,
        assigneeId,
      } = req.body;

      if (
        !Number.isInteger(listId)
      ) {
        return res
          .status(400)
          .json({
            message:
              "Geçersiz kolon kimliği.",
          });
      }

      const access =
        await getListAccess(
          listId,
          req.user.userId
        );

      if (!access) {
        return res
          .status(404)
          .json({
            message:
              "Kolon bulunamadı veya erişim yetkiniz yok.",
          });
      }

      const cleanTitle =
        title?.trim();

      const cleanDescription =
        description?.trim();

      if (
        !cleanTitle ||
        cleanTitle.length < 2 ||
        cleanTitle.length > 150
      ) {
        return res
          .status(400)
          .json({
            message:
              "Görev başlığı 2-150 karakter arasında olmalıdır.",
          });
      }

      if (
        cleanDescription &&
        cleanDescription.length >
          1000
      ) {
        return res
          .status(400)
          .json({
            message:
              "Görev açıklaması en fazla 1000 karakter olabilir.",
          });
      }

      const selectedPriority =
        priority || "medium";

      if (
        !priorities.includes(
          selectedPriority
        )
      ) {
        return res
          .status(400)
          .json({
            message:
              "Geçersiz görev önceliği.",
          });
      }

      const dueDateResult =
        validateDueDate(
          dueDate
        );

      if (!dueDateResult.valid) {
        return res
          .status(400)
          .json({
            message:
              dueDateResult.message,
          });
      }

      const assigneeResult =
        await validateAssignee(
          access.list.boardId,
          assigneeId
        );

      if (
        !assigneeResult.valid
      ) {
        return res
          .status(400)
          .json({
            message:
              assigneeResult.message,
          });
      }

      const lastTask =
        await prisma.task.findFirst({
          where: {
            listId,
          },

          orderBy: {
            order: "desc",
          },
        });

      const nextOrder =
        lastTask
          ? lastTask.order + 1
          : 0;

      const task =
        await prisma.task.create({
          data: {
            listId,
            title: cleanTitle,

            description:
              cleanDescription ||
              null,

            priority:
              selectedPriority,

            dueDate:
              dueDateResult.date,

            assigneeId:
              assigneeResult.assigneeId,

            order: nextOrder,
          },

          include: {
            assignee: {
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
        .json(task);
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        message:
          "Görev oluşturulurken bir hata oluştu.",
      });
    }
  }
);

// Görev güncelle
router.put(
  "/tasks/:id",
  async (req, res) => {
    try {
      const taskId = Number(
        req.params.id
      );

      const {
        title,
        description,
        priority,
        dueDate,
        assigneeId,
      } = req.body;

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
          req.user.userId
        );

      if (!access) {
        return res
          .status(404)
          .json({
            message:
              "Görev bulunamadı veya erişim yetkiniz yok.",
          });
      }

      const cleanTitle =
        title?.trim();

      const cleanDescription =
        description?.trim();

      if (
        !cleanTitle ||
        cleanTitle.length < 2 ||
        cleanTitle.length > 150
      ) {
        return res
          .status(400)
          .json({
            message:
              "Görev başlığı 2-150 karakter arasında olmalıdır.",
          });
      }

      if (
        cleanDescription &&
        cleanDescription.length >
          1000
      ) {
        return res
          .status(400)
          .json({
            message:
              "Görev açıklaması en fazla 1000 karakter olabilir.",
          });
      }

      if (
        !priorities.includes(
          priority
        )
      ) {
        return res
          .status(400)
          .json({
            message:
              "Geçersiz görev önceliği.",
          });
      }

      const dueDateResult =
        validateDueDate(
          dueDate
        );

      if (!dueDateResult.valid) {
        return res
          .status(400)
          .json({
            message:
              dueDateResult.message,
          });
      }

      const assigneeResult =
        await validateAssignee(
          access.list.boardId,
          assigneeId
        );

      if (
        !assigneeResult.valid
      ) {
        return res
          .status(400)
          .json({
            message:
              assigneeResult.message,
          });
      }

      const task =
        await prisma.task.update({
          where: {
            id: taskId,
          },

          data: {
            title: cleanTitle,

            description:
              cleanDescription ||
              null,

            priority,

            dueDate:
              dueDateResult.date,

            assigneeId:
              assigneeResult.assigneeId,
          },

          include: {
            assignee: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });

      return res.json(task);
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        message:
          "Görev güncellenirken bir hata oluştu.",
      });
    }
  }
);

// Drag & drop
router.patch(
  "/tasks/:id/move",
  async (req, res) => {
    try {
      const taskId = Number(
        req.params.id
      );

      const targetListId =
        Number(
          req.body.targetListId
        );

      let newOrder = Number(
        req.body.newOrder
      );

      if (
        !Number.isInteger(taskId) ||
        !Number.isInteger(
          targetListId
        ) ||
        !Number.isInteger(
          newOrder
        )
      ) {
        return res
          .status(400)
          .json({
            message:
              "Geçersiz taşıma bilgileri.",
          });
      }

      const sourceAccess =
        await getTaskAccess(
          taskId,
          req.user.userId
        );

      if (!sourceAccess) {
        return res
          .status(404)
          .json({
            message:
              "Görev bulunamadı.",
          });
      }

      const targetAccess =
        await getListAccess(
          targetListId,
          req.user.userId
        );

      if (!targetAccess) {
        return res
          .status(404)
          .json({
            message:
              "Hedef kolon bulunamadı.",
          });
      }

      if (
        sourceAccess.list.boardId !==
        targetAccess.list.boardId
      ) {
        return res
          .status(400)
          .json({
            message:
              "Görev farklı bir panoya taşınamaz.",
          });
      }

      const sourceListId =
        sourceAccess.task.listId;

      const targetTasks =
        await prisma.task.findMany({
          where: {
            listId: targetListId,
            id: {
              not: taskId,
            },
          },

          orderBy: {
            order: "asc",
          },
        });

      newOrder = Math.max(
        0,
        Math.min(
          newOrder,
          targetTasks.length
        )
      );

      if (
        sourceListId ===
        targetListId
      ) {
        const reordered = [
          ...targetTasks,
        ];

        reordered.splice(
          newOrder,
          0,
          sourceAccess.task
        );

        await prisma.$transaction(
          reordered.map(
            (task, index) =>
              prisma.task.update({
                where: {
                  id: task.id,
                },

                data: {
                  listId:
                    targetListId,
                  order: index,
                },
              })
          )
        );
      } else {
        const sourceRemaining =
          await prisma.task.findMany({
            where: {
              listId:
                sourceListId,

              id: {
                not: taskId,
              },
            },

            orderBy: {
              order: "asc",
            },
          });

        const newTargetTasks = [
          ...targetTasks,
        ];

        newTargetTasks.splice(
          newOrder,
          0,
          sourceAccess.task
        );

        const operations = [];

        sourceRemaining.forEach(
          (task, index) => {
            operations.push(
              prisma.task.update({
                where: {
                  id: task.id,
                },

                data: {
                  order: index,
                },
              })
            );
          }
        );

        newTargetTasks.forEach(
          (task, index) => {
            operations.push(
              prisma.task.update({
                where: {
                  id: task.id,
                },

                data: {
                  listId:
                    targetListId,
                  order: index,
                },
              })
            );
          }
        );

        await prisma.$transaction(
          operations
        );
      }

      const movedTask =
        await prisma.task.findUnique({
          where: {
            id: taskId,
          },

          include: {
            assignee: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });

      return res.json(
        movedTask
      );
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        message:
          "Görev taşınırken bir hata oluştu.",
      });
    }
  }
);

// Görev sil
router.delete(
  "/tasks/:id",
  async (req, res) => {
    try {
      const taskId = Number(
        req.params.id
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
          req.user.userId
        );

      if (!access) {
        return res
          .status(404)
          .json({
            message:
              "Görev bulunamadı veya erişim yetkiniz yok.",
          });
      }

      await prisma.task.delete({
        where: {
          id: taskId,
        },
      });

      return res.json({
        message:
          "Görev başarıyla silindi.",
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        message:
          "Görev silinirken bir hata oluştu.",
      });
    }
  }
);

export default router;