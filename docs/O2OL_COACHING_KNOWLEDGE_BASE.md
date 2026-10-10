# One2OneLove Coaching Knowledge Base
## Authoritative Build Specification — 2026-10-10

### Purpose
Create a curated, auditable relationship-coaching knowledge layer for One2OneLove that grounds Bianca and Amora in consistent O2OL-approved guidance instead of relying only on general model knowledge.

### Product positioning
Bianca and Amora provide:
- General relationship coaching and reflection
- Communication guidance
- Dating and marriage support
- Conflict and repair guidance
- Healthy-boundary education
- Relationship-pattern reflection
- Practical, non-clinical support

They do **not** provide:
- Therapy or diagnosis
- Medical advice
- Legal advice
- Crisis services
- Guaranteed compatibility outcomes
- Instructions that normalize coercion, surveillance, intimidation, abuse, or manipulation

### Coach roles
**Bianca**
- MyMatchIQ relationship guide
- Uses member conversation history
- Uses MyMatchIQ/personality/assessment context where available
- Learns recurring member phrases for natural conversational personalization
- Produces deeper formal reports separately from ordinary chat
- Should combine user context + knowledge-base grounding + MyMatchIQ context

**Amora**
- One2OneLove relationship coach
- Uses member conversation history
- Provides practical coaching, reflection, communication guidance, and healthy-boundary support
- Should combine user context + knowledge-base grounding
- Should remain warm, natural, conversational, and non-clinical

### Response-length pricing contract
Both Bianca and Amora use member-selected response lengths:
- Short: 50–100 words — $0.10
- Medium: 150–250 words — $0.15
- Long: 300–400 words — $0.20

Default: Short.

Safety-critical situations may exceed the selected word range when needed to protect the member.

### Knowledge-base source hierarchy
Use sources in this order:
1. O2OL Safety Standard
2. O2OL approved coaching standards
3. O2OL Relationship Library
4. O2OL Communication Practice material
5. O2OL Help Center / AI Relationship Coach limits
6. MyMatchIQ evidence and assessments
7. Member conversation history
8. General model knowledge, used cautiously and never to override higher-priority O2OL guidance

### Phase 1 knowledge domains
1. Communication
2. Defensiveness
3. Listening and validation
4. Conflict resolution
5. Repair after arguments
6. Apologies
7. Forgiveness
8. Trust
9. Trust rebuilding
10. Boundaries vs control
11. Jealousy and insecurity
12. Dating expectations
13. Exclusivity and intentions
14. Marriage under pressure
15. Workload and resentment
16. Emotional validation
17. Money and finances
18. Family and in-laws
19. Intimacy and affection
20. Consent
21. Long-distance relationships
22. Breakups
23. Reconciliation
24. Infidelity recovery
25. Parenting disagreements
26. Healthy vs unhealthy relationship behavior
27. Red flags
28. Coercive control
29. Abuse and safety
30. Self-harm / crisis escalation
31. Professional-help referral boundaries

### Approved initial content already inside O2OL
The existing Relationship Library includes approved guidance on:
- Defensiveness in new relationships
- Boundaries vs control
- Repair after conflict
- Marriage under pressure
- Dating expectations

The existing Communication Practice feature contains:
- Communication scenarios
- Feedback on healthy vs unhealthy responses
- Listening and advice-giving examples

The existing Help Center defines AI coaching limits:
- General reflection
- Communication ideas
- Relationship education
- Not therapy, medicine, legal advice, or crisis care

### Core coaching rules
- Understand before advising.
- Validate without automatically agreeing.
- Distinguish intent from impact.
- Do not diagnose.
- Do not invent facts about the member or partner.
- Do not claim to know unexpressed feelings.
- Avoid deterministic language such as “your partner definitely…”
- Prefer practical next steps over abstract lectures.
- Ask concise clarifying questions when needed.
- Avoid encouraging surveillance, tests, manipulation, retaliation, isolation, or coercion.
- Encourage consent, respect, autonomy, and healthy boundaries.
- Recommend qualified professionals for persistent, clinical, legal, medical, or high-stakes issues.
- Safety guidance overrides ordinary relationship-preservation advice.

### Safety rules
If content suggests:
- Immediate danger
- Physical violence
- Threats
- Stalking
- Coercive control
- Forced sexual activity
- Serious abuse
- Suicide or self-harm

Then:
1. Shift from ordinary coaching to safety-first support.
2. Avoid “just communicate better” advice.
3. Encourage real-world support and appropriate local emergency/crisis/professional resources.
4. Avoid advice that could increase danger, including confrontation without a safety plan.
5. Keep the response focused on immediate safety.

### Retrieval behavior
Phase 1 uses deterministic local retrieval:
- Scan the current member message plus recent conversation context.
- Match relevant topic keywords.
- Retrieve up to 4 O2OL knowledge entries.
- Inject those entries as grounding into the model instructions.
- Safety entries receive highest priority.
- Record the knowledge-base version and retrieved entry IDs in cost/usage telemetry for auditability.

### Current KB version
2026-10-10-v2

### Phase 1 knowledge entries
- communication-listen-before-defend
- conflict-repair
- boundaries-vs-control
- dating-clarity
- marriage-under-pressure
- emotional-validation
- trust-rebuilding
- jealousy-insecurity
- money-finances
- family-inlaws
- intimacy-affection
- long-distance
- breakup-reconciliation
- infidelity-recovery
- parenting-disagreement
- apology-forgiveness
- healthy-red-flags
- self-harm-crisis
- professional-referral

### Phase 2 communication + relationship-pattern entries
- communication-demand-withdraw-cycle
- communication-stonewalling-flooding
- communication-soft-startup
- communication-emotional-bids
- communication-unmet-expectations
- communication-recurring-conflict
- communication-advice-vs-listening
- household-labor-fairness
- values-faith-differences
- intercultural-relationship
- digital-boundaries-social-media
- ex-friendship-boundaries

Current curated entry count: **31**

### Quality target
Current target after Phase 1:
- Bianca: Good
- Amora: Good

Longer-term target:
- Consistent, evidence-grounded coaching
- Expand curated entries by topic
- Add editorial review/versioning
- Add embedding/vector retrieval if needed
- Add source-confidence and citation metadata internally
- Add multilingual approved knowledge entries

### Phase 2 status
Phase 2 has begun. The first release expands communication patterns, recurring conflict, household partnership, values/culture, and modern digital/ex-partner boundaries.

### Remaining Phase 2 planned expansion
- Attachment-related behaviors without clinical labeling
- Appreciation and emotional bids
- Communication styles
- Conflict cycles
- Stonewalling / flooding
- Expectations and unmet needs
- Household labor
- Blended families
- Faith and values differences
- Intercultural relationships
- LGBTQ+ relationship considerations
- Age-gap relationships
- Grief and relationship strain
- Chronic illness / caregiving strain
- Fertility / family-planning disagreements
- Career relocation
- Digital boundaries / social media
- Pornography / online sexual boundaries
- Friendship boundaries
- Ex-partner boundaries
- Emotional affairs
- Rebuilding connection after distance
- Relationship check-ins
- Dating after divorce
- Second marriages
- Engagement / premarital conversations

### Governance
- O2OL knowledge content should be editable/versioned separately from model prompts.
- Each entry must have an ID, source, topics, keywords, guidance, and optional priority.
- Safety entries require highest priority.
- Material changes to coaching doctrine should be reviewed before release.
- Telemetry should retain the KB version and retrieved entry IDs.
- Knowledge updates should not silently alter user pricing.
- Historical knowledge versions should remain traceable for incident review.

### Implementation locations
- worker/coaching-knowledge.ts
- worker/mymatchiq-ai.ts
- worker/ai.ts

### Important architectural note
The knowledge lookup is local to O2OL and does not require a second AI call. GPT remains responsible for turning the retrieved guidance plus member context into a natural personalized reply.

### Owner authorization
Owner approved the O2OL Coaching Knowledge Base build and the grounding of Bianca and Amora in this curated relationship-coaching layer on 2026-10-10.
