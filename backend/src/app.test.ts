
import request from "supertest";
import { describe, expect, it } from "vitest";

import app from "./app";

describe("Application", () => {
  // ==========================================
  // HEALTH CHECK
  // ==========================================

  describe("GET /api/health", () => {
    it("should return API health status", async () => {
      const response = await request(app)
        .get("/api/health");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.status).toBe("ok");
      expect(response.body.timestamp).toBeDefined();

      expect(
        Number.isNaN(Date.parse(response.body.timestamp))
      ).toBe(false);
    });
  });

  // ==========================================
  // SECURITY HEADERS
  // ==========================================

  describe("Security Headers", () => {
    it("should include Helmet security headers", async () => {
      const response = await request(app)
        .get("/api/health");

      expect(response.headers["x-powered-by"]).toBeUndefined();
      expect(response.headers["x-content-type-options"]).toBe("nosniff");
      expect(response.headers["x-frame-options"]).toBeDefined();
    });
  });

  // ==========================================
  // CORS CONFIGURATION
  // ==========================================

  describe("CORS Configuration", () => {
    it("should allow requests from the configured frontend origin", async () => {
      const response = await request(app)
        .get("/api/health")
        .set("Origin", "http://localhost:3000");

      expect(response.status).toBe(200);

      expect(
        response.headers["access-control-allow-origin"]
      ).toBe("http://localhost:3000");

      expect(
        response.headers["access-control-allow-credentials"]
      ).toBe("true");
    });

    it("should not grant CORS access to unknown origins", async () => {
      const response = await request(app)
        .get("/api/health")
        .set("Origin", "https://unknown-example.com");

      expect(response.status).toBe(200);

      expect(
        response.headers["access-control-allow-origin"]
      ).toBeUndefined();
    });
  });
});
