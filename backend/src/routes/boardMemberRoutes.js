import express from "express";

import prisma from "../lib/prisma.js";
import {
  authenticateToken,
} from "../middleware/authMiddleware.js";

import {
  getBoardAccess,
} from "../utils/boardAccess.js";

const router = express.Router();

router.use(authenticateToken);

// Pano sahibi + üyeleri
router.get(
  "/boards/:boardId/members",
  async (req, res) => {
    try {
      const boardId = Number(
        req.params.boardId
      );

      const userId = Number(
        req.user.userId
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

      const access =
        await getBoardAccess(
          boardId,
          userId
        );

      if (!access) {
        return res
          .status(404)
          .json({
            message:
              "Pano bulunamadı veya erişim yetkiniz yok.",
          });
      }

      const board =
        await prisma.board.findUnique({
          where: {
            id: boardId,
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
            },
          },
        });

      const members = [
        {
          id: `owner-${board.owner.id}`,
          membershipId: null,
          role: "owner",
          isOwner: true,
          user: board.owner,
        },

        ...board.members.map(
          (membership) => ({
            id: membership.id,
            membershipId:
              membership.id,
            role:
              membership.role,
            isOwner: false,
            createdAt:
              membership.createdAt,
            user:
              membership.user,
          })
        ),
      ];

      return res.json(members);
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        message:
          "Pano üyeleri alınırken bir hata oluştu.",
      });
    }
  }
);

// E-posta ile kullanıcı davet et / üye ekle
router.post(
  "/boards/:boardId/members",
  async (req, res) => {
    try {
      const boardId = Number(
        req.params.boardId
      );

      const currentUserId =
        Number(
          req.user.userId
        );

      const cleanEmail =
        req.body.email
          ?.trim()
          .toLowerCase();

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

      if (!cleanEmail) {
        return res
          .status(400)
          .json({
            message:
              "E-posta adresi zorunludur.",
          });
      }

      const board =
        await prisma.board.findFirst({
          where: {
            id: boardId,
            ownerId:
              currentUserId,
          },
        });

      if (!board) {
        return res
          .status(403)
          .json({
            message:
              "Yalnızca pano sahibi kullanıcı davet edebilir.",
          });
      }

      const invitedUser =
        await prisma.user.findUnique({
          where: {
            email: cleanEmail,
          },

          select: {
            id: true,
            name: true,
            email: true,
          },
        });

      if (!invitedUser) {
        return res
          .status(404)
          .json({
            message:
              "Bu e-posta adresiyle kayıtlı kullanıcı bulunamadı.",
          });
      }

      if (
        invitedUser.id ===
        board.ownerId
      ) {
        return res
          .status(400)
          .json({
            message:
              "Pano sahibi zaten bu panoya erişebilir.",
          });
      }

      const existingMember =
        await prisma.boardMember.findUnique({
          where: {
            boardId_userId: {
              boardId,
              userId:
                invitedUser.id,
            },
          },
        });

      if (existingMember) {
        return res
          .status(409)
          .json({
            message:
              "Bu kullanıcı zaten pano üyesi.",
          });
      }

      const membership =
        await prisma.boardMember.create({
          data: {
            boardId,
            userId:
              invitedUser.id,
            role: "member",
          },
        });

      return res.status(201).json({
        id: membership.id,
        membershipId:
          membership.id,
        role: membership.role,
        isOwner: false,
        createdAt:
          membership.createdAt,
        user: invitedUser,
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        message:
          "Kullanıcı panoya eklenirken bir hata oluştu.",
      });
    }
  }
);

// Panodan üye çıkar - yalnızca owner
router.delete(
  "/boards/:boardId/members/:userId",
  async (req, res) => {
    try {
      const boardId = Number(
        req.params.boardId
      );

      const memberUserId =
        Number(
          req.params.userId
        );

      const currentUserId =
        Number(
          req.user.userId
        );

      if (
        !Number.isInteger(boardId) ||
        !Number.isInteger(
          memberUserId
        )
      ) {
        return res
          .status(400)
          .json({
            message:
              "Geçersiz kullanıcı veya pano kimliği.",
          });
      }

      const board =
        await prisma.board.findFirst({
          where: {
            id: boardId,
            ownerId:
              currentUserId,
          },
        });

      if (!board) {
        return res
          .status(403)
          .json({
            message:
              "Yalnızca pano sahibi üye çıkarabilir.",
          });
      }

      if (
        board.ownerId ===
        memberUserId
      ) {
        return res
          .status(400)
          .json({
            message:
              "Pano sahibi panodan çıkarılamaz.",
          });
      }

      const membership =
        await prisma.boardMember.findUnique({
          where: {
            boardId_userId: {
              boardId,
              userId:
                memberUserId,
            },
          },
        });

      if (!membership) {
        return res
          .status(404)
          .json({
            message:
              "Pano üyeliği bulunamadı.",
          });
      }

      // Üye çıkarıldığında ona atanmış görevleri
      // atanmamış hale getiriyoruz.
      await prisma.$transaction([
        prisma.task.updateMany({
          where: {
            assigneeId:
              memberUserId,

            list: {
              boardId,
            },
          },

          data: {
            assigneeId: null,
          },
        }),

        prisma.boardMember.delete({
          where: {
            id: membership.id,
          },
        }),
      ]);

      return res.json({
        message:
          "Kullanıcı panodan çıkarıldı.",
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        message:
          "Kullanıcı panodan çıkarılırken bir hata oluştu.",
      });
    }
  }
);

// Üyenin kendisinin panodan ayrılması
router.delete(
  "/boards/:boardId/leave",
  async (req, res) => {
    try {
      const boardId = Number(
        req.params.boardId
      );

      const userId = Number(
        req.user.userId
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

      const board =
        await prisma.board.findUnique({
          where: {
            id: boardId,
          },
        });

      if (!board) {
        return res
          .status(404)
          .json({
            message:
              "Pano bulunamadı.",
          });
      }

      if (
        board.ownerId === userId
      ) {
        return res
          .status(400)
          .json({
            message:
              "Pano sahibi panodan ayrılamaz. Panoyu silebilirsiniz.",
          });
      }

      const membership =
        await prisma.boardMember.findUnique({
          where: {
            boardId_userId: {
              boardId,
              userId,
            },
          },
        });

      if (!membership) {
        return res
          .status(404)
          .json({
            message:
              "Bu panonun üyesi değilsiniz.",
          });
      }

      await prisma.$transaction([
        prisma.task.updateMany({
          where: {
            assigneeId: userId,

            list: {
              boardId,
            },
          },

          data: {
            assigneeId: null,
          },
        }),

        prisma.boardMember.delete({
          where: {
            id: membership.id,
          },
        }),
      ]);

      return res.json({
        message:
          "Panodan ayrıldınız.",
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        message:
          "Panodan ayrılırken bir hata oluştu.",
      });
    }
  }
);

// Görev ataması yapılabilecek kullanıcılar
router.get(
  "/boards/:boardId/assignable-users",
  async (req, res) => {
    try {
      const boardId = Number(
        req.params.boardId
      );

      const userId = Number(
        req.user.userId
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

      const access =
        await getBoardAccess(
          boardId,
          userId
        );

      if (!access) {
        return res
          .status(404)
          .json({
            message:
              "Pano bulunamadı veya erişim yetkiniz yok.",
          });
      }

      const board =
        await prisma.board.findUnique({
          where: {
            id: boardId,
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
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        });

      const users = [
        board.owner,
        ...board.members.map(
          (member) =>
            member.user
        ),
      ];

      users.sort((a, b) =>
        a.name.localeCompare(
          b.name,
          "tr"
        )
      );

      return res.json(users);
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        message:
          "Kullanıcılar alınırken bir hata oluştu.",
      });
    }
  }
);

export default router;