-- V32: Drop tables for removed features (Gym, Transactions/Expenses, Credentials, Goals)
-- These features were removed in refactor/remove-4-features branch.
-- Flyway tracks this as a new migration; existing migrations are untouched.

-- Goals (child tables first to respect FK constraints)
DROP TABLE IF EXISTS progress_trackers CASCADE;
DROP TABLE IF EXISTS goal_resources CASCADE;
DROP TABLE IF EXISTS goal_notes CASCADE;
DROP TABLE IF EXISTS sub_goals CASCADE;
DROP TABLE IF EXISTS goals CASCADE;

-- Credentials / Password Manager
DROP TABLE IF EXISTS credentials CASCADE;

-- Transactions / Expenses
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS budgets CASCADE;

-- Gym / Food Log
DROP TABLE IF EXISTS protein_intakes CASCADE;
DROP TABLE IF EXISTS protein_targets CASCADE;
DROP TABLE IF EXISTS food_log_items CASCADE;
DROP TABLE IF EXISTS custom_foods CASCADE;
DROP TABLE IF EXISTS gym_completions CASCADE;
DROP TABLE IF EXISTS workout_splits CASCADE;
