-- ============================================================
-- AI Marketing Agent: Supabase research board demo
--
-- Paste this whole file into Supabase > SQL Editor and click Run.
-- It is safe to re-run: it only drops and recreates this demo's
-- own tables, so teammates' tables (videos, entries, ...) are untouched.
-- ============================================================

drop view  if exists niche_format_stats;
drop table if exists research_board;
drop table if exists short_analyses;
drop table if exists shorts;
drop table if exists creators;


-- ------------------------------------------------------------
-- 1. Tables
-- ------------------------------------------------------------

-- A creator using the app. Each picks one of the four niches.
create table creators (
  id           bigint generated always as identity primary key,
  handle       text not null unique,
  display_name text not null,
  niche        text not null check (niche in ('gaming', 'fitness', 'education', 'food')),
  created_at   timestamptz not null default now()
);

-- A YouTube Short collected by the YouTube API / scraper.
-- id is the YouTube video ID, so the same Short is never stored twice.
create table shorts (
  id               text primary key,
  title            text not null,
  channel          text not null,
  niche            text not null check (niche in ('gaming', 'fitness', 'education', 'food')),
  duration_seconds integer not null check (duration_seconds between 1 and 180),
  views            bigint check (views >= 0),
  published_at     timestamptz not null,
  -- YouTube's API policies allow storing statistics for at most 30 days,
  -- so we record when each row was fetched.
  fetched_at       timestamptz not null default now()
);

-- The AI feature data from US59 (Gemini's analysis of a Short).
-- Common fields get their own columns so they can be filtered and grouped;
-- the full result is kept as JSON.
create table short_analyses (
  id             bigint generated always as identity primary key,
  short_id       text not null unique references shorts (id) on delete cascade,
  model          text not null,
  hook           text not null,
  format         text not null,
  pacing         text not null check (pacing in ('slow', 'medium', 'fast')),
  estimated_cuts integer not null check (estimated_cuts >= 0),
  features       jsonb not null,
  analyzed_at    timestamptz not null default now()
);

-- Shorts a creator saved to study later, with their own note.
create table research_board (
  creator_id bigint not null references creators (id) on delete cascade,
  short_id   text   not null references shorts (id) on delete cascade,
  note       text   not null default '',
  saved_at   timestamptz not null default now(),
  primary key (creator_id, short_id)
);

create index shorts_niche_idx on shorts (niche);


-- ------------------------------------------------------------
-- 2. Market research view: what formats are working in each niche
--    (built from our own AI analyses, grouped by niche and format)
-- ------------------------------------------------------------

create view niche_format_stats
with (security_invoker = true)
as
select
  s.niche,
  a.format,
  count(*)::int                                  as shorts_analyzed,
  round(avg(a.estimated_cuts), 1)::float         as avg_cuts,
  round(avg(s.duration_seconds))::int            as avg_seconds,
  mode() within group (order by a.pacing)        as typical_pacing
from shorts s
join short_analyses a on a.short_id = s.id
group by s.niche, a.format;


-- ------------------------------------------------------------
-- 3. Security: Row Level Security on every table
--
-- With RLS on and no policies, the publishable (browser) key can't
-- read or write anything. Only our Next.js server, using the secret
-- key, can reach this data.
-- ------------------------------------------------------------

alter table creators       enable row level security;
alter table shorts         enable row level security;
alter table short_analyses enable row level security;
alter table research_board enable row level security;

revoke all on creators, shorts, short_analyses, research_board, niche_format_stats
  from anon, authenticated;


-- ------------------------------------------------------------
-- 4. Sample data (fictional channels; "demo" IDs, not real videos)
-- ------------------------------------------------------------

insert into creators (handle, display_name, niche) values
  ('@fitwithmaya',  'Maya Torres',   'fitness'),
  ('@pixelpete',    'Pete Nguyen',   'gaming'),
  ('@studysnacks',  'Ava Brooks',    'education'),
  ('@weeknightwok', 'Sam Okafor',    'food');

insert into shorts (id, title, channel, niche, duration_seconds, views, published_at) values
  ('demoFit0001', '3 Moves for Stronger Knees',            'Coach Lina',      'fitness',   34, 1840000, now() - interval '4 days'),
  ('demoFit0002', 'Stop Doing Crunches Like This',         'Lift Lab',        'fitness',   28, 2310000, now() - interval '9 days'),
  ('demoFit0003', 'My 5AM Gym Routine (Realistic)',        'Morning Reps',    'fitness',   58,  640000, now() - interval '2 days'),
  ('demoGam0001', 'This Speedrun Trick Saves 40 Seconds',  'FrameSkip',       'gaming',    47, 3120000, now() - interval '6 days'),
  ('demoGam0002', 'Rating Every Starter Weapon',           'Loot Goblin',     'gaming',    59, 1150000, now() - interval '11 days'),
  ('demoGam0003', 'When the Boss Has One HP Left',         'Clutch Clips',    'gaming',    21, 4480000, now() - interval '3 days'),
  ('demoEdu0001', 'Why the Sky Is Blue in 30 Seconds',     'Quick Science',   'education', 31, 2050000, now() - interval '5 days'),
  ('demoEdu0002', 'The Easiest Way to Remember Logs',      'Math Minute',     'education', 44,  870000, now() - interval '8 days'),
  ('demoEdu0003', 'History''s Shortest War',               'Past Tense',      'education', 52, 1390000, now() - interval '13 days'),
  ('demoFod0001', '15-Minute Garlic Noodles',              'Weeknight Eats',  'food',      39, 2760000, now() - interval '2 days'),
  ('demoFod0002', 'Crispy Rice Salad Hack',                'Pan & Plate',     'food',      26, 1610000, now() - interval '7 days'),
  ('demoFod0003', 'Rating Viral Pasta Recipes',            'Taste Test Tom',  'food',      57,  930000, now() - interval '10 days'),
  ('demoFit0004', 'Deadlift Mistake Everyone Makes',       'Lift Lab',        'fitness',   24, 1980000, now() - interval '6 days'),
  ('demoFit0005', 'Mobility Flow for Desk Workers',        'Coach Lina',      'fitness',   45,  720000, now() - interval '12 days'),
  ('demoGam0004', 'Pixel-Perfect Jump Nobody Knew About',  'FrameSkip',       'gaming',    38, 1760000, now() - interval '8 days'),
  ('demoGam0005', 'Comeback of the Year',                  'Clutch Clips',    'gaming',    18, 2930000, now() - interval '1 day'),
  ('demoEdu0004', 'How Do Planes Actually Fly?',           'Quick Science',   'education', 41, 1520000, now() - interval '4 days'),
  ('demoEdu0005', 'Why We Have Leap Years',                'Quick Science',   'education', 36,  980000, now() - interval '9 days'),
  ('demoFod0004', 'One-Pan Lemon Chicken',                 'Weeknight Eats',  'food',      48, 1240000, now() - interval '5 days'),
  ('demoFod0005', '3-Ingredient Banana Pancakes',          'Pan & Plate',     'food',      22, 2180000, now() - interval '3 days');

insert into short_analyses (short_id, model, hook, format, pacing, estimated_cuts, features) values
  ('demoFit0001', 'gemini-3.8-flash', 'Creator points at her knee and says "If your knees hurt on stairs, do these three."',
   'workout demo', 'medium', 6,
   '{"summary": "A coach demonstrates three knee-strengthening exercises with form cues.", "onScreenText": ["Knee pain on stairs?", "1. Step-downs", "2. Wall sits", "3. Terminal knee extensions"], "callToAction": "Save this for leg day", "takeaways": ["Open with a relatable pain point", "Number each move on screen"]}'),
  ('demoFit0002', 'gemini-3.8-flash', 'Shows a crunch with a red X over it and a buzzer sound.',
   'myth busting', 'fast', 11,
   '{"summary": "A trainer corrects a common crunch mistake and shows a safer alternative.", "onScreenText": ["WRONG", "RIGHT", "Ribs to hips, not chin to chest"], "callToAction": "Follow for more form fixes", "takeaways": ["Show the mistake first", "Use bold WRONG/RIGHT labels"]}'),
  ('demoFit0003', 'gemini-3.8-flash', 'Alarm clock rings at 4:59 with the text "be honest".',
   'day in the life', 'fast', 18,
   '{"summary": "A creator films a quick, honest morning gym routine from alarm to cooldown.", "onScreenText": ["4:59 AM", "be honest", "pre-workout?"], "callToAction": "", "takeaways": ["Timestamps on screen keep the story moving", "Self-aware humor builds trust"]}'),
  ('demoGam0001', 'gemini-3.8-flash', 'Split screen of a normal route vs. the shortcut with a timer running.',
   'tutorial', 'fast', 9,
   '{"summary": "A speedrunner explains a movement trick that skips part of a level.", "onScreenText": ["-40 seconds", "Jump on frame 3"], "callToAction": "Try it and comment your time", "takeaways": ["Split-screen comparison proves the payoff", "Put the result in the first frame"]}'),
  ('demoGam0002', 'gemini-3.8-flash', '"I rated every starter weapon so you don''t have to" over a tier list.',
   'tier list', 'medium', 14,
   '{"summary": "A creator ranks starter weapons on a tier list with short explanations.", "onScreenText": ["S", "A", "B", "C", "F"], "callToAction": "Comment your pick", "takeaways": ["Tier lists invite debate in comments", "Promise to save the viewer time"]}'),
  ('demoGam0003', 'gemini-3.8-flash', 'Health bar zooms in on "1 HP" with a heartbeat sound.',
   'highlight clip', 'fast', 7,
   '{"summary": "A tense boss fight ends with a last-second win.", "onScreenText": ["1 HP"], "callToAction": "", "takeaways": ["Start at the moment of highest tension", "Sound design carries short clips"]}'),
  ('demoEdu0001', 'gemini-3.8-flash', 'Asks "Why isn''t the sky purple?" while pointing up.',
   'explainer', 'medium', 8,
   '{"summary": "A quick explanation of Rayleigh scattering with simple graphics.", "onScreenText": ["Rayleigh scattering", "Blue scatters most"], "callToAction": "Follow for a new fact every day", "takeaways": ["Open with a question the viewer cannot answer", "One idea per Short"]}'),
  ('demoEdu0002', 'gemini-3.8-flash', 'Whiteboard shows "log₂ 8 = ?" with a countdown.',
   'tutorial', 'medium', 5,
   '{"summary": "A teacher shows a memory trick for logarithms using a worked example.", "onScreenText": ["log₂ 8 = ?", "2 to the what = 8?"], "callToAction": "Save before your exam", "takeaways": ["Give viewers a quick challenge", "Tie the payoff to a real need (exams)"]}'),
  ('demoEdu0003', 'gemini-3.8-flash', '"This war lasted 38 minutes" over a map zooming in.',
   'storytelling', 'medium', 10,
   '{"summary": "A narrated story of the Anglo-Zanzibar War using maps and archival images.", "onScreenText": ["38 minutes", "1896"], "callToAction": "", "takeaways": ["Lead with a surprising number", "Maps make history visual"]}'),
  ('demoFod0001', 'gemini-3.8-flash', 'Noodles lifted out of the pan with "15 minutes" on screen.',
   'recipe', 'fast', 16,
   '{"summary": "A fast overhead recipe for garlic noodles with ingredient callouts.", "onScreenText": ["15 minutes", "6 cloves garlic", "butter + oyster sauce"], "callToAction": "Save this recipe", "takeaways": ["Show the finished dish first", "Overlay ingredients as they are added"]}'),
  ('demoFod0002', 'gemini-3.8-flash', 'Crunch sound as a spoon breaks the crispy rice.',
   'recipe', 'fast', 12,
   '{"summary": "A crispy rice salad made from leftover rice in an air fryer.", "onScreenText": ["leftover rice?", "air fry 12 min"], "callToAction": "Follow for leftover hacks", "takeaways": ["ASMR sound grabs attention", "Frame it as a hack for something viewers already have"]}'),
  ('demoFod0003', 'gemini-3.8-flash', 'Three viral pastas side by side with "which one wins?".',
   'review', 'medium', 13,
   '{"summary": "A creator cooks and rates three viral pasta recipes.", "onScreenText": ["which one wins?", "7/10", "9/10", "4/10"], "callToAction": "Comment the next recipe to test", "takeaways": ["Ratings give a reason to watch to the end", "Ask for the next video idea"]}'),
  ('demoFit0004', 'gemini-3.8-flash', 'Rounded back on a deadlift freezes with a red circle and "ouch".',
   'myth busting', 'fast', 10,
   '{"summary": "A trainer shows a common deadlift form error and how to fix it.", "onScreenText": ["ouch", "hips back", "bar close"], "callToAction": "Send this to your gym buddy", "takeaways": ["Freeze-frame the mistake", "Short cue words on screen"]}'),
  ('demoFit0005', 'gemini-3.8-flash', '"Sitting all day? Do this." over a person stretching at a desk.',
   'workout demo', 'slow', 5,
   '{"summary": "A guided mobility routine that can be done next to a desk.", "onScreenText": ["Sitting all day?", "30 sec each"], "callToAction": "Save and do it at lunch", "takeaways": ["Name the exact audience in the hook", "Calm pacing fits recovery content"]}'),
  ('demoGam0004', 'gemini-3.8-flash', 'Slow-motion replay of a jump with "nobody knew this" text.',
   'tutorial', 'fast', 8,
   '{"summary": "A player shows a hidden precise jump and the input timing for it.", "onScreenText": ["nobody knew this", "hold for 2 frames"], "callToAction": "Comment if you already knew", "takeaways": ["Slow-motion replays teach timing", "Curiosity gap in the hook"]}'),
  ('demoGam0005', 'gemini-3.8-flash', 'Score shows 0-3 and the camera shakes as the comeback starts.',
   'highlight clip', 'fast', 6,
   '{"summary": "A team comes back from a three-round deficit to win.", "onScreenText": ["0-3", "4-3"], "callToAction": "", "takeaways": ["Show the stakes in the first frame", "Let the payoff land at the end"]}'),
  ('demoEdu0004', 'gemini-3.8-flash', 'Paper airplane flies past the camera: "It''s not what your teacher said."',
   'explainer', 'medium', 9,
   '{"summary": "An explanation of lift that corrects a common textbook myth.", "onScreenText": ["Bernoulli?", "Newton''s 3rd law", "both!"], "callToAction": "Follow for more myths", "takeaways": ["Challenge something viewers were taught", "Use a simple prop"]}'),
  ('demoEdu0005', 'gemini-3.8-flash', 'Calendar flips to Feb 29: "This day almost didn''t exist."',
   'explainer', 'medium', 7,
   '{"summary": "Why the calendar adds a day every four years, with simple graphics.", "onScreenText": ["365.24 days", "+1 day every 4 years"], "callToAction": "", "takeaways": ["Hook with a dramatic claim", "One number explains the whole idea"]}'),
  ('demoFod0004', 'gemini-3.8-flash', 'Sizzling chicken in a pan with "one pan, zero mess".',
   'recipe', 'medium', 11,
   '{"summary": "A one-pan lemon chicken dinner with step-by-step overlays.", "onScreenText": ["one pan, zero mess", "400°F for 25 min"], "callToAction": "Save for a busy night", "takeaways": ["Promise convenience up front", "Put temperatures and times on screen"]}'),
  ('demoFod0005', 'gemini-3.8-flash', 'Hand holds up three ingredients: "That''s it."',
   'recipe', 'fast', 9,
   '{"summary": "Banana pancakes made from three ingredients in under five minutes.", "onScreenText": ["That''s it.", "banana + eggs + oats"], "callToAction": "Follow for 3-ingredient recipes", "takeaways": ["Show how few ingredients are needed", "Fast cuts match a quick recipe"]}');

insert into research_board (creator_id, short_id, note)
select c.id, s.short_id, s.note
from creators c
join (values
  ('@fitwithmaya', 'demoFit0002', 'Try a WRONG/RIGHT format for my squat video'),
  ('@fitwithmaya', 'demoFit0001', 'Numbered moves on screen'),
  ('@pixelpete',   'demoGam0003', 'Start clips at the tensest moment')
) as s (handle, short_id, note) on s.handle = c.handle;
