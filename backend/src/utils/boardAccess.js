import prisma from "../lib/prisma.js";

export async function getBoardAccess(
  boardId,
  userId
) {
  const cleanBoardId = Number(boardId);
  const cleanUserId = Number(userId);

  if (
    !Number.isInteger(cleanBoardId) ||
    !Number.isInteger(cleanUserId)
  ) {
    return null;
  }

  const board =
    await prisma.board.findUnique({
      where: {
        id: cleanBoardId,
      },
    });

  if (!board) {
    return null;
  }

  if (
    board.ownerId === cleanUserId
  ) {
    return {
      board,
      role: "owner",
      isOwner: true,
    };
  }

  const membership =
    await prisma.boardMember.findUnique({
      where: {
        boardId_userId: {
          boardId: cleanBoardId,
          userId: cleanUserId,
        },
      },
    });

  if (!membership) {
    return null;
  }

  return {
    board,
    role: membership.role,
    isOwner: false,
    membership,
  };
}

export async function getListAccess(
  listId,
  userId
) {
  const cleanListId =
    Number(listId);

  if (
    !Number.isInteger(cleanListId)
  ) {
    return null;
  }

  const list =
    await prisma.list.findUnique({
      where: {
        id: cleanListId,
      },
      include: {
        board: true,
      },
    });

  if (!list) {
    return null;
  }

  const access =
    await getBoardAccess(
      list.boardId,
      userId
    );

  if (!access) {
    return null;
  }

  return {
    list,
    ...access,
  };
}

export async function getTaskAccess(
  taskId,
  userId
) {
  const cleanTaskId =
    Number(taskId);

  if (
    !Number.isInteger(cleanTaskId)
  ) {
    return null;
  }

  const task =
    await prisma.task.findUnique({
      where: {
        id: cleanTaskId,
      },
      include: {
        list: {
          include: {
            board: true,
          },
        },
      },
    });

  if (!task) {
    return null;
  }

  const access =
    await getBoardAccess(
      task.list.boardId,
      userId
    );

  if (!access) {
    return null;
  }

  return {
    task,
    list: task.list,
    ...access,
  };
}

export async function isBoardParticipant(
  boardId,
  userId
) {
  const access =
    await getBoardAccess(
      boardId,
      userId
    );

  return Boolean(access);
}