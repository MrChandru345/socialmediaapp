const assert = require("node:assert/strict");
const test = require("node:test");

const { buildRoomId, normalizeMediaInput, parsePagination } = require("../src/utils/helpers");
const { generateToken, verifyToken } = require("../src/utils/token");

test("token utilities sign and verify a payload", () => {
  const token = generateToken({ sub: "user-123", role: "user" });
  const decodedToken = verifyToken(token);

  assert.equal(decodedToken.sub, "user-123");
  assert.equal(decodedToken.role, "user");
});

test("parsePagination clamps page and limit values", () => {
  const pagination = parsePagination({ page: "0", limit: "1000" });

  assert.equal(pagination.page, 1);
  assert.equal(pagination.limit, 50);
  assert.equal(pagination.skip, 0);
});

test("buildRoomId creates a stable participant room key", () => {
  assert.equal(buildRoomId("user-b", "user-a"), "user-a:user-b");
});

test("normalizeMediaInput accepts strings and objects", () => {
  const media = normalizeMediaInput([
    "https://example.com/image.jpg",
    { url: "https://example.com/video.mp4", type: "video" }
  ]);

  assert.equal(media.length, 2);
  assert.equal(media[0].type, "image");
  assert.equal(media[1].type, "video");
});
