const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const https = require("https");
const employeeService = require("../services/employee.service");

const AUTH_JWT_SECRET = process.env.AUTH_JWT_SECRET || "SECRET_KEY";
const MS_CLIENT_ID = process.env.MS_CLIENT_ID || "";
const MS_CLIENT_SECRET = process.env.MS_CLIENT_SECRET || "";
const MS_TENANT_ID = process.env.MS_TENANT_ID || "common";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";
const MS_REDIRECT_URI =
  process.env.MS_REDIRECT_URI ||
  `${BACKEND_URL}/api/auth/microsoft/callback`;
const MS_SCOPE = process.env.MS_SCOPE || "openid profile email User.Read";
const STATE_SECRET = process.env.MS_STATE_SECRET || AUTH_JWT_SECRET;

const buildAuthorityBase = () =>
  `https://login.microsoftonline.com/${MS_TENANT_ID}/oauth2/v2.0`;

const buildFrontendLoginUrl = () => new URL("/login", FRONTEND_URL).toString();

const buildUserPayload = (employee) => ({
  userId: employee.userId,
  firstName: employee.firstName,
  lastName: employee.lastName,
  email: employee.email,
  position: employee.position,
  parentPosition: employee.parentPosition,
  managerName: employee.managerName,
  group: employee.group,
  role: "user"
});

const extractLocalPart = (value = "") => {
  const normalized = String(value || "").trim();
  if (!normalized) return "";
  const atIndex = normalized.indexOf("@");
  return atIndex >= 0 ? normalized.slice(0, atIndex) : normalized;
};

const buildUserPayloadFromMicrosoft = (claims = {}) => {
  const loginHint =
    claims.preferred_username ||
    claims.upn ||
    claims.unique_name ||
    claims.email ||
    "";
  const guessedUserId = extractLocalPart(loginHint);

  const byUserId =
    guessedUserId && employeeService.findByUserId(guessedUserId);
  const byEmail = !byUserId ? employeeService.findByEmail(loginHint) : null;
  const matchedEmployee = byUserId || byEmail;

  if (matchedEmployee) {
    return buildUserPayload(matchedEmployee);
  }

  return {
    userId: guessedUserId || claims.oid || `aad-${Date.now()}`,
    firstName: claims.given_name || "",
    lastName: claims.family_name || "",
    email: claims.preferred_username || claims.email || "",
    position: "Utilisateur Microsoft",
    parentPosition: "",
    managerName: "",
    group: "AAD",
    role: "user"
  };
};

const encodeUserForQuery = (user) =>
  Buffer.from(JSON.stringify(user), "utf8").toString("base64url");

const decodeIdTokenClaims = (idToken) => {
  const claims = jwt.decode(idToken);
  if (!claims || typeof claims !== "object") {
    throw new Error("ID token Microsoft invalide.");
  }
  return claims;
};

const createStateToken = () =>
  jwt.sign(
    { nonce: crypto.randomBytes(16).toString("hex") },
    STATE_SECRET,
    { expiresIn: "10m" }
  );

const ensureMicrosoftConfig = () => {
  if (!MS_CLIENT_ID || !MS_CLIENT_SECRET) {
    throw new Error(
      "Configuration Microsoft incomplète: MS_CLIENT_ID / MS_CLIENT_SECRET."
    );
  }
};

const exchangeCodeForToken = async (code) => {
  const tokenUrl = `${buildAuthorityBase()}/token`;
  const params = new URLSearchParams({
    client_id: MS_CLIENT_ID,
    client_secret: MS_CLIENT_SECRET,
    scope: MS_SCOPE,
    code,
    redirect_uri: MS_REDIRECT_URI,
    grant_type: "authorization_code"
  });

  const payload = await new Promise((resolve, reject) => {
    const request = https.request(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(params.toString())
      }
    });

    let body = "";
    request.on("response", (response) => {
      response.setEncoding("utf8");
      response.on("data", (chunk) => {
        body += chunk;
      });
      response.on("end", () => {
        let json;
        try {
          json = body ? JSON.parse(body) : {};
        } catch {
          reject(new Error("Réponse Microsoft non JSON."));
          return;
        }

        if ((response.statusCode || 500) >= 400) {
          const details = json?.error_description || json?.error || "Unknown";
          reject(new Error(`Echec échange token Microsoft: ${details}`));
          return;
        }

        resolve(json);
      });
    });

    request.on("error", (error) => reject(error));
    request.write(params.toString());
    request.end();
  });

  if (!payload.id_token) {
    throw new Error("Réponse Microsoft sans id_token.");
  }

  return payload;
};

const redirectWithError = (res, code) => {
  const redirect = new URL(buildFrontendLoginUrl());
  redirect.searchParams.set("error", code);
  return res.redirect(redirect.toString());
};

exports.login = (req, res) => {
  const { username, userId, password } = req.body;
  const loginId = (userId || username || "").trim();

  console.log("[auth] Tentative login:", {
    loginId,
    hasPassword: Boolean(password)
  });

  if (!loginId || !password) {
    console.warn("[auth] Credentials manquants");
    return res.status(400).json({ message: "Missing credentials" });
  }

  const employee = employeeService.findByUserId(loginId);

  if (!employee || employee.password !== password) {
    console.warn("[auth] Identifiants invalides", {
      foundUser: Boolean(employee),
      userId: loginId
    });
    return res.status(401).json({ message: "Invalid credentials" });
  }

  console.log("[auth] Login OK:", loginId);
  const payload = buildUserPayload(employee);
  const token = jwt.sign(payload, AUTH_JWT_SECRET, { expiresIn: "8h" });

  return res.json({ token, user: payload });
};

exports.me = (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  return res.json({ user: req.user });
};

exports.microsoftStart = (req, res) => {
  try {
    ensureMicrosoftConfig();
    const state = createStateToken();
    const authorizeUrl = new URL(`${buildAuthorityBase()}/authorize`);

    authorizeUrl.searchParams.set("client_id", MS_CLIENT_ID);
    authorizeUrl.searchParams.set("response_type", "code");
    authorizeUrl.searchParams.set("redirect_uri", MS_REDIRECT_URI);
    authorizeUrl.searchParams.set("response_mode", "query");
    authorizeUrl.searchParams.set("scope", MS_SCOPE);
    authorizeUrl.searchParams.set("state", state);
    authorizeUrl.searchParams.set("prompt", "select_account");

    return res.redirect(authorizeUrl.toString());
  } catch (error) {
    console.error("[auth][microsoftStart]", error.message);
    return redirectWithError(res, "microsoft_config");
  }
};

exports.microsoftCallback = async (req, res) => {
  const { code, state, error } = req.query;

  if (error) {
    console.warn("[auth][microsoftCallback] Microsoft error:", error);
    return redirectWithError(res, "microsoft_denied");
  }

  if (!code || !state) {
    return redirectWithError(res, "microsoft_missing_params");
  }

  try {
    jwt.verify(state, STATE_SECRET);
  } catch {
    return redirectWithError(res, "microsoft_invalid_state");
  }

  try {
    ensureMicrosoftConfig();
    const tokenResponse = await exchangeCodeForToken(code);
    const claims = decodeIdTokenClaims(tokenResponse.id_token);
    const user = buildUserPayloadFromMicrosoft(claims);
    const token = jwt.sign(user, AUTH_JWT_SECRET, { expiresIn: "8h" });

    const redirect = new URL(buildFrontendLoginUrl());
    redirect.searchParams.set("token", token);
    redirect.searchParams.set("user", encodeUserForQuery(user));

    return res.redirect(redirect.toString());
  } catch (exchangeError) {
    console.error("[auth][microsoftCallback]", exchangeError.message);
    return redirectWithError(res, "microsoft_callback_failed");
  }
};
