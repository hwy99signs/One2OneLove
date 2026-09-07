from pathlib import Path


def replace_once(text, old, new, label):
    if old not in text:
        raise SystemExit(f'Expected {label} block not found')
    return text.replace(old, new, 1)

# 1) Let RLS decide which journal entries are visible: own entries plus entries
# explicitly shared by the declared partner.
service_path = Path('src/lib/journalService.js')
service = service_path.read_text()
service = replace_once(
    service,
    """    const { data: entries, error } = await supabase
      .from('shared_journals')
      .select('*')
      .eq('user_id', user.id)
      .order(field, { ascending });
""",
    """    const { data: entries, error } = await supabase
      .from('shared_journals')
      .select('*')
      .order(field, { ascending });
""",
    'journal list query',
)
service_path.write_text(service)

# 2) Add the existing shared_with_partner field to the journal form.
form_path = Path('src/components/activities/JournalForm.jsx')
form = form_path.read_text()
form = replace_once(
    form,
    'export default function JournalForm({ entry, onSubmit, onCancel }) {',
    "export default function JournalForm({ entry, onSubmit, onCancel, shareWithPartnerLabel = 'Share with partner' }) {",
    'JournalForm signature',
)
form = replace_once(
    form,
    """    tags: [],
    is_favorite: false
""",
    """    tags: [],
    is_favorite: false,
    shared_with_partner: false
""",
    'JournalForm defaults',
)
form = replace_once(
    form,
    """            <div className=\"flex justify-end gap-3\">
""",
    """            <label className=\"flex items-center gap-3 p-3 rounded-lg border border-blue-100 bg-blue-50/50\">
              <input
                type=\"checkbox\"
                checked={Boolean(formData.shared_with_partner)}
                onChange={(e) => setFormData({ ...formData, shared_with_partner: e.target.checked })}
                className=\"h-4 w-4\"
              />
              <span className=\"text-sm font-medium text-gray-700\">{shareWithPartnerLabel}</span>
            </label>

            <div className=\"flex justify-end gap-3\">
""",
    'JournalForm action row',
)
form_path.write_text(form)

# 3) Make entries shared by the partner read-only in the UI.
entry_path = Path('src/components/activities/JournalEntry.jsx')
entry = entry_path.read_text()
entry = replace_once(
    entry,
    'export default function JournalEntry({ entry, onEdit, onDelete }) {',
    "export default function JournalEntry({ entry, onEdit, onDelete, canEdit = true, isPartnerEntry = false, sharedByPartnerLabel = 'Shared by partner' }) {",
    'JournalEntry signature',
)
entry = replace_once(
    entry,
    """              <div className=\"flex items-center gap-2 text-sm text-gray-500\">
                <Calendar className=\"w-4 h-4\" />
                {format(new Date(entry.entry_date), 'MMMM d, yyyy')}
              </div>
""",
    """              <div className=\"flex items-center gap-2 text-sm text-gray-500\">
                <Calendar className=\"w-4 h-4\" />
                {format(new Date(entry.entry_date), 'MMMM d, yyyy')}
                {isPartnerEntry && (
                  <span className=\"ml-2 px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-xs\">
                    {sharedByPartnerLabel}
                  </span>
                )}
              </div>
""",
    'JournalEntry metadata',
)
entry = replace_once(
    entry,
    """            <div className=\"flex gap-2\">
              <Button variant=\"ghost\" size=\"icon\" onClick={() => onEdit(entry)}>
                <Edit className=\"w-4 h-4\" />
              </Button>
              <Button variant=\"ghost\" size=\"icon\" onClick={() => onDelete(entry.id)}>
                <Trash2 className=\"w-4 h-4 text-red-500\" />
              </Button>
            </div>
""",
    """            {canEdit && (
              <div className=\"flex gap-2\">
                <Button variant=\"ghost\" size=\"icon\" onClick={() => onEdit(entry)}>
                  <Edit className=\"w-4 h-4\" />
                </Button>
                <Button variant=\"ghost\" size=\"icon\" onClick={() => onDelete(entry.id)}>
                  <Trash2 className=\"w-4 h-4 text-red-500\" />
                </Button>
              </div>
            )}
""",
    'JournalEntry edit controls',
)
entry_path.write_text(entry)

# 4) Connect ownership + localized sharing labels on the page.
page_path = Path('src/pages/SharedJournals.jsx')
page = page_path.read_text()
page = replace_once(
    page,
    'import { useLanguage } from "@/Layout";\n',
    'import { useLanguage } from "@/Layout";\nimport { useAuth } from "@/contexts/AuthContext";\n',
    'SharedJournals auth import',
)
page = replace_once(
    page,
    """const translations = {
""",
    """const sharingTranslations = {
  en: { shareWithPartner: 'Share with partner', sharedByPartner: 'Shared by partner' },
  es: { shareWithPartner: 'Compartir con mi pareja', sharedByPartner: 'Compartido por tu pareja' },
  fr: { shareWithPartner: 'Partager avec mon partenaire', sharedByPartner: 'Partagé par votre partenaire' },
  it: { shareWithPartner: 'Condividi con il partner', sharedByPartner: 'Condiviso dal tuo partner' },
  de: { shareWithPartner: 'Mit Partner teilen', sharedByPartner: 'Von deinem Partner geteilt' }
};

const translations = {
""",
    'sharing translations',
)
page = replace_once(
    page,
    """  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const queryClient = useQueryClient();
""",
    """  const { currentLanguage } = useLanguage();
  const { user } = useAuth();
  const t = translations[currentLanguage] || translations.en;
  const sharingT = sharingTranslations[currentLanguage] || sharingTranslations.en;
  const queryClient = useQueryClient();
""",
    'SharedJournals component setup',
)
page = replace_once(
    page,
    """            <JournalForm
              entry={editingEntry}
""",
    """            <JournalForm
              entry={editingEntry}
              shareWithPartnerLabel={sharingT.shareWithPartner}
""",
    'JournalForm page props',
)
page = replace_once(
    page,
    """              <JournalEntry
                key={entry.id}
                entry={entry}
""",
    """              <JournalEntry
                key={entry.id}
                entry={entry}
                canEdit={entry.user_id === user?.id}
                isPartnerEntry={entry.user_id !== user?.id}
                sharedByPartnerLabel={sharingT.sharedByPartner}
""",
    'JournalEntry page props',
)
page_path.write_text(page)

print('Shared Journals operational patch applied.')
