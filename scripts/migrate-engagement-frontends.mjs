import fs from 'node:fs';

function read(path) { return fs.readFileSync(path, 'utf8'); }
function write(path, value) { fs.writeFileSync(path, value); }
function exact(path, before, after, label) {
  const source = read(path);
  if (!source.includes(before)) throw new Error(`${path}: missing expected ${label}`);
  write(path, source.replace(before, after));
}
function regex(path, pattern, after, label) {
  const source = read(path);
  if (!pattern.test(source)) throw new Error(`${path}: missing expected ${label}`);
  write(path, source.replace(pattern, after));
}

// Leaderboard points
exact('src/pages/Leaderboard.jsx',
  'import { supabase } from "@/lib/supabase";\n',
  'import { getPoints } from "@/lib/engagementService";\n',
  'Supabase import');
regex('src/pages/Leaderboard.jsx',
  /const \{ data, error \} = await supabase\s*\.from\('gamification_points'\)\s*\.select\('\*'\)\s*\.eq\('user_id', currentUser\.id\);\s*if \(error\) \{\s*console\.error\('Error fetching points:', error\);\s*return \[\];\s*\}\s*return data \|\| \[\];/,
  'return await getPoints();',
  'points query');

// Header points display
exact('src/components/gamification/PointsDisplay.jsx',
  'import { supabase } from "@/lib/supabase";\n',
  'import { getPoints } from "@/lib/engagementService";\n',
  'Supabase import');
regex('src/components/gamification/PointsDisplay.jsx',
  /const \{ data, error \} = await supabase\s*\.from\('gamification_points'\)\s*\.select\('\*'\)\s*\.eq\('user_id', currentUser\.id\);\s*if \(error\) \{\s*console\.error\('Error fetching points:', error\);\s*return \[\];\s*\}\s*return data \|\| \[\];/,
  'return await getPoints();',
  'points query');

// Achievements points + badges
exact('src/pages/Achievements.jsx',
  'import { supabase } from "@/lib/supabase";\n',
  'import { getPoints, getBadges } from "@/lib/engagementService";\n',
  'Supabase import');
regex('src/pages/Achievements.jsx',
  /const \{ data, error \} = await supabase\s*\.from\('gamification_points'\)\s*\.select\('\*'\)\s*\.eq\('user_id', currentUser\.id\);\s*if \(error\) \{\s*console\.error\('Error fetching points:', error\);\s*return \[\];\s*\}\s*return data \|\| \[\];/,
  'return await getPoints();',
  'achievement points query');
regex('src/pages/Achievements.jsx',
  /const \{ data, error \} = await supabase\s*\.from\('badges'\)\s*\.select\('\*'\)\s*\.eq\('user_id', currentUser\.id\);\s*if \(error\) \{\s*console\.error\('Error fetching badges:', error\);\s*return \[\];\s*\}\s*return data \|\| \[\];/,
  'return await getBadges();',
  'badges query');

// Memory Lane CRUD
exact('src/pages/MemoryLane.jsx',
  'import { supabase } from "@/lib/supabase";\n',
  'import { getMemories, createMemory, updateMemory, deleteMemory } from "@/lib/engagementService";\n',
  'Supabase import');
regex('src/pages/MemoryLane.jsx',
  /const \{ data, error \} = await supabase\s*\.from\('memories'\)\s*\.select\('\*'\)\s*\.eq\('user_id', user\.id\)\s*\.order\('memory_date', \{ ascending: false \}\);\s*if \(error\) \{\s*console\.error\('Error fetching memories:', error\);\s*return \[\];\s*\}\s*return data \|\| \[\];/,
  'return await getMemories();',
  'memory list query');
regex('src/pages/MemoryLane.jsx',
  /const \{ data: result, error \} = await supabase\s*\.from\('memories'\)\s*\.insert\(\{ \.\.\.memoryData, user_id: user\.id \}\)\s*\.select\(\)\s*\.single\(\);\s*if \(error\) throw error;\s*return result;/,
  'return await createMemory(memoryData);',
  'memory create');
regex('src/pages/MemoryLane.jsx',
  /const \{ data: result, error \} = await supabase\s*\.from\('memories'\)\s*\.update\(memoryData\)\s*\.eq\('id', id\)\s*\.select\(\)\s*\.single\(\);\s*if \(error\) throw error;\s*return result;/,
  'return await updateMemory(id, memoryData);',
  'memory update');
regex('src/pages/MemoryLane.jsx',
  /const \{ error \} = await supabase\s*\.from\('memories'\)\s*\.delete\(\)\s*\.eq\('id', id\);\s*if \(error\) throw error;\s*return id;/,
  'await deleteMemory(id);\n      return id;',
  'memory delete');

// Memory R2 upload
exact('src/components/memories/MemoryForm.jsx',
  'import { supabase } from "@/lib/supabase";\nimport { useAuth } from "@/contexts/AuthContext";\n',
  'import { uploadMemoryMedia } from "@/lib/engagementService";\n',
  'memory Supabase imports');
regex('src/components/memories/MemoryForm.jsx',
  /\/\/ TODO: Implement file upload with Supabase Storage[\s\S]*?throw new Error\('File upload requires Supabase Storage implementation'\);\s*newUrls\.push\(file_url\);/,
  'const fileUrl = await uploadMemoryMedia(file);\n        if (!fileUrl) throw new Error(\'Memory media upload did not return a URL\');\n        newUrls.push(fileUrl);',
  'memory upload placeholder');

// Date ideas CRUD
exact('src/pages/DateIdeas.jsx',
  'import { supabase } from "@/lib/supabase";\n',
  'import { getCustomDateIdeas, createCustomDateIdea, updateCustomDateIdea } from "@/lib/engagementService";\n',
  'Supabase import');
regex('src/pages/DateIdeas.jsx',
  /const \{ data, error \} = await supabase\s*\.from\('custom_date_ideas'\)\s*\.select\('\*'\)\s*\.eq\('user_id', currentUser\.id\)\s*\.order\('created_at', \{ ascending: false \}\);\s*if \(error\) \{\s*console\.error\('Error fetching custom dates:', error\);\s*return \[\];\s*\}\s*return data \|\| \[\];/,
  'return await getCustomDateIdeas();',
  'custom date list');
regex('src/pages/DateIdeas.jsx',
  /const \{ data, error \} = await supabase\s*\.from\('custom_date_ideas'\)\s*\.select\('\*'\)\s*\.eq\('user_id', currentUser\.id\)\s*\.eq\('is_favorite', true\)\s*\.order\('created_at', \{ ascending: false \}\);\s*if \(error\) \{\s*console\.error\('Error fetching saved dates:', error\);\s*return \[\];\s*\}\s*return data \|\| \[\];/,
  'return await getCustomDateIdeas({ favorite: true });',
  'saved date list');
regex('src/pages/DateIdeas.jsx',
  /if \(!currentUser\?\.id\) throw new Error\('User not authenticated'\);\s*const \{ data: result, error \} = await supabase\s*\.from\('custom_date_ideas'\)\s*\.insert\(\{ \.\.\.data, user_id: currentUser\.id \}\)\s*\.select\(\)\s*\.single\(\);\s*if \(error\) throw error;\s*return result;/,
  "if (!currentUser?.id) throw new Error('User not authenticated');\n      return await createCustomDateIdea(data);",
  'custom date create');
regex('src/pages/DateIdeas.jsx',
  /const \{ data: result, error \} = await supabase\s*\.from\('custom_date_ideas'\)\s*\.update\(data\)\s*\.eq\('id', id\)\s*\.select\(\)\s*\.single\(\);\s*if \(error\) throw error;\s*return result;/,
  'return await updateCustomDateIdea(id, data);',
  'custom date update');
exact('src/pages/DateIdeas.jsx',
  "const isCustom = idea.created_by === currentUser?.email;",
  'const isCustom = idea.user_id === currentUser?.id;',
  'custom ownership check');
exact('src/pages/DateIdeas.jsx',
  "if (idea.id && idea.created_by === currentUser?.email) {",
  'if (idea.id && idea.user_id === currentUser?.id) {',
  'save ownership check');
exact('src/pages/DateIdeas.jsx',
  "if (idea.id && idea.created_by === currentUser?.email) {",
  'if (idea.id && idea.user_id === currentUser?.id) {',
  'share ownership check');
exact('src/pages/DateIdeas.jsx',
  "if (idea.id && idea.created_by === currentUser?.email) {",
  'if (idea.id && idea.user_id === currentUser?.id) {',
  'complete ownership check');
exact('src/pages/DateIdeas.jsx',
  'data: { ...idea, completed: true, completed_date: new Date().toISOString() }',
  'data: { is_completed: true }',
  'date completion payload');
exact('src/pages/DateIdeas.jsx',
  '{idea.completed && <Check className="inline-block w-5 h-5 text-green-600 ml-2" />}',
  '{idea.is_completed && <Check className="inline-block w-5 h-5 text-green-600 ml-2" />}',
  'completed display');
exact('src/pages/DateIdeas.jsx',
  '{!idea.completed && (',
  '{!idea.is_completed && (',
  'completed action display');

// Couples dashboard memory query
exact('src/pages/CouplesDashboard.jsx',
  'import { supabase } from "@/lib/supabase";\n',
  'import { getMemories } from "@/lib/engagementService";\n',
  'Supabase import');
regex('src/pages/CouplesDashboard.jsx',
  /const \{ data, error \} = await supabase\s*\.from\('memories'\)\s*\.select\('\*'\)\s*\.eq\('user_id', user\.id\)\s*\.order\('memory_date', \{ ascending: false \}\);\s*if \(error\) \{\s*console\.error\('Error fetching memories:', error\);\s*return \[\];\s*\}\s*return data \|\| \[\];/,
  'return await getMemories();',
  'dashboard memory query');

// Waitlist
exact('src/components/home/WaitlistForm.jsx',
  'import { supabase } from "@/lib/supabase";\n',
  'import { joinWaitlist } from "@/lib/engagementService";\n',
  'Supabase import');
regex('src/components/home/WaitlistForm.jsx',
  /const \{ data: result, error \} = await supabase\s*\.from\('waitlist'\)\s*\.insert\(data\)\s*\.select\(\)\s*\.single\(\);\s*if \(error\) throw error;\s*return result;/,
  'return await joinWaitlist(data.email, data.country);',
  'waitlist insert');

// Contest page
exact('src/pages/WinACruise.jsx',
  'import { supabase } from "@/lib/supabase";\n',
  'import { getContestLeaderboard, getContestWinner, getMyContestEntry, joinContest } from "@/lib/engagementService";\n',
  'Supabase import');
regex('src/pages/WinACruise.jsx',
  /const \{ data, error \} = await supabase\s*\.from\('contest_participants'\)\s*\.select\('\*'\)\s*\.eq\('contest_type', 'monthly_love_notes'\)\s*\.eq\('period', currentPeriod\);\s*if \(error\) \{\s*console\.error\('Error fetching participants:', error\);\s*return \[\];\s*\}\s*const participants = data \|\| \[\];\s*return participants\.sort\(\(a, b\) => b\.score - a\.score\)\.slice\(0, 5\);/,
  "return await getContestLeaderboard('monthly_love_notes', currentPeriod, 5);",
  'monthly contest query');
regex('src/pages/WinACruise.jsx',
  /const \{ data, error \} = await supabase\s*\.from\('contest_participants'\)\s*\.select\('\*'\)\s*\.eq\('contest_type', 'yearly_engagement'\)\s*\.eq\('period', currentYear\);\s*if \(error\) \{\s*console\.error\('Error fetching participants:', error\);\s*return \[\];\s*\}\s*const participants = data \|\| \[\];\s*return participants\.sort\(\(a, b\) => b\.score - a\.score\)\.slice\(0, 5\);/,
  "return await getContestLeaderboard('yearly_engagement', currentYear, 5);",
  'yearly contest query');
regex('src/pages/WinACruise.jsx',
  /const \{ data, error \} = await supabase\s*\.from\('contest_winners'\)\s*\.select\('\*'\)\s*\.eq\('contest_type', 'monthly_love_notes'\)\s*\.eq\('period', lastMonthPeriod\);\s*if \(error\) \{\s*console\.error\('Error fetching winners:', error\);\s*return null;\s*\}\s*const winners = data \|\| \[\];\s*return winners\[0\] \|\| null;/,
  "return await getContestWinner('monthly_love_notes', lastMonthPeriod);",
  'contest winner query');
regex('src/pages/WinACruise.jsx',
  /if \(!currentUser\) return null;\s*if \(!currentUser\?\.email\) return null;\s*const \{ data, error \} = await supabase\s*\.from\('contest_participants'\)\s*\.select\('\*'\)\s*\.eq\('contest_type', 'monthly_love_notes'\)\s*\.eq\('period', currentPeriod\)\s*\.eq\('user_email', currentUser\.email\);\s*if \(error\) \{\s*console\.error\('Error fetching user rank:', error\);\s*return null;\s*\}\s*const participants = data \|\| \[\];\s*return participants\[0\] \|\| null;/,
  "if (!currentUser?.email) return null;\n      return await getMyContestEntry('monthly_love_notes', currentPeriod);",
  'user contest query');
exact('src/pages/WinACruise.jsx',
  'const handleSubmit = (e) => {\n    e.preventDefault();\n    toast.success("You\'re now competing for prizes! 🎉");\n    setEmail("");\n  };',
  'const handleSubmit = async (e) => {\n    e.preventDefault();\n    if (!currentUser) {\n      toast.error("Please sign in to join the competition.");\n      return;\n    }\n    try {\n      await Promise.all([\n        joinContest(\'monthly_love_notes\', currentPeriod),\n        joinContest(\'yearly_engagement\', currentYear),\n      ]);\n      toast.success("You\'re now competing for prizes! 🎉");\n      setEmail("");\n    } catch (error) {\n      toast.error(error?.message || "Unable to join the competition right now.");\n    }\n  };',
  'contest join handler');

// Remove unused legacy imports from TODO-only pages.
for (const path of [
  'src/pages/CoupleActivities.jsx',
  'src/pages/CooperativeGames.jsx',
  'src/pages/RelationshipCoach.jsx',
  'src/pages/AIContentCreator.jsx',
]) {
  const source = read(path);
  const next = source
    .replace('import { supabase } from "@/lib/supabase";\n', '')
    .replace("import { supabase } from '@/lib/supabase';\n", '');
  if (source === next) throw new Error(`${path}: expected removable Supabase import`);
  write(path, next);
}

console.log('Engagement frontend migration codemod completed.');
