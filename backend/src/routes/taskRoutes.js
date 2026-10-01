import express from "express";

import prisma from "../lib/prisma.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authenticateToken);

const priorities = ["low", "medium", "high"];

async function getOwnedList(listId, userId) {
  return prisma.list.findUnique({
    where: {
      id: listId,
    },
    include: {
      board: true,
    },
  }).then((list) => {
    if (!list || list.board.ownerId !== userId) {
      return null;
    }

    return list;
  });
}

function validateDueDate(value) {
  if (!value) {
    return {
      valid: true,
      date: null,
    };
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return {
      valid: false,
      message: "Geçersiz son tarih.",
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const selected = new Date(date);
  selected.setHours(0, 0, 0, 0);

  if (selected < today) {
    return {
      valid: false,
      message: "Son tarih geçmiş bir tarih olamaz.",
    };
  }

  return {
    valid: true,
    date,
  };
}

// Kolona ait görevleri listele
router.get("/lists/:listId/tasks", async (req, res) => {
  try {
    const listId = Number(req.params.listId);

    if (!Number.isInteger(listId)) {
      return res.status(400).json({
        message: "Geçersiz kolon kimliği.",
      });
    }

    const list = await getOwnedList(
      listId,
      req.user.userId
    );

    if (!list) {
      return res.status(404).json({
        message: "Kolon bulunamadı.",
      });
    }

    const tasks = await prisma.task.findMany({
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
      message: "Görevler alınırken bir hata oluştu.",
    });
  }
});

// Yeni görev oluştur
router.post("/lists/:listId/tasks", async (req, res) => {
  try {
    const listId = Number(req.params.listId);

    const {
      title,
      description,
      priority,
      dueDate,
      assigneeId,
    } = req.body;

    if (!Number.isInteger(listId)) {
      return res.status(400).json({
        message: "Geçersiz kolon kimliği.",
      });
    }

    const list = await getOwnedList(
      listId,
      req.user.userId
    );

    if (!list) {
      return res.status(404).json({
        message: "Kolon bulunamadı.",
      });
    }

    const cleanTitle = title?.trim();
    const cleanDescription = description?.trim();

    if (
      !cleanTitle ||
      cleanTitle.length < 2 ||
      cleanTitle.length > 150
    ) {
      return res.status(400).json({
        message:
          "Görev başlığı 2-150 karakter arasında olmalıdır.",
      });
    }

    if (
      cleanDescription &&
      cleanDescription.length > 1000
    ) {
      return res.status(400).json({
        message:
          "Görev açıklaması en fazla 1000 karakter olabilir.",
      });
    }

    const selectedPriority = priority || "medium";

    if (!priorities.includes(selectedPriority)) {
      return res.status(400).json({
        message: "Geçersiz görev önceliği.",
      });
    }

    const dueDateResult = validateDueDate(dueDate);

    if (!dueDateResult.valid) {
      return res.status(400).json({
        message: dueDateResult.message,
      });
    }

    let selectedAssigneeId = null;

    if (assigneeId !== null && assigneeId !== undefined) {
      selectedAssigneeId = Number(assigneeId);

      if (!Number.isInteger(selectedAssigneeId)) {
        return res.status(400).json({
          message: "Geçersiz kullanıcı kimliği.",
        });
      }

      const assignee = await prisma.user.findUnique({
        where: {
          id: selectedAssigneeId,
        },
      });

      if (!assignee) {
        return res.status(400).json({
          message: "Atanan kullanıcı bulunamadı.",
        });
      }
    }

    const lastTask = await prisma.task.findFirst({
      where: {
        listId,
      },
      orderBy: {
        order: "desc",
      },
    });

    const nextOrder = lastTask
      ? lastTask.order + 1
      : 0;

    const task = await prisma.task.create({
      data: {
        listId,
        title: cleanTitle,
        description: cleanDescription || null,
        priority: selectedPriority,
        dueDate: dueDateResult.date,
        assigneeId: selectedAssigneeId,
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

    return res.status(201).json(task);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Görev oluşturulurken bir hata oluştu.",
    });
  }
});

// Görev güncelle
router.put("/tasks/:id", async (req, res) => {
  try {
    const taskId = Number(req.params.id);

    const {
      title,
      description,
      priority,
      dueDate,
      assigneeId,
    } = req.body;

    if (!Number.isInteger(taskId)) {
      return res.status(400).json({
        message: "Geçersiz görev kimliği.",
      });
    }

    const existingTask = await prisma.task.findUnique({
      where: {
        id: taskId,
      },
      include: {
        list: {
          include: {
            board: true,
          },
        },
      },
    });

    if (
      !existingTask ||
      existingTask.list.board.ownerId !== req.user.userId
    ) {
      return res.status(404).json({
        message: "Görev bulunamadı.",
      });
    }

    const cleanTitle = title?.trim();
    const cleanDescription = description?.trim();

    if (
      !cleanTitle ||
      cleanTitle.length < 2 ||
      cleanTitle.length > 150
    ) {
      return res.status(400).json({
        message:
          "Görev başlığı 2-150 karakter arasında olmalıdır.",
      });
    }

    if (
      cleanDescription &&
      cleanDescription.length > 1000
    ) {
      return res.status(400).json({
        message:
          "Görev açıklaması en fazla 1000 karakter olabilir.",
      });
    }

    if (!priorities.includes(priority)) {
      return res.status(400).json({
        message: "Geçersiz görev önceliği.",
      });
    }

    const dueDateResult = validateDueDate(dueDate);

    if (!dueDateResult.valid) {
      return res.status(400).json({
        message: dueDateResult.message,
      });
    }

    let selectedAssigneeId = null;

    if (assigneeId !== null && assigneeId !== undefined) {
      selectedAssigneeId = Number(assigneeId);

      const assignee = await prisma.user.findUnique({
        where: {
          id: selectedAssigneeId,
        },
      });

      if (!assignee) {
        return res.status(400).json({
          message: "Atanan kullanıcı bulunamadı.",
        });
      }
    }

    const task = await prisma.task.update({
      where: {
        id: taskId,
      },
      data: {
        title: cleanTitle,
        description: cleanDescription || null,
        priority,
        dueDate: dueDateResult.date,
        assigneeId: selectedAssigneeId,
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
      message: "Görev güncellenirken bir hata oluştu.",
    });
  }
});

// Görev sil
router.delete("/tasks/:id", async (req, res) => {
  try {
    const taskId = Number(req.params.id);

    const task = await prisma.task.findUnique({
      where: {
        id: taskId,
      },
      include: {
        list: {
          include: {
            board: true,
          },
        },
      },
    });

    if (
      !task ||
      task.list.board.ownerId !== req.user.userId
    ) {
      return res.status(404).json({
        message: "Görev bulunamadı.",
      });
    }

    await prisma.task.delete({
      where: {
        id: taskId,
      },
    });

    return res.json({
      message: "Görev başarıyla silindi.",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Görev silinirken bir hata oluştu.",
    });
  }
});

export default router;