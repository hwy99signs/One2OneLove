-- What Should They Do? social voting game
-- Prepared/tested on an isolated Neon branch before production application.

CREATE TABLE IF NOT EXISTS public.wstd_questions (
  id bigserial PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  prompt text NOT NULL,
  scenario text NOT NULL,
  category text NOT NULL DEFAULT 'relationships',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('draft','active','archived')),
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.wstd_options (
  id bigserial PRIMARY KEY,
  question_id bigint NOT NULL REFERENCES public.wstd_questions(id) ON DELETE CASCADE,
  option_key text NOT NULL,
  label text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(question_id, option_key)
);

CREATE TABLE IF NOT EXISTS public.wstd_votes (
  id bigserial PRIMARY KEY,
  question_id bigint NOT NULL REFERENCES public.wstd_questions(id) ON DELETE CASCADE,
  option_id bigint NOT NULL REFERENCES public.wstd_options(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  voter_key text NOT NULL,
  country_code char(2) NOT NULL DEFAULT 'ZZ',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(question_id, voter_key)
);

CREATE INDEX IF NOT EXISTS idx_wstd_questions_active_order ON public.wstd_questions(status, sort_order, id);
CREATE INDEX IF NOT EXISTS idx_wstd_votes_question_country ON public.wstd_votes(question_id, country_code);
CREATE INDEX IF NOT EXISTS idx_wstd_votes_question_option ON public.wstd_votes(question_id, option_id);

INSERT INTO public.wstd_questions (slug, prompt, scenario, category, status, sort_order) VALUES
('late-night-ex-texts', 'What should they do?', 'Your partner’s ex keeps texting late at night. Your partner says it is harmless, but it is making you uncomfortable.', 'boundaries', 'active', 10),
('move-in-timing', 'What should they do?', 'One person is ready to move in together now. The other wants to wait another six months before sharing a home.', 'commitment', 'active', 20),
('family-disrespect', 'What should they do?', 'Your partner’s family repeatedly makes disrespectful comments about you, and your partner usually stays quiet to avoid conflict.', 'family', 'active', 30),
('money-secret', 'What should they do?', 'One partner discovers the other has been hiding a large credit-card balance because they were embarrassed to talk about it.', 'money', 'active', 40),
('phone-privacy', 'What should they do?', 'A partner asks to see the other person’s phone after noticing secretive behavior. The other partner says that crosses a privacy boundary.', 'trust', 'active', 50),
('career-relocation', 'What should they do?', 'One partner receives a major career opportunity in another state, but accepting it would mean relocating the relationship.', 'life-decisions', 'active', 60),
('wedding-budget', 'What should they do?', 'They want to get married, but one person wants a large wedding and the other wants to use most of the money toward a home.', 'money', 'active', 70),
('friendship-boundary', 'What should they do?', 'One partner has a very close friendship with someone the other partner believes is crossing emotional boundaries.', 'boundaries', 'active', 80)
ON CONFLICT (slug) DO UPDATE SET
  prompt = EXCLUDED.prompt,
  scenario = EXCLUDED.scenario,
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

WITH option_seed(slug, option_key, label, sort_order) AS (VALUES
('late-night-ex-texts','boundary','Set a clear boundary together',10),
('late-night-ex-texts','trust','Trust the partner and leave it alone',20),
('late-night-ex-texts','block','Ask the ex to be blocked',30),
('late-night-ex-texts','rethink','Reconsider the relationship',40),
('move-in-timing','wait','Wait the six months',10),
('move-in-timing','date','Agree on a firm middle-ground date',20),
('move-in-timing','now','Move in now and work through concerns',30),
('move-in-timing','reassess','Reassess whether they want the same future',40),
('family-disrespect','partner','The partner should address the family directly',10),
('family-disrespect','together','They should address the family together',20),
('family-disrespect','distance','Create distance from the family',30),
('family-disrespect','ignore','Ignore the comments to keep the peace',40),
('money-secret','plan','Disclose everything and make a repayment plan together',10),
('money-secret','separate','Keep finances separate until trust is rebuilt',20),
('money-secret','counsel','Get professional financial counseling',30),
('money-secret','leave','End the relationship over the secrecy',40),
('phone-privacy','show','Show the phone this one time',10),
('phone-privacy','talk','Talk through the suspicious behavior without a phone search',20),
('phone-privacy','open-policy','Agree on an open-phone policy going forward',30),
('phone-privacy','privacy','Keep phones private and require trust',40),
('career-relocation','move','Relocate together',10),
('career-relocation','distance','Try long-distance for a set period',20),
('career-relocation','decline','Decline the opportunity for the relationship',30),
('career-relocation','separate','Separate if neither person can compromise',40),
('wedding-budget','small','Have a smaller wedding and prioritize the home',10),
('wedding-budget','wedding','Have the large wedding they want',20),
('wedding-budget','split','Set a hard budget and split the remaining money toward a home',30),
('wedding-budget','delay','Delay the wedding until they can afford both goals',40),
('friendship-boundary','boundaries','Set mutually agreed friendship boundaries',10),
('friendship-boundary','end-friendship','End the friendship',20),
('friendship-boundary','trust','Trust the partner and make no changes',30),
('friendship-boundary','counsel','Discuss the issue with a neutral counselor',40)
)
INSERT INTO public.wstd_options(question_id, option_key, label, sort_order)
SELECT q.id, s.option_key, s.label, s.sort_order
FROM option_seed s
JOIN public.wstd_questions q ON q.slug=s.slug
ON CONFLICT(question_id, option_key) DO UPDATE SET label=EXCLUDED.label, sort_order=EXCLUDED.sort_order;
