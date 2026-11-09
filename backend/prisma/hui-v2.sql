-- Superseded: execute hui-v2-prepare.sql for initialization.
-- Execute hui-v2-cutover.sql only during the coordinated release after backups.
-- This guard prevents accidentally changing the live old app during development.
do $$ begin raise exception 'Migration split: run hui-v2-prepare.sql first; cutover is separate'; end $$;
