const assert = require("node:assert/strict");
const test = require("node:test");
const request = require("supertest");

process.env.NODE_ENV = "test";

const app = require("../src/app");

test("GET /api/health returns the backend health payload", async () => {
  const response = await request(app).get("/api/health");

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.success, true);
  assert.equal(response.body.service, "socialmediaapp-backend");
});

test("GET /unknown returns a structured 404 response", async () => {
  const response = await request(app).get("/unknown");

  assert.equal(response.statusCode, 404);
  assert.equal(response.body.success, false);
  assert.match(response.body.message, /Route GET \/unknown not found/);
});

test("POST /api/auth/register validates the request body", async () => {
  const response = await request(app).post("/api/auth/register").send({
    username: "ab",
    email: "bad-email",
    password: "123"
  });

  assert.equal(response.statusCode, 400);
  assert.equal(response.body.success, false);
  assert.equal(response.body.message, "Validation failed");
  assert.ok(Array.isArray(response.body.details));
});

test("GET /api/auth/me blocks anonymous requests", async () => {
  const response = await request(app).get("/api/auth/me");

  assert.equal(response.statusCode, 401);
  assert.equal(response.body.success, false);
  assert.equal(response.body.message, "Authentication token is required");
});
