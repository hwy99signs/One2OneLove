from pathlib import Path

p = Path('src/pages/DateIdeas.jsx')
s = p.read_text()

s = s.replace('import { supabase } from "@/lib/supabase";\n', '')
s = s.replace(
    'import { createCalendarEvent } from "@/lib/calendarService";\n',
    'import { createCalendarEvent } from "@/lib/calendarService";\nimport { listDateIdeas, createDateIdea, updateDateIdea } from "@/lib/dateIdeasService";\n',
    1,
)

old_query = '''  const { data: customDates = [] } = useQuery({
    queryKey: ['customDates', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return [];
      const { data, error } = await supabase
        .from('custom_date_ideas')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Error fetching custom dates:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!currentUser?.id,
    initialData: [],
  });
'''
new_query = '''  const dateIdeasUserKey = currentUser?.id || 'guest';

  const { data: customDates = [] } = useQuery({
    queryKey: ['customDates', dateIdeasUserKey],
    queryFn: () => listDateIdeas(dateIdeasUserKey),
    enabled: true,
    initialData: [],
  });
'''
if old_query not in s:
    raise SystemExit('customDates query block not found')
s = s.replace(old_query, new_query, 1)

old_create = '''  const createDateMutation = useMutation({
    mutationFn: async (data) => {
      if (!currentUser?.id) throw new Error('User not authenticated');
      const { data: result, error } = await supabase
        .from('custom_date_ideas')
        .insert({ ...data, user_id: currentUser.id })
        .select()
        .single();
      if (error) throw error;
      return result;
    },
'''
new_create = '''  const createDateMutation = useMutation({
    mutationFn: (data) => createDateIdea(dateIdeasUserKey, data),
'''
if old_create not in s:
    raise SystemExit('create mutation block not found')
s = s.replace(old_create, new_create, 1)

old_update = '''  const updateDateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const { data: result, error } = await supabase
        .from('custom_date_ideas')
        .update(data)
        .eq('id', id)
        .eq('user_id', currentUser?.id)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
'''
new_update = '''  const updateDateMutation = useMutation({
    mutationFn: ({ id, data }) => updateDateIdea(dateIdeasUserKey, id, data),
'''
if old_update not in s:
    raise SystemExit('update mutation block not found')
s = s.replace(old_update, new_update, 1)

old_require = '''  const requireSignedIn = () => {
    if (currentUser?.id) return true;
    toast.error(t.signInRequired);
    return false;
  };
'''
new_require = '''  const requireSignedIn = () => true;
'''
if old_require not in s:
    raise SystemExit('requireSignedIn block not found')
s = s.replace(old_require, new_require, 1)

old_persist = '''    const { data, error } = await supabase
      .from('custom_date_ideas')
      .insert({
        user_id: currentUser.id,
        title: `${BUILTIN_DATE_STATE_PREFIX}${idea.id}`,
        description: idea.title,
        category: firstFilterValue(idea.categories || idea.category),
        budget: idea.budget || null,
        location_type: firstFilterValue(idea.locations || idea.location_type),
        occasion: firstFilterValue(idea.occasions || idea.occasion),
        relationship_stage: firstFilterValue(idea.stages || idea.relationship_stage),
        is_favorite: false,
        is_completed: false,
        ...updates
      })
      .select()
      .single();
    if (error) throw error;
    return data;
'''
new_persist = '''    return createDateIdea(dateIdeasUserKey, {
      title: `${BUILTIN_DATE_STATE_PREFIX}${idea.id}`,
      description: idea.title,
      category: firstFilterValue(idea.categories || idea.category),
      budget: idea.budget || null,
      location_type: firstFilterValue(idea.locations || idea.location_type),
      occasion: firstFilterValue(idea.occasions || idea.occasion),
      relationship_stage: firstFilterValue(idea.stages || idea.relationship_stage),
      is_favorite: false,
      is_completed: false,
      ...updates
    });
'''
if old_persist not in s:
    raise SystemExit('persistBuiltInState Supabase block not found')
s = s.replace(old_persist, new_persist, 1)

s = s.replace("queryClient.invalidateQueries({ queryKey: ['customDates', currentUser.id] });", "queryClient.invalidateQueries({ queryKey: ['customDates', dateIdeasUserKey] });")

old_schedule_call = '''      const event = await createCalendarEvent(currentUser.id, {
'''
new_schedule_call = '''      const event = await createCalendarEvent(dateIdeasUserKey, {
'''
if old_schedule_call not in s:
    raise SystemExit('calendar create call not found')
s = s.replace(old_schedule_call, new_schedule_call, 1)

# Both the Save/Done handlers and schedule panel should be usable in preview/guest mode.
s = s.replace('    if (!requireSignedIn()) return;\n', '')

p.write_text(s)
print('Date Ideas actions now use Cloudflare/Neon services with local fallback.')
