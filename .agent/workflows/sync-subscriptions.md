---
description: Manually sync Stripe subscriptions to Projects
---

1. Run the migration script to fetch all subscriptions from Stripe (including those from different Customer IDs with the same email) and create missing Projects.
// turbo
2. node scripts/manual-migrate.js
