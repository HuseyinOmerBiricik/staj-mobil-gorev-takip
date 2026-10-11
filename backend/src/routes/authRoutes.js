import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import prisma from "../lib/prisma.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import crypto from "crypto";
import { sendPasswordResetCode } from "../utils/mail.js";

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Ad soyad, e-posta ve şifre zorunludur.",
      });
    }

    if (name.trim().length < 2 || name.trim().length > 100) {
      return res.status(400).json({
        message: "Ad soyad 2-100 karakter arasında olmalıdır.",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: "Geçerli bir e-posta adresi giriniz.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Şifre en az 6 karakter olmalıdır.",
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email: email.toLowerCase(),
      },
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Bu e-posta adresi zaten kayıtlı.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase(),
        passwordHash,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    return res.status(201).json({
      message: "Kullanıcı başarıyla oluşturuldu.",
      user,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Sunucu hatası.",
    });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "E-posta ve şifre zorunludur.",
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        email: email.toLowerCase(),
      },
    });

    if (!user) {
      return res.status(401).json({
        message: "E-posta veya şifre hatalı.",
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        message: "E-posta veya şifre hatalı.",
      });
    }

    const token = jwt.sign(
      {
        userId: user.id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Sunucu hatası.",
    });
  }
});

router.get("/me", authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: req.user.userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "Kullanıcı bulunamadı.",
      });
    }

    return res.json(user);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Sunucu hatası.",
    });
  }
});

export default router;
// Şifremi unuttum
router.post(
  "/forgot-password",
  async (req, res) => {
    try {
      const cleanEmail =
        req.body.email
          ?.trim()
          .toLowerCase();

      if (!cleanEmail) {
        return res.status(400).json({
          message:
            "E-posta adresi zorunludur.",
        });
      }

      const emailRegex =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (
        !emailRegex.test(
          cleanEmail
        )
      ) {
        return res.status(400).json({
          message:
            "Geçerli bir e-posta adresi giriniz.",
        });
      }

      const user =
        await prisma.user.findUnique({
          where: {
            email: cleanEmail,
          },
        });

      // Güvenlik için kullanıcı yoksa bile
      // aynı mesajı döndürüyoruz.
      if (!user) {
        return res.json({
          message:
            "Eğer bu e-posta adresi kayıtlıysa şifre sıfırlama kodu gönderildi.",
        });
      }

      // Önce eski kullanılmamış kodları temizle
      await prisma.passwordResetCode.deleteMany({
        where: {
          userId: user.id,
          usedAt: null,
        },
      });

      const code = String(
        crypto.randomInt(
          100000,
          1000000
        )
      );

      const codeHash =
        crypto
          .createHash("sha256")
          .update(code)
          .digest("hex");

      const expiresAt =
        new Date(
          Date.now() +
            10 * 60 * 1000
        );

      await prisma.passwordResetCode.create({
        data: {
          userId: user.id,
          codeHash,
          expiresAt,
        },
      });

      try {
        await sendPasswordResetCode(
          user.email,
          user.name,
          code
        );
      } catch (mailError) {
        console.error(
          "Mail gönderme hatası:",
          mailError
        );

        return res.status(500).json({
          message:
            "Şifre sıfırlama e-postası gönderilemedi.",
        });
      }

      return res.json({
        message:
          "Eğer bu e-posta adresi kayıtlıysa şifre sıfırlama kodu gönderildi.",
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        message:
          "Şifre sıfırlama isteği oluşturulamadı.",
      });
    }
  }
);

// Kod ile yeni şifre belirle
router.post(
  "/reset-password",
  async (req, res) => {
    try {
      const cleanEmail =
        req.body.email
          ?.trim()
          .toLowerCase();

      const code =
        String(
          req.body.code || ""
        ).trim();

      const password =
        req.body.password;

      if (
        !cleanEmail ||
        !code ||
        !password
      ) {
        return res.status(400).json({
          message:
            "E-posta, doğrulama kodu ve yeni şifre zorunludur.",
        });
      }

      if (!/^\d{6}$/.test(code)) {
        return res.status(400).json({
          message:
            "Doğrulama kodu 6 haneli olmalıdır.",
        });
      }

      if (
        password.length < 6
      ) {
        return res.status(400).json({
          message:
            "Yeni şifre en az 6 karakter olmalıdır.",
        });
      }

      const user =
        await prisma.user.findUnique({
          where: {
            email: cleanEmail,
          },
        });

      if (!user) {
        return res.status(400).json({
          message:
            "Doğrulama kodu geçersiz veya süresi dolmuş.",
        });
      }

      const codeHash =
        crypto
          .createHash("sha256")
          .update(code)
          .digest("hex");

      const resetRecord =
        await prisma.passwordResetCode.findFirst({
          where: {
            userId: user.id,
            codeHash,
            usedAt: null,
            expiresAt: {
              gt: new Date(),
            },
          },

          orderBy: {
            createdAt: "desc",
          },
        });

      if (!resetRecord) {
        return res.status(400).json({
          message:
            "Doğrulama kodu geçersiz veya süresi dolmuş.",
        });
      }

      const newPasswordHash =
        await bcrypt.hash(
          password,
          10
        );

      await prisma.$transaction([
        prisma.user.update({
          where: {
            id: user.id,
          },

          data: {
            passwordHash:
              newPasswordHash,
          },
        }),

        prisma.passwordResetCode.update({
          where: {
            id: resetRecord.id,
          },

          data: {
            usedAt: new Date(),
          },
        }),
      ]);

      return res.json({
        message:
          "Şifreniz başarıyla güncellendi.",
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        message:
          "Şifre güncellenirken bir hata oluştu.",
      });
    }
  }
);