// Certification-sweep exclusion (owner-directed fix, 2026-10-09).
//
// GPT's post-deploy certification laps crawl a fixed route list as fresh
// anonymous one-page visitors — including Privacy/Terms in all five
// languages and a deliberate canary page, /this-page-does-not-exist, that
// only the checker ever requests. Those laps were inflating the Admin
// dashboard's visitor counts (the non-English language rows rose in
// exact lockstep, +2 per lap per language, views == visitors, 0 clicks).
//
// Dashboard queries exclude an event when BOTH hold:
//   (a) its visitor matches the lap profile — anonymous, single session,
//       at most 4 events, all within +/-4 minutes of a canary hit; and
//   (b) the event itself falls inside such a window.
// Visitors outside lap windows are never touched. A real visitor who
// does almost nothing during the exact minutes of a lap can be swept
// into the exclusion, so the dashboard shows the excluded count openly
// instead of adjusting silently.
export const SWEEP_CTES = `
  sweep_marks AS (
    SELECT created_at AS marked_at
      FROM public.interaction_events
     WHERE route = '/this-page-does-not-exist' AND event_type = 'page_view'
  ),
  sweep_visitors AS (
    SELECT s.visitor_id
      FROM public.interaction_events s
     WHERE s.user_id IS NULL
       AND EXISTS (SELECT 1 FROM sweep_marks m
                    WHERE s.created_at BETWEEN m.marked_at - interval '4 minutes'
                                           AND m.marked_at + interval '4 minutes')
     GROUP BY s.visitor_id
    HAVING count(*) <= 4 AND count(DISTINCT s.session_id) <= 1
  )`;

export const SWEEP_EVENT_FILTER = `
       AND NOT (
         e.user_id IS NULL
         AND e.visitor_id IN (SELECT visitor_id FROM sweep_visitors)
         AND EXISTS (SELECT 1 FROM sweep_marks m
                      WHERE e.created_at BETWEEN m.marked_at - interval '4 minutes'
                                             AND m.marked_at + interval '4 minutes')
       )`;
