
const crypto = require("crypto");

function getSecret() {
  const secret = process.env.PASS_TOKEN_SECRET || process.env.JWT_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("PASS_TOKEN_SECRET or a sufficiently long JWT_SECRET is required.");
  }

  return secret;
}

function createPassToken(applicationId) {
  const id = Number(applicationId);

  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error("Invalid application ID.");
  }

  const token = crypto
    .createHmac("sha256", getSecret())
    .update(`rudraksh-utsav-pass:${id}`)
    .digest("hex");

  const tokenHash = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  return { token, tokenHash };
}

function hashPassToken(token) {
  if (typeof token !== "string" || !/^[a-f0-9]{64}$/i.test(token)) {
    return null;
  }

  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
}

module.exports = {
  createPassToken,
  hashPassToken,
};
