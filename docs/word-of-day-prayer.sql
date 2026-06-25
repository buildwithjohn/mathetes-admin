-- Word of the Day: optional "Prayer guide" (markdown). Run in the SQL editor.
-- Shared column — mobile shows it as a "Pray" block under the reflection.
-- Additive and safe.

alter table public.word_of_day
  add column if not exists prayer_md text;

-- If the `todays_word_of_day` view uses an explicit column list (not select *),
-- the backend must add `prayer_md` to that view too so mobile receives it.
