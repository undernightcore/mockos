import Mailjet from "node-mailjet";

const mailjet = new Mailjet({
  apiKey: process.env.MJ_APIKEY_PUBLIC,
  apiSecret: process.env.MJ_APIKEY_PRIVATE,
});

export const sendConfirmationEmail = (
  name: string,
  email: string,
  url: string
) => {
  return mailjet.post("send", { version: "v3.1" }).request({
    Messages: [
      {
        From: {
          Email: "info@mockos.io",
          Name: "Mockos",
        },
        To: [
          {
            Email: email,
            Name: name,
          },
        ],
        TemplateID: 7798686,
        TemplateLanguage: true,
        Subject: "Email Confirmation",
        Variables: {
          url,
          name,
        },
      },
    ],
  });
};

export const sendResetEmail = (name: string, email: string, url: string) => {
  return mailjet.post("send", { version: "v3.1" }).request({
    Messages: [
      {
        From: {
          Email: "info@mockos.io",
          Name: "Mockos",
        },
        To: [
          {
            Email: email,
            Name: name,
          },
        ],
        TemplateID: 7799104,
        TemplateLanguage: true,
        Subject: "Reset Password",
        Variables: {
          url,
          name,
        },
      },
    ],
  });
};
