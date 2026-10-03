-- O2OL Token Prelaunch: free verified members have full Love Note category access.
-- Historical Basic/Premier/Exclusive rows remain valid for reconciliation.

ALTER TABLE public.love_note_category_preferences
  DROP CONSTRAINT IF EXISTS love_note_category_preferences_plan_check;

ALTER TABLE public.love_note_category_preferences
  ADD CONSTRAINT love_note_category_preferences_plan_check
  CHECK (plan = ANY (ARRAY['Free'::text,'Basic'::text,'Premier'::text,'Exclusive'::text]));

ALTER TABLE public.love_note_category_preferences
  DROP CONSTRAINT IF EXISTS love_note_category_preferences_plan_limit;

ALTER TABLE public.love_note_category_preferences
  ADD CONSTRAINT love_note_category_preferences_plan_limit
  CHECK (
    jsonb_array_length(categories) <=
    CASE plan
      WHEN 'Basic'::text THEN 6
      WHEN 'Premier'::text THEN 18
      ELSE 29
    END
  );
