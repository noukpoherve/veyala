-- Prevent duplicate PURCHASE/GENERATION ledger rows for the same refId.
-- Keep the oldest row when duplicates already exist, and roll back the extra
-- credits from the balance so a past double-credit is corrected once.

WITH ranked AS (
  SELECT
    id,
    "userId",
    delta,
    "refId",
    ROW_NUMBER() OVER (
      PARTITION BY reason, "refId"
      ORDER BY "createdAt" ASC, id ASC
    ) AS rn
  FROM "CreditTransaction"
  WHERE "refId" IS NOT NULL
),
dupes AS (
  SELECT id, "userId", delta
  FROM ranked
  WHERE rn > 1
),
refunded AS (
  UPDATE "Credits" c
  SET balance = GREATEST(0, c.balance - d.extra),
      "updatedAt" = CURRENT_TIMESTAMP
  FROM (
    SELECT "userId", SUM(delta) AS extra
    FROM dupes
    GROUP BY "userId"
  ) d
  WHERE c."userId" = d."userId"
  RETURNING c."userId"
)
DELETE FROM "CreditTransaction" ct
USING dupes d
WHERE ct.id = d.id;

CREATE UNIQUE INDEX "CreditTransaction_reason_refId_key"
ON "CreditTransaction" (reason, "refId");

-- One Stripe PaymentIntent → at most one Payment row (NULLs allowed many times).
WITH pi_ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY "stripePaymentIntent"
      ORDER BY
        CASE WHEN status = 'PAID' THEN 0 ELSE 1 END,
        "createdAt" ASC,
        id ASC
    ) AS rn
  FROM "Payment"
  WHERE "stripePaymentIntent" IS NOT NULL
)
UPDATE "Payment" p
SET status = 'FAILED'
FROM pi_ranked r
WHERE p.id = r.id AND r.rn > 1 AND p.status = 'PENDING';

WITH pi_ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY "stripePaymentIntent"
      ORDER BY
        CASE WHEN status = 'PAID' THEN 0 ELSE 1 END,
        "createdAt" ASC,
        id ASC
    ) AS rn
  FROM "Payment"
  WHERE "stripePaymentIntent" IS NOT NULL
)
UPDATE "Payment" p
SET "stripePaymentIntent" = NULL
FROM pi_ranked r
WHERE p.id = r.id AND r.rn > 1;

CREATE UNIQUE INDEX "Payment_stripePaymentIntent_key"
ON "Payment" ("stripePaymentIntent");
