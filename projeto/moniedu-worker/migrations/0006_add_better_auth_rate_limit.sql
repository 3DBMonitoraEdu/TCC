-- Better Auth needs this table when rateLimit.storage is set to "database".
CREATE TABLE IF NOT EXISTS "rateLimit" (
	"id" TEXT NOT NULL PRIMARY KEY,
	"key" TEXT NOT NULL UNIQUE,
	"count" INTEGER NOT NULL,
	"lastRequest" INTEGER NOT NULL
);

-- Better Auth 1.7 identifies accounts by issuer + accountId.
ALTER TABLE "account"
	ADD COLUMN "issuer" TEXT NOT NULL DEFAULT 'local:credential';

CREATE UNIQUE INDEX IF NOT EXISTS "account_issuer_accountId_uidx"
	ON "account" ("issuer", "accountId");
