# One2OneLove Relaunch — Public Route Review Inventory

This is a development planning document. It does not hide routes, change navigation, merge branches, or alter production.

The current React router still exposes many legacy One2OneLove pages alongside the relaunch work. A public beta should intentionally decide which of those routes are in scope rather than assuming every legacy page is launch-ready.

## Relaunch core — actively being rebuilt/reviewed

These routes are part of the current relaunch work and should receive end-to-end beta testing:

- `/` and `/Home`
- `/SignIn` and `/login`
- `/SignUp` and `/signup`
- `/auth/callback`
- `/Community`
- `/LiveRoom`
- `/LoveNotes`
- `/LoveNotesCollection`
- `/LoveNotes/Send`
- `/LoveNoteReveal`
- `/LoveLanguageQuiz`
- `/DateIdeas`
- `/RelationshipGoals`
- `/Profile`

Compatibility/development routes that should not be promoted as separate product destinations:

- `/LoveNoteSendDemo`
- `/LoveNoteRevealDemo`

## Professional application routes — launch blocker until owner decision

- `/TherapistSignup`
- `/InfluencerSignup`
- `/ProfessionalSignup`

These three legacy pages currently contain prototype `123456` email/phone verification. See `docs/professional-verification-options.md`.

Recommended lean-beta choice: keep these routes out of the public launch until real verification/application behavior is selected.

## Payment/subscription routes — review before beta exposure

- `/Subscription`
- `/PaymentSuccess`
- `/payment-success`
- `/PremiumFeatures`

These names imply billing or entitlement behavior. Before public exposure, confirm current Stripe configuration, pricing, subscription state changes, cancellation behavior, webhook handling, and whether any old pricing/product assumptions remain. Do not test with real charges without explicit owner approval.

## Legacy social/community routes — review before public navigation

- `/Chat`
- `/FindFriends`
- `/FriendRequests`
- `/Leaderboard`
- `/Achievements`
- `/Suggestions`
- `/Reviews`

The relaunch strategy currently centers Live Community rather than a generic legacy social graph. These routes may still be useful later, but they should be reviewed for stale data models, privacy rules, moderation, and whether they fit the beta experience.

## Couple/relationship tools — candidate beta features, require smoke testing

- `/CoupleSupport`
- `/MemoryLane`
- `/RelationshipMilestones`
- `/RelationshipCoach`
- `/Meditation`
- `/CommunicationPractice`
- `/CouplesProfile`
- `/CoupleActivities`
- `/SharedJournals`
- `/CooperativeGames`
- `/CouplesDashboard`
- `/CouplesCalendar`
- `/RelationshipQuizzes`
- `/AnniversaryTracker`

These are not marked broken by this document. They simply have not received the same relaunch-level audit as Live Community and Love Notes. Review authentication, data privacy, empty states, multilingual behavior, and any AI/provider calls before putting them in primary navigation.

## Content/support routes — lower-risk but still review copy/links

- `/AboutUs`
- `/HelpCenter`
- `/ContactUs`
- `/PrivacyPolicy`
- `/TermsOfService`
- `/Blog`
- `/LGBTQSupport`
- `/CounselingSupport`
- `/PodcastsSupport`
- `/ArticlesSupport`
- `/InfluencersSupport`
- `/Invite`
- `/ForgotPassword`

Legal/privacy pages should receive a deliberate prelaunch review rather than being assumed current because they render successfully.

## Special/legacy routes to keep out of public navigation until reviewed

- `/Developer`
- `/AIContentCreator`
- `/WinACruise`
- `/Dashboard`

These route names suggest internal, campaign-specific, administrative, or older product surfaces. Review intent and access control before beta exposure.

## Recommended route strategy for a controlled beta

Keep the initial public navigation intentionally small:

**Home → Live Community → Love Notes → Love Language Quiz / Date Ideas / Relationship Goals → Profile**

Keep other routes available only after they pass a smoke/security/product review. This reduces launch risk without deleting legacy work.

## Before production merge

For every route selected for beta:

1. Confirm it has an intentional owner-approved purpose in the beta.
2. Confirm signed-in/signed-out behavior.
3. Confirm it does not expose private user data through permissive queries/views.
4. Confirm empty/error/loading states are truthful.
5. Confirm any payment, AI, email, SMS, or other provider action is explicitly enabled and cost-controlled.
6. Confirm mobile layout and primary language switching.
7. Confirm no placeholder credentials, verification codes, fake activity, or demo-only claims remain.

No route should be removed from the codebase solely because it is excluded from beta; navigation/access decisions can be made separately after owner review.
