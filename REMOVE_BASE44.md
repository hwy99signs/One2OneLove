# Base44 Removal Guide

This document tracks the removal of all base44 dependencies from the application.

## Completed ✅
- Removed `@base44/sdk` from package.json
- Updated package.json name from "base44-app" to "one-2-one-love"
- Replaced base44Client.js with stub that returns errors
- Removed base44 imports from Community.jsx
- Removed base44 imports from Home.jsx

## Files Still Need Updates

### Pages (src/pages/)
- [ ] CouplesDashboard.jsx
- [ ] DateIdeas.jsx
- [ ] MemoryLane.jsx
- [ ] CouplesProfile.jsx
- [ ] RelationshipCoach.jsx
- [ ] AIContentCreator.jsx
- [ ] Achievements.jsx
- [ ] PremiumFeatures.jsx
- [ ] Leaderboard.jsx
- [ ] LoveNotes.jsx
- [ ] CoupleActivities.jsx
- [ ] CooperativeGames.jsx
- [ ] ForgotPassword.jsx
- [ ] WinACruise.jsx

### Components (src/components/)
- [ ] home/HeroSection.jsx
- [ ] home/WaitlistForm.jsx
- [ ] memories/MemoryForm.jsx
- [ ] gamification/PointsDisplay.jsx
- [ ] lovenotes/ScheduledNotesManager.jsx
- [ ] lovenotes/AIPersonalizationModal.jsx

### API Files
- [ ] api/integrations.js (needs to be deleted or replaced)
- [ ] api/entities.js (needs to be deleted or replaced)

### Other
- [ ] pages/Layout.jsx (has base44 image URL)

## Instructions

For each file:
1. Remove `import { base44 } from "@/api/base44Client";`
2. Replace `base44.auth.me()` calls with Supabase auth or remove
3. Replace `base44.entities.*` calls with Supabase queries or remove
4. Replace `base44.integrations.*` calls with Supabase functions or remove
5. Replace `base44.agents.*` calls with Supabase realtime or remove

## Next Steps

Run `npm uninstall @base44/sdk` after all imports are removed.

