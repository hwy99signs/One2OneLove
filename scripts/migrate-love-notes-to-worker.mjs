import fs from 'node:fs';

function replaceOrFail(source, pattern, replacement, label) {
  const next = source.replace(pattern, replacement);
  if (next === source) throw new Error(`Migration replacement failed: ${label}`);
  return next;
}

function patchLoveNotes() {
  const file = 'src/pages/LoveNotes.jsx';
  let text = fs.readFileSync(file, 'utf8');

  text = replaceOrFail(
    text,
    'import { supabase } from "@/lib/supabase";',
    'import { loveNotesApi, one2OneLogoUrl } from "@/lib/one2oneApi";',
    'LoveNotes API import',
  );

  text = replaceOrFail(
    text,
    /  const \{ data: sentNotes = \[\] \} = useQuery\(\{[\s\S]*?    staleTime: 60 \* 1000,\n  \}\);/,
    `  const { data: sentNotes = [] } = useQuery({\n    queryKey: ['sentLoveNotes', currentUser?.id],\n    queryFn: async () => {\n      if (!currentUser?.id) return [];\n      try {\n        return await loveNotesApi.listSent();\n      } catch (error) {\n        console.error('Error fetching sent notes:', error);\n        return [];\n      }\n    },\n    enabled: !!currentUser?.id,\n    initialData: [],\n    staleTime: 60 * 1000,\n  });`,
    'LoveNotes sent notes query',
  );

  text = replaceOrFail(
    text,
    /  const sendNoteMutation = useMutation\(\{[\s\S]*?  \}\);\n\n  const scheduleMutation = useMutation\(\{[\s\S]*?  \}\);\n\n  const savePersonalization/,
    `  const sendNoteMutation = useMutation({\n    mutationFn: async (data) => {\n      if (!currentUser?.id) throw new Error('User not authenticated');\n      return loveNotesApi.recordSent(data);\n    },\n    onSuccess: () => {\n      queryClient.invalidateQueries({ queryKey: ['sentLoveNotes'] });\n    }\n  });\n\n  const scheduleMutation = useMutation({\n    mutationFn: async (data) => {\n      if (!currentUser?.id) throw new Error('User not authenticated');\n      return loveNotesApi.schedule(data);\n    },\n    onSuccess: () => {\n      queryClient.invalidateQueries({ queryKey: ['scheduledNotes'] });\n      toast.success(t.scheduleSuccess);\n      setSendModalNote(null);\n      setRecipientPhone('');\n      setIsScheduling(false);\n      setScheduleDate('');\n      setScheduleTime('');\n    }\n  });\n\n  const savePersonalization`,
    'LoveNotes mutations',
  );

  text = replaceOrFail(
    text,
    "      scheduled_time: scheduleTime,\n      recipient_phone: recipientPhone,",
    "      scheduled_time: scheduleTime,\n      scheduled_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',\n      recipient_phone: recipientPhone,",
    'LoveNotes timezone',
  );

  text = replaceOrFail(
    text,
    'src="https://hphhmjcutesqsdnubnnw.supabase.co/storage/v1/object/public/app-assets/logo.png"',
    'src={one2OneLogoUrl}',
    'LoveNotes official logo',
  );

  fs.writeFileSync(file, text);
}

function patchScheduledManager() {
  const file = 'src/components/lovenotes/ScheduledNotesManager.jsx';
  let text = fs.readFileSync(file, 'utf8');

  text = replaceOrFail(
    text,
    'import { supabase } from "@/lib/supabase";',
    'import { loveNotesApi } from "@/lib/one2oneApi";',
    'ScheduledNotes API import',
  );

  text = replaceOrFail(
    text,
    /  const \{ data: scheduledNotes = \[\] \} = useQuery\(\{[\s\S]*?    initialData: \[\],\n  \}\);/,
    `  const { data: scheduledNotes = [] } = useQuery({\n    queryKey: ['scheduledNotes', user?.id],\n    queryFn: async () => {\n      if (!user?.id) return [];\n      try {\n        const notes = await loveNotesApi.listScheduled();\n        return notes.filter(note => note.status === 'scheduled');\n      } catch (error) {\n        console.error('Error fetching scheduled notes:', error);\n        return [];\n      }\n    },\n    enabled: !!user?.id,\n    initialData: [],\n  });`,
    'ScheduledNotes query',
  );

  text = replaceOrFail(
    text,
    /  const cancelMutation = useMutation\(\{[\s\S]*?  \}\);\n\n  const getStatusBadge/,
    `  const cancelMutation = useMutation({\n    mutationFn: async (id) => loveNotesApi.cancelScheduled(id),\n    onSuccess: () => {\n      queryClient.invalidateQueries({ queryKey: ['scheduledNotes'] });\n      toast.success(t.noteCancelled);\n    },\n    onError: () => {\n      toast.error(t.errorCancelling);\n    }\n  });\n\n  const getStatusBadge`,
    'ScheduledNotes cancellation',
  );

  fs.writeFileSync(file, text);
}

function patchForgotPassword() {
  const file = 'src/pages/ForgotPassword.jsx';
  let text = fs.readFileSync(file, 'utf8');

  if (!text.includes('@/lib/one2oneApi')) {
    text = replaceOrFail(
      text,
      'import { useLanguage } from "@/Layout";',
      'import { useLanguage } from "@/Layout";\nimport { authApi } from "@/lib/one2oneApi";',
      'ForgotPassword API import',
    );
  }

  text = replaceOrFail(
    text,
    /      \/\/ In a real implementation, you would call your password reset API\n      \/\/ For now, we simulate the API call\n      \n      await new Promise\(resolve => setTimeout\(resolve, 1500\)\);/,
    `      await authApi.requestPasswordReset(\n        email,\n        \\`${window.location.origin}${createPageUrl("SignIn")}\\`,\n      );`,
    'ForgotPassword submit',
  );

  text = replaceOrFail(
    text,
    '      await new Promise(resolve => setTimeout(resolve, 1500));\n      toast.success(t.linkResent);',
    `      await authApi.requestPasswordReset(\n        email,\n        \\`${window.location.origin}${createPageUrl("SignIn")}\\`,\n      );\n      toast.success(t.linkResent);`,
    'ForgotPassword resend',
  );

  fs.writeFileSync(file, text);
}

patchLoveNotes();
patchScheduledManager();
patchForgotPassword();
console.log('Love Notes, scheduled notes, and password reset now use the Cloudflare/Neon API.');
