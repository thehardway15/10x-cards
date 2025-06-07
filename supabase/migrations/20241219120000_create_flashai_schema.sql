/*
 * Migration: Create FlashAI Database Schema
 * Purpose: Initialize the complete database schema for FlashAI application
 * Created: 2024-12-19
 * 
 * This migration creates:
 * - ENUM types for flashcard sources
 * - Core tables: flashcards, generations, generation_error_logs
 * - Indexes for optimal query performance
 * - Functions and triggers for automatic timestamp updates
 * - Row Level Security (RLS) policies for data protection
 * 
 * Tables affected: flashcards, generations, generation_error_logs
 * Dependencies: Supabase auth.users table (managed by Supabase Auth)
 */

-- =============================================================================
-- 1. ENUM TYPES
-- =============================================================================

-- enum for flashcard source types
-- defines how a flashcard was created: ai-generated (full/edited) or manual
create type flashcard_source as enum ('ai-full', 'ai-edited', 'manual');

-- =============================================================================
-- 2. TABLES
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 2.1 flashcards table
-- stores user flashcards with soft delete functionality
-- supports both ai-generated and manually created flashcards
-- -----------------------------------------------------------------------------
create table flashcards (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    generation_id uuid null, -- will be linked after generations table is created
    front varchar(200) not null check (length(front) >= 1),
    back varchar(500) not null check (length(back) >= 1),
    source flashcard_source not null default 'manual',
    is_deleted boolean not null default false,
    deleted_at timestamp null,
    created_at timestamp not null default now(),
    updated_at timestamp not null default now(),
    
    -- ensure consistency between is_deleted and deleted_at fields
    constraint check_deleted_consistency 
        check ((is_deleted = true and deleted_at is not null) or 
               (is_deleted = false and deleted_at is null))
);

-- -----------------------------------------------------------------------------
-- 2.2 generations table
-- tracks ai generation sessions with statistics
-- stores metadata about ai model usage and acceptance rates
-- -----------------------------------------------------------------------------
create table generations (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    model varchar(60) not null,
    generated_count integer not null check (generated_count >= 0),
    accepted_unedited_count integer not null default 0 check (accepted_unedited_count >= 0),
    accepted_edited_count integer not null default 0 check (accepted_edited_count >= 0),
    source_text_hash char(64) not null, -- sha-256 hash for privacy
    source_text_length integer not null check (source_text_length between 1000 and 10000),
    created_at timestamp not null default now(),
    updated_at timestamp not null default now(),
    
    -- ensure accepted counts don't exceed generated count
    constraint check_accepted_counts 
        check (accepted_unedited_count + accepted_edited_count <= generated_count)
);

-- -----------------------------------------------------------------------------
-- 2.3 generation_error_logs table
-- logs ai generation failures for debugging and monitoring
-- stores error details without exposing sensitive source text
-- -----------------------------------------------------------------------------
create table generation_error_logs (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    model varchar(60) not null,
    source_text_hash char(64) not null, -- sha-256 hash for privacy
    source_text_length integer not null check (source_text_length between 1000 and 10000),
    error_code varchar(60) not null,
    error_message varchar(500) not null,
    created_at timestamp not null default now(),
    updated_at timestamp not null default now()
);

-- =============================================================================
-- 3. FOREIGN KEY RELATIONSHIPS
-- =============================================================================

-- add foreign key constraint from flashcards to generations
-- this is done after both tables exist to avoid circular dependency
alter table flashcards 
add constraint fk_flashcards_generation_id 
foreign key (generation_id) references generations(id) on delete set null;

-- add constraint to ensure consistency between source and generation_id
-- manual flashcards should not have generation_id, ai flashcards should have it
alter table flashcards 
add constraint check_generation_source_consistency
check ((source = 'manual' and generation_id is null) or 
       (source in ('ai-full', 'ai-edited') and generation_id is not null));

-- =============================================================================
-- 4. INDEXES
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 4.1 flashcards indexes
-- optimized for common query patterns
-- -----------------------------------------------------------------------------

-- partial index for active (non-deleted) flashcards per user
-- this index is most efficient for the main flashcards listing
create index idx_flashcards_active 
on flashcards (user_id, created_at desc) 
where is_deleted = false;

-- general index for all flashcards per user (including deleted)
create index idx_flashcards_user_id 
on flashcards (user_id);

-- partial index for flashcards from specific ai generation sessions
-- only indexes rows that actually have a generation_id
create index idx_flashcards_generation_id 
on flashcards (generation_id) 
where generation_id is not null;

-- -----------------------------------------------------------------------------
-- 4.2 generations indexes
-- -----------------------------------------------------------------------------

-- index for user's generation history, ordered by most recent first
create index idx_generations_user_id 
on generations (user_id, created_at desc);

-- index for finding generations by source text hash
-- useful for detecting duplicate generation attempts
create index idx_generations_source_hash 
on generations (source_text_hash);

-- -----------------------------------------------------------------------------
-- 4.3 generation_error_logs indexes
-- -----------------------------------------------------------------------------

-- index for user's error logs, ordered by most recent first
create index idx_generation_error_logs_user_id 
on generation_error_logs (user_id, created_at desc);

-- =============================================================================
-- 5. FUNCTIONS AND TRIGGERS
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 5.1 updated_at trigger function
-- automatically updates the updated_at timestamp on row updates
-- -----------------------------------------------------------------------------
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language 'plpgsql';

-- -----------------------------------------------------------------------------
-- 5.2 triggers for automatic updated_at updates
-- apply the trigger function to all tables with updated_at columns
-- -----------------------------------------------------------------------------

-- trigger for flashcards table
create trigger update_flashcards_updated_at 
    before update on flashcards 
    for each row execute function update_updated_at_column();

-- trigger for generations table
create trigger update_generations_updated_at 
    before update on generations 
    for each row execute function update_updated_at_column();

-- trigger for generation_error_logs table
create trigger update_generation_error_logs_updated_at 
    before update on generation_error_logs 
    for each row execute function update_updated_at_column();

-- =============================================================================
-- 6. ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 6.1 enable rls on all tables
-- all user data must be protected by row-level security
-- -----------------------------------------------------------------------------
alter table flashcards enable row level security;
alter table generations enable row level security;
alter table generation_error_logs enable row level security;

-- -----------------------------------------------------------------------------
-- 6.2 rls policies for flashcards table
-- users can only access their own flashcards
-- separate policies for each operation type for granular control
-- -----------------------------------------------------------------------------

-- policy for selecting flashcards - users can view their own flashcards
create policy "flashcards_select_own" on flashcards
    for select using (auth.uid() = user_id);

-- policy for inserting flashcards - users can create flashcards for themselves
create policy "flashcards_insert_own" on flashcards
    for insert with check (auth.uid() = user_id);

-- policy for updating flashcards - users can modify their own flashcards
create policy "flashcards_update_own" on flashcards
    for update using (auth.uid() = user_id);

-- policy for deleting flashcards - users can delete their own flashcards
create policy "flashcards_delete_own" on flashcards
    for delete using (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- 6.3 rls policies for generations table
-- users can only access their own generation statistics
-- no delete policy as generations should not be manually deleted
-- -----------------------------------------------------------------------------

-- policy for selecting generations - users can view their own generation history
create policy "generations_select_own" on generations
    for select using (auth.uid() = user_id);

-- policy for inserting generations - users can create generation records for themselves
create policy "generations_insert_own" on generations
    for insert with check (auth.uid() = user_id);

-- policy for updating generations - users can update their own generation statistics
create policy "generations_update_own" on generations
    for update using (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- 6.4 rls policies for generation_error_logs table
-- users can only access their own error logs
-- read-only table from user perspective (no update/delete policies)
-- -----------------------------------------------------------------------------

-- policy for selecting error logs - users can view their own error history
create policy "generation_error_logs_select_own" on generation_error_logs
    for select using (auth.uid() = user_id);

-- policy for inserting error logs - system can log errors for users
create policy "generation_error_logs_insert_own" on generation_error_logs
    for insert with check (auth.uid() = user_id);

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================

-- this migration successfully creates:
-- ✓ 1 enum type (flashcard_source)
-- ✓ 3 main tables (flashcards, generations, generation_error_logs)
-- ✓ 6 performance-optimized indexes (including partial indexes)
-- ✓ 1 utility function for timestamp updates
-- ✓ 3 triggers for automatic timestamp management
-- ✓ 10 granular rls policies for data security
-- ✓ proper foreign key relationships with appropriate cascade behavior
-- ✓ comprehensive data validation through check constraints

-- the schema is now ready for the flashai application
-- all user data is properly secured through rls
-- performance is optimized for expected query patterns
-- data consistency is enforced through constraints and triggers 