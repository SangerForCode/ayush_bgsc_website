const request = require("supertest");
const app = require("../server");

describe("API Health Check", () => {
  test("GET /health should return 200", async () => {
    const response = await request(app).get("/health").expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Sports League API is running");
  });
});

describe("API Documentation", () => {
  test("GET /api should return API documentation", async () => {
    const response = await request(app).get("/api").expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.endpoints).toBeDefined();
  });
});

// Note: Add database tests here once you have test database setup
