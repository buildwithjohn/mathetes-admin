-- Mathetes day-one content seed (CCCFSP FUOYE)
-- Paste into the Supabase SQL editor. Idempotent: safe to run more than once.
-- Resolves the parish and a pastor/admin author dynamically, so no UUIDs are
-- hard-coded. Adjust the copy/date as needed before running.

do $$
declare
  p_id   uuid;
  author uuid;
  today  date := current_date;     -- seeds for "today"; change if back-dating
  plan   uuid;
begin
  -- Pilot parish + an author to attribute content to.
  select id into p_id from parishes order by created_at limit 1;
  if p_id is null then
    raise exception 'No parish found; create the parish first.';
  end if;

  select id into author
  from user_profiles
  where parish_id = p_id and role in ('pastor', 'admin')
  order by case role when 'pastor' then 0 else 1 end
  limit 1;

  ----------------------------------------------------------------------------
  -- 1. Word of the Day (one per parish per day)
  ----------------------------------------------------------------------------
  insert into word_of_day
    (parish_id, verse_ref, verse_text, reflection_md, prompt,
     author_id, publish_date, status)
  values
    (p_id,
     'Lamentations 3:22-23',
     'It is of the LORD''S mercies that we are not consumed, because his compassions fail not. They are new every morning: great is thy faithfulness.',
     E'His mercy is not a finite reserve we draw down. It is **new every morning**, replenished before we wake. Whatever yesterday held, today begins with a fresh supply of grace.\n\nReceive it, and walk into the day unafraid.',
     'Where do you need fresh mercy this morning?',
     author, today, 'published')
  on conflict (parish_id, publish_date) where publish_date is not null
  do nothing;

  ----------------------------------------------------------------------------
  -- 2. Devotional (one per parish per day)
  ----------------------------------------------------------------------------
  insert into devotionals
    (parish_id, title, body_md, scripture_refs, reading_time_minutes,
     author_id, publish_date, status)
  values
    (p_id,
     'Great Is Thy Faithfulness',
     E'## New every morning\n\nJeremiah wrote Lamentations over a city in ruins. And yet, in the middle of the grief, he turns a corner: "It is of the LORD''S mercies that we are not consumed."\n\nFaithfulness is not the absence of hard seasons. It is the steadiness of God *through* them. His compassion does not run dry because ours does.\n\n> Great is thy faithfulness. (Lamentations 3:23)\n\nBegin today by counting one mercy you did not earn. Then ask for grace to extend the same to someone else.',
     array['Lamentations 3:22-23', 'Psalm 90:14'],
     4, author, today, 'published')
  on conflict (parish_id, publish_date) where publish_date is not null
  do nothing;

  ----------------------------------------------------------------------------
  -- 3. Announcement (guarded by title so reruns do not duplicate)
  ----------------------------------------------------------------------------
  insert into announcements
    (parish_id, title, body_md, banner, status, publish_date, posted_at, posted_by)
  select
    p_id,
    'Welcome to Mathetes',
    E'We are glad you are here. Open the app each morning for the Word of the Day, a short devotional, and your house chat.\n\nMidweek service holds **Wednesday at 5pm**. Bring someone with you.',
    null, 'published', today, now(), author
  where not exists (
    select 1 from announcements
    where parish_id = p_id and title = 'Welcome to Mathetes'
  );

  ----------------------------------------------------------------------------
  -- 4. A published reading plan with 3 days
  ----------------------------------------------------------------------------
  insert into reading_plans
    (parish_id, slug, title, description, length_days, difficulty,
     author_id, sequence_locked, published, published_at)
  values
    (p_id, 'foundations-of-faith', 'Foundations of Faith',
     'A three-day start into the heart of the gospel: grace, faith, and walking it out.',
     3, 'starter', author, false, true, now())
  on conflict (parish_id, slug) do nothing;

  select id into plan
  from reading_plans
  where parish_id = p_id and slug = 'foundations-of-faith';

  insert into reading_plan_days
    (plan_id, day_number, title, scripture_reference, reflection_body, reflection_prompt)
  values
    (plan, 1, 'Saved by Grace',
     'Ephesians 2:8-9',
     E'Salvation is a gift, not a wage. "By grace are ye saved through faith; and that not of yourselves." You cannot earn what has already been given. Today, simply receive it.',
     'What are you still trying to earn that God has already given?'),
    (plan, 2, 'The Life of Faith',
     'Hebrews 11:1-6',
     E'"Faith is the substance of things hoped for, the evidence of things not seen." Faith is not wishful thinking. It is confidence rooted in the character of God. Name one promise you are standing on.',
     'Where is God asking you to trust him beyond what you can see?'),
    (plan, 3, 'Walking It Out',
     'James 1:22-25',
     E'"Be ye doers of the word, and not hearers only." Faith that stays in the head deceives us. The blessing is in the doing. Choose one thing you have read this week and act on it today.',
     'What is one concrete step you will take on what you have learned?')
  on conflict (plan_id, day_number) do nothing;

  ----------------------------------------------------------------------------
  -- 5. Confirm four active giving funds (migration 0023 seeds these; this
  --    only guarantees they exist and are active).
  ----------------------------------------------------------------------------
  insert into giving_funds (parish_id, slug, name, description, active, sort_order)
  values
    (p_id, 'tithe',    'Tithe',         'Your regular tithe to the parish.',      true, 1),
    (p_id, 'offering', 'Offering',      'General offering.',                      true, 2),
    (p_id, 'building', 'Building Fund', 'Toward the parish building project.',    true, 3),
    (p_id, 'missions', 'Missions',      'Supporting campus and field missions.',  true, 4)
  on conflict (parish_id, slug) do update set active = true;

  raise notice 'Day-one seed complete for parish %.', p_id;
end $$;
