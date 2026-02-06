-- CreateTable
CREATE TABLE "stripe_subscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "stripeCustomerId" TEXT NOT NULL,
    "planName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "stripe_subscription_email_key" ON "stripe_subscription"("email");

-- CreateIndex
CREATE UNIQUE INDEX "stripe_subscription_stripeCustomerId_key" ON "stripe_subscription"("stripeCustomerId");
