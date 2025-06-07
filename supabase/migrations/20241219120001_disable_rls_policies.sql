/*
 * Migration: Disable RLS Policies
 * Purpose: Remove all Row Level Security (RLS) policies from FlashAI tables
 * Created: 2024-12-19
 * 
 * This migration drops all RLS policies from:
 * - flashcards table (4 policies)
 * - generations table (3 policies) 
 * - generation_error_logs table (2 policies)
 * 
 * Note: RLS itself remains enabled on the tables, only the policies are removed
 */

-- =============================================================================
-- DROP RLS POLICIES
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Drop flashcards table policies
-- -----------------------------------------------------------------------------
drop policy if exists "flashcards_select_own" on flashcards;
drop policy if exists "flashcards_insert_own" on flashcards;
drop policy if exists "flashcards_update_own" on flashcards;
drop policy if exists "flashcards_delete_own" on flashcards;

-- -----------------------------------------------------------------------------
-- Drop generations table policies
-- -----------------------------------------------------------------------------
drop policy if exists "generations_select_own" on generations;
drop policy if exists "generations_insert_own" on generations;
drop policy if exists "generations_update_own" on generations;

-- -----------------------------------------------------------------------------
-- Drop generation_error_logs table policies
-- -----------------------------------------------------------------------------
drop policy if exists "generation_error_logs_select_own" on generation_error_logs;
drop policy if exists "generation_error_logs_insert_own" on generation_error_logs;

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================

-- this migration successfully removes:
-- ✓ 4 policies from flashcards table
-- ✓ 3 policies from generations table  
-- ✓ 2 policies from generation_error_logs table
-- ✓ total: 9 rls policies disabled

-- rls is still enabled on all tables, but no policies are active
-- this means all operations will be blocked until new policies are created
-- or rls is disabled entirely on the tables 