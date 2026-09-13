from pathlib import Path

# ---- Memory Lane: move CRUD from Supabase to the Cloudflare/Neon service with local fallback ----
p = Path('src/pages/MemoryLane.jsx')
s = p.read_text()
s = s.replace('import { supabase } from "@/lib/supabase";\n', 'import { listMemories, createMemory, updateMemory, deleteMemory } from "@/lib/memoryService";\n')
s = s.replace('import { createPageUrl } from "@/utils";\n', 'import { createPageUrl } from "@/utils";\nimport { toast } from "sonner";\n')

old_query = '''  const { user } = useAuth();\n\n  const { data: memories = [], isLoading } = useQuery({\n    queryKey: ['memories', user?.id],\n    queryFn: async () => {\n      if (!user?.id) return [];\n      const { data, error } = await supabase\n        .from('memories')\n        .select('*')\n        .eq('user_id', user.id)\n        .order('memory_date', { ascending: false });\n      if (error) {\n        console.error('Error fetching memories:', error);\n        return [];\n      }\n      return data || [];\n    },\n    enabled: !!user?.id,\n    initialData: [],\n  });\n\n  const createMemoryMutation = useMutation({\n    mutationFn: async (memoryData) => {\n      if (!user?.id) throw new Error('User not authenticated');\n      const { data: result, error } = await supabase\n        .from('memories')\n        .insert({ ...memoryData, user_id: user.id })\n        .select()\n        .single();\n      if (error) throw error;\n      return result;\n    },\n    onSuccess: () => {\n      queryClient.invalidateQueries({ queryKey: ['memories'] });\n      setShowForm(false);\n      setEditingMemory(null);\n    },\n  });\n\n  const updateMemoryMutation = useMutation({\n    mutationFn: async ({ id, memoryData }) => {\n      const { data: result, error } = await supabase\n        .from('memories')\n        .update(memoryData)\n        .eq('id', id)\n        .select()\n        .single();\n      if (error) throw error;\n      return result;\n    },\n    onSuccess: () => {\n      queryClient.invalidateQueries({ queryKey: ['memories'] });\n      setShowForm(false);\n      setEditingMemory(null);\n    },\n  });\n\n  const deleteMemoryMutation = useMutation({\n    mutationFn: async (id) => {\n      const { error } = await supabase\n        .from('memories')\n        .delete()\n        .eq('id', id);\n      if (error) throw error;\n      return id;\n    },\n    onSuccess: () => {\n      queryClient.invalidateQueries({ queryKey: ['memories'] });\n    },\n  });\n'''

new_query = '''  const { user } = useAuth();\n  const memoryUserKey = user?.id || 'guest';\n\n  const { data: memories = [], isLoading } = useQuery({\n    queryKey: ['memories', memoryUserKey],\n    queryFn: () => listMemories(memoryUserKey),\n    enabled: true,\n    initialData: [],\n  });\n\n  const createMemoryMutation = useMutation({\n    mutationFn: (memoryData) => createMemory(memoryUserKey, memoryData),\n    onSuccess: (created) => {\n      queryClient.setQueryData(['memories', memoryUserKey], (current = []) => [\n        created,\n        ...current.filter(item => String(item.id) !== String(created.id)),\n      ]);\n      setShowForm(false);\n      setEditingMemory(null);\n      toast.success('Memory saved!');\n    },\n    onError: (error) => {\n      console.error('Error creating memory:', error);\n      toast.error(error?.message || 'Unable to save memory.');\n    },\n  });\n\n  const updateMemoryMutation = useMutation({\n    mutationFn: ({ id, memoryData }) => updateMemory(memoryUserKey, id, memoryData),\n    onSuccess: (updated) => {\n      queryClient.setQueryData(['memories', memoryUserKey], (current = []) =>\n        current.map(item => String(item.id) === String(updated.id) ? updated : item)\n      );\n      setShowForm(false);\n      setEditingMemory(null);\n    },\n    onError: (error) => {\n      console.error('Error updating memory:', error);\n      toast.error(error?.message || 'Unable to update memory.');\n    },\n  });\n\n  const deleteMemoryMutation = useMutation({\n    mutationFn: (id) => deleteMemory(memoryUserKey, id),\n    onSuccess: (id) => {\n      queryClient.setQueryData(['memories', memoryUserKey], (current = []) =>\n        current.filter(item => String(item.id) !== String(id))\n      );\n    },\n    onError: (error) => {\n      console.error('Error deleting memory:', error);\n      toast.error(error?.message || 'Unable to delete memory.');\n    },\n  });\n'''

if old_query not in s:
    raise SystemExit('MemoryLane Supabase CRUD block not found')
s = s.replace(old_query, new_query, 1)
p.write_text(s)

# ---- Date Ideas: make custom create immediately visible and report failures ----
p = Path('src/pages/DateIdeas.jsx')
s = p.read_text()
old_create = '''  const createDateMutation = useMutation({\n    mutationFn: (data) => createDateIdea(dateIdeasUserKey, data),\n    onSuccess: () => {\n      queryClient.invalidateQueries({ queryKey: ['customDates'] });\n      toast.success(t.customDateCreated);\n      setShowCustomForm(false);\n    }\n  });\n'''
new_create = '''  const createDateMutation = useMutation({\n    mutationFn: (data) => createDateIdea(dateIdeasUserKey, data),\n    onSuccess: (created) => {\n      queryClient.setQueryData(['customDates', dateIdeasUserKey], (current = []) => [\n        created,\n        ...current.filter(item => String(item.id) !== String(created.id)),\n      ]);\n      setViewMode('custom');\n      toast.success(t.customDateCreated);\n      setShowCustomForm(false);\n    },\n    onError: (error) => {\n      console.error('Error creating custom date:', error);\n      toast.error(error?.message || t.actionFailed);\n    }\n  });\n'''
if old_create not in s:
    raise SystemExit('DateIdeas create mutation block not found')
s = s.replace(old_create, new_create, 1)
old_form = '''              <CustomDateForm\n                onSubmit={(data) => createDateMutation.mutate(data)}\n                onCancel={() => setShowCustomForm(false)}\n              />\n'''
new_form = '''              <CustomDateForm\n                onSubmit={(data) => createDateMutation.mutate(data)}\n                onCancel={() => setShowCustomForm(false)}\n                isLoading={createDateMutation.isPending}\n              />\n'''
if old_form not in s:
    raise SystemExit('CustomDateForm usage not found')
s = s.replace(old_form, new_form, 1)
p.write_text(s)

# ---- Custom Date form: prevent double submit while the save is running ----
p = Path('src/components/dateideas/CustomDateForm.jsx')
s = p.read_text()
s = s.replace('export default function CustomDateForm({ dateIdea, onSubmit, onCancel }) {', 'export default function CustomDateForm({ dateIdea, onSubmit, onCancel, isLoading = false }) {', 1)
s = s.replace('<Button type="button" variant="outline" className="flex-1" onClick={onCancel}>', '<Button type="button" variant="outline" className="flex-1" onClick={onCancel} disabled={isLoading}>', 1)
s = s.replace('<Button type="submit" className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700">', '<Button type="submit" disabled={isLoading} className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700">', 1)
p.write_text(s)

# ---- Memory form: remove obsolete Supabase imports. Save now goes through memoryService. ----
p = Path('src/components/memories/MemoryForm.jsx')
s = p.read_text()
s = s.replace('import { supabase } from "@/lib/supabase";\n', '')
s = s.replace('import { useAuth } from "@/contexts/AuthContext";\n', '')
p.write_text(s)

print('Custom Date and Memory save flows patched.')
