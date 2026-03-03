import { OAuth2Client } from "google-auth-library";

const oAuth2Client = new OAuth2Client({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: process.env.GOOGLE_REDIRECT_URI,
});

export const generateGoogleUrl = () => {
  return oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
    ],
  });
};

export const verifyGoogleToken = async (code: string) => {
  const token = await oAuth2Client.getToken({ code });

  const payload = await oAuth2Client.verifyIdToken({
    idToken: token.tokens.id_token ?? "",
  });

  return payload.getPayload();
};
