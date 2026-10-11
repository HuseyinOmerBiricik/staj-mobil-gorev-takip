import nodemailer from "nodemailer";

let testAccount = null;
let transporter = null;

async function getTransporter() {
  if (
    testAccount &&
    transporter
  ) {
    return {
      testAccount,
      transporter,
    };
  }

  testAccount =
    await nodemailer.createTestAccount();

  transporter =
    nodemailer.createTransport({
      host:
        testAccount.smtp.host,

      port:
        testAccount.smtp.port,

      secure:
        testAccount.smtp.secure,

      auth: {
        user:
          testAccount.user,

        pass:
          testAccount.pass,
      },
    });

  await transporter.verify();

  console.log(
    "Ethereal test e-posta hesabı hazır."
  );

  console.log(
    "Ethereal kullanıcı:",
    testAccount.user
  );

  return {
    testAccount,
    transporter,
  };
}

export async function sendPasswordResetCode(
  email,
  name,
  code
) {
  const {
    testAccount,
    transporter,
  } = await getTransporter();

  const info =
    await transporter.sendMail({
      from: `"Görev Takip" <${testAccount.user}>`,

      to: email,

      subject:
        "Şifre Sıfırlama Kodu",

      text: `
Merhaba ${name},

Şifre sıfırlama kodunuz:

${code}

Bu kod 10 dakika boyunca geçerlidir.

Eğer bu işlemi siz başlatmadıysanız bu mesajı dikkate almayabilirsiniz.
      `.trim(),

      html: `
        <div
          style="
            font-family: Arial, sans-serif;
            max-width: 520px;
            margin: auto;
          "
        >
          <h2>
            Şifre Sıfırlama
          </h2>

          <p>
            Merhaba ${name},
          </p>

          <p>
            Şifre sıfırlama kodunuz:
          </p>

          <div
            style="
              font-size: 32px;
              font-weight: 700;
              letter-spacing: 8px;
              margin: 24px 0;
            "
          >
            ${code}
          </div>

          <p>
            Bu kod
            <strong>
              10 dakika
            </strong>
            boyunca geçerlidir.
          </p>

          <p
            style="
              color: #666;
            "
          >
            Eğer bu işlemi siz başlatmadıysanız
            bu mesajı dikkate almayabilirsiniz.
          </p>
        </div>
      `,
    });

  const previewUrl =
    nodemailer.getTestMessageUrl(
      info
    );

  console.log(
    "\n=============================="
  );

  console.log(
    "ŞİFRE SIFIRLAMA MAİLİ GÖNDERİLDİ"
  );

  console.log(
    "Alıcı:",
    email
  );

  console.log(
    "Ethereal Preview:"
  );

  console.log(
    previewUrl
  );

  console.log(
    "==============================\n"
  );

  return {
    messageId: info.messageId,
    previewUrl,
  };
}