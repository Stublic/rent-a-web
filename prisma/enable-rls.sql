-- =============================================================================
-- Enable Row Level Security (RLS) on all public tables
-- 
-- CONTEXT:
-- - App uses Prisma (connects as postgres owner) → bypasses RLS automatically
-- - These tables should NOT be accessible via Supabase PostgREST API
-- - This script enables RLS and adds deny-all policies for anon/authenticated
-- =============================================================================

-- 1. Enable RLS on all tables
ALTER TABLE public."user" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."project" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."verification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."stripe_subscription" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."invoice" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."media" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."blog_post" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."blog_category" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."contact_submission" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."feedback" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."gemini_usage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."design_reference" ENABLE ROW LEVEL SECURITY;

-- 2. Force RLS even for table owners (extra safety, optional but recommended)
--    This ensures that even the postgres role must pass RLS policies
--    UNLESS using Prisma which connects with the connection string (bypasses).
--    NOTE: If you ever want Prisma to also be subject to RLS, uncomment these:
-- ALTER TABLE public."user" FORCE ROW LEVEL SECURITY;
-- ALTER TABLE public."project" FORCE ROW LEVEL SECURITY;
-- (etc.)

-- 3. No policies are added intentionally.
--    With RLS enabled and NO policies, the default behavior is DENY ALL
--    for non-owner roles (anon, authenticated). This means:
--    ✅ Prisma (postgres owner) can still read/write everything
--    ❌ Supabase anon/authenticated keys cannot access any data
--    This is exactly what we want since the app doesn't use Supabase client SDK.

-- =============================================================================
-- VERIFICATION: Run this after to confirm RLS is enabled on all tables
-- =============================================================================
-- SELECT schemaname, tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE schemaname = 'public';
