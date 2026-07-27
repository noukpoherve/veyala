import { describe, expect, it } from "vitest";
import {
  isUserSafeMessage,
  messageForHttpStatus,
  resolveApiError,
  toUserMessage,
  USER_ERRORS,
} from "@/lib/user-facing-error";

describe("user-facing-error", () => {
  it("accepts French API messages", () => {
    expect(isUserSafeMessage("L'offre est trop courte pour une adaptation fiable.")).toBe(true);
  });

  it("rejects Stripe / Prisma / English infra leaks", () => {
    expect(isUserSafeMessage("No such price: 'price_abc'; stripe")).toBe(false);
    expect(isUserSafeMessage("Invalid `prisma.user.findUnique()`")).toBe(false);
    expect(isUserSafeMessage("Error: connect ECONNREFUSED 127.0.0.1")).toBe(false);
    expect(isUserSafeMessage("Unable to create checkout session")).toBe(false);
  });

  it("maps HTTP statuses to actionable French copy", () => {
    expect(messageForHttpStatus(401)).toBe(USER_ERRORS.session);
    expect(messageForHttpStatus(429)).toBe(USER_ERRORS.rateLimited);
    expect(messageForHttpStatus(402)).toMatch(/crédits/i);
  });

  it("resolveApiError prefers safe body over status", () => {
    expect(resolveApiError(500, { error: "L'analyse a échoué." }, USER_ERRORS.unknown)).toBe(
      "L'analyse a échoué."
    );
    expect(resolveApiError(503, { error: "stripe timeout" }, USER_ERRORS.payment)).toBe(
      messageForHttpStatus(503)
    );
  });

  it("toUserMessage handles network TypeError", () => {
    expect(toUserMessage(new TypeError("Failed to fetch"), USER_ERRORS.unknown)).toBe(
      USER_ERRORS.network
    );
  });
});
