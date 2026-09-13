from pathlib import Path
import json
import re

page = Path('src/pages/DateIdeas.jsx')
s = page.read_text()

# Imports: calendar/time icons, Input, existing calendar service.
s = s.replace(
    'Bookmark, Share2, Check, X } from "lucide-react";',
    'Bookmark, Share2, Check, X, CalendarDays, Clock } from "lucide-react";',
    1,
)
s = s.replace(
    'import { Button } from "@/components/ui/button";\n',
    'import { Button } from "@/components/ui/button";\nimport { Input } from "@/components/ui/input";\n',
    1,
)
anchor = 'import { DATE_IDEAS_UI } from "../components/dateideas/dateIdeasUiCopy";'
if anchor not in s:
    raise SystemExit('DATE_IDEAS_UI import not found')
s = s.replace(anchor, anchor + '\nimport { createCalendarEvent } from "@/lib/calendarService";', 1)

# State for schedule panel.
state_anchor = '  const [selectedIdea, setSelectedIdea] = useState(null);'
if state_anchor not in s:
    raise SystemExit('selectedIdea state not found')
s = s.replace(
    state_anchor,
    state_anchor + '''\n  const [showScheduleForm, setShowScheduleForm] = useState(false);\n  const [scheduleDate, setScheduleDate] = useState('');\n  const [scheduleTime, setScheduleTime] = useState('');\n  const [scheduledEvent, setScheduledEvent] = useState(null);\n  const [isScheduling, setIsScheduling] = useState(false);''',
    1,
)

# Remove the old savedDates query. Saved state is now derived from the user's date-state records.
s, count = re.subn(
    r"\n  const \{ data: savedDates = \[\] \} = useQuery\(\{.*?\n  \}\);\n",
    '\n',
    s,
    count=1,
    flags=re.S,
)
if count != 1:
    raise SystemExit(f'Expected to remove savedDates query once, removed {count}')

# Protect user-scoped updates and stop invalidating the removed query.
s = s.replace(
    ".update(data)\n        .eq('id', id)\n        .select()",
    ".update(data)\n        .eq('id', id)\n        .eq('user_id', currentUser?.id)\n        .select()",
    1,
)
s = s.replace("      queryClient.invalidateQueries({ queryKey: ['savedDates'] });\n", '', 1)

# Replace the built-in/all/saved collection wiring with stable per-user state records.
collection_pattern = re.compile(
    r"  const predefinedDateIdeas = getDateIdeasForLanguage\(currentLanguage\)\.map\(\(idea, index\) => \(\{.*?\n\n  const filteredIdeas",
    re.S,
)
collection_replacement = '''  const BUILTIN_DATE_STATE_PREFIX = '__o2ol_builtin_date__:';\n\n  const basePredefinedDateIdeas = getDateIdeasForLanguage(currentLanguage).map((idea, index) => ({\n    ...idea,\n    icon: iconMap[idea.iconKey] || Heart,\n    color: dateIdeaColors[index % dateIdeaColors.length]\n  }));\n\n  const builtInStateRecords = customDates.filter(record =>\n    String(record.title || '').startsWith(BUILTIN_DATE_STATE_PREFIX)\n  );\n  const customOnlyDates = customDates.filter(record =>\n    !String(record.title || '').startsWith(BUILTIN_DATE_STATE_PREFIX)\n  );\n  const builtInStateById = new Map(\n    builtInStateRecords.map(record => [\n      String(record.title).slice(BUILTIN_DATE_STATE_PREFIX.length),\n      record\n    ])\n  );\n\n  const predefinedDateIdeas = basePredefinedDateIdeas.map(idea => {\n    const stateRecord = builtInStateById.get(String(idea.id));\n    return {\n      ...idea,\n      user_record_id: stateRecord?.id || null,\n      is_favorite: Boolean(stateRecord?.is_favorite),\n      is_completed: Boolean(stateRecord?.is_completed)\n    };\n  });\n\n  const savedIdeas = [\n    ...predefinedDateIdeas.filter(idea => idea.is_favorite),\n    ...customOnlyDates.filter(idea => idea.is_favorite)\n  ];\n\n  const allIdeas = viewMode === 'custom'\n    ? customOnlyDates\n    : viewMode === 'saved'\n    ? savedIdeas\n    : [...predefinedDateIdeas, ...customOnlyDates];\n\n  const filteredIdeas'''
s, count = collection_pattern.subn(collection_replacement, s, count=1)
if count != 1:
    raise SystemExit(f'Expected to replace date collection wiring once, replaced {count}')

# Replace the old nonfunctional handlers with functional Save / Share / Schedule / Done actions.
handlers_pattern = re.compile(
    r"  const handleSaveDate = async \(idea\) => \{.*?\n  const formatOptionList =",
    re.S,
)
handlers_replacement = '''  const requireSignedIn = () => {\n    if (currentUser?.id) return true;\n    toast.error(t.signInRequired);\n    return false;\n  };\n\n  const firstFilterValue = (value) => Array.isArray(value) ? value[0] : (value || null);\n\n  const persistBuiltInState = async (idea, updates) => {\n    if (idea.user_record_id) {\n      return updateDateMutation.mutateAsync({ id: idea.user_record_id, data: updates });\n    }\n\n    const { data, error } = await supabase\n      .from('custom_date_ideas')\n      .insert({\n        user_id: currentUser.id,\n        title: `${BUILTIN_DATE_STATE_PREFIX}${idea.id}`,\n        description: idea.title,\n        category: firstFilterValue(idea.categories || idea.category),\n        budget: idea.budget || null,\n        location_type: firstFilterValue(idea.locations || idea.location_type),\n        occasion: firstFilterValue(idea.occasions || idea.occasion),\n        relationship_stage: firstFilterValue(idea.stages || idea.relationship_stage),\n        is_favorite: false,\n        is_completed: false,\n        ...updates\n      })\n      .select()\n      .single();\n    if (error) throw error;\n    return data;\n  };\n\n  const handleSaveDate = async (idea) => {\n    if (!requireSignedIn()) return;\n    try {\n      const nextSaved = !Boolean(idea.is_favorite);\n      let record = null;\n      if (idea.week) {\n        record = await persistBuiltInState(idea, { is_favorite: nextSaved });\n      } else if (idea.id) {\n        record = await updateDateMutation.mutateAsync({ id: idea.id, data: { is_favorite: nextSaved } });\n      }\n      queryClient.invalidateQueries({ queryKey: ['customDates', currentUser.id] });\n      setSelectedIdea(current => current && current.id === idea.id\n        ? { ...current, is_favorite: nextSaved, user_record_id: record?.id || current.user_record_id }\n        : current);\n      toast.success(nextSaved ? t.dateSaved : t.dateUnsaved);\n    } catch (error) {\n      console.error('Error saving date idea:', error);\n      toast.error(t.actionFailed);\n    }\n  };\n\n  const buildShareText = (idea) => {\n    const pieces = [idea.title, idea.description];\n    if (idea.budget) pieces.push(`${t.budget}: ${t.budgetOptions?.[idea.budget] || idea.budget}`);\n    const locations = formatOptionList(idea.locations || idea.location_type, t.locationOptions);\n    if (locations) pieces.push(`${t.locations}: ${locations}`);\n    return pieces.filter(Boolean).join('\\n\\n');\n  };\n\n  const shareText = async ({ title, text, successMessage, copiedMessage }) => {\n    try {\n      if (navigator.share) {\n        await navigator.share({ title, text });\n        toast.success(successMessage);\n        return;\n      }\n      if (navigator.clipboard?.writeText) {\n        await navigator.clipboard.writeText(text);\n        toast.success(copiedMessage);\n        return;\n      }\n      toast.error(t.shareUnavailable);\n    } catch (error) {\n      if (error?.name !== 'AbortError') {\n        console.error('Error sharing date:', error);\n        toast.error(t.actionFailed);\n      }\n    }\n  };\n\n  const handleShareDate = async (idea) => {\n    await shareText({\n      title: idea.title,\n      text: buildShareText(idea),\n      successMessage: t.dateShared,\n      copiedMessage: t.shareCopied\n    });\n  };\n\n  const handleCompleteDate = async (idea) => {\n    if (!requireSignedIn()) return;\n    if (idea.is_completed) return;\n    try {\n      let record = null;\n      if (idea.week) {\n        record = await persistBuiltInState(idea, { is_completed: true });\n      } else if (idea.id) {\n        record = await updateDateMutation.mutateAsync({ id: idea.id, data: { is_completed: true } });\n      }\n      queryClient.invalidateQueries({ queryKey: ['customDates', currentUser.id] });\n      setSelectedIdea(current => current && current.id === idea.id\n        ? { ...current, is_completed: true, user_record_id: record?.id || current.user_record_id }\n        : current);\n      toast.success(t.dateCompleted);\n    } catch (error) {\n      console.error('Error completing date idea:', error);\n      toast.error(t.actionFailed);\n    }\n  };\n\n  const openSchedule = () => {\n    if (!requireSignedIn()) return;\n    setScheduleDate('');\n    setScheduleTime('');\n    setScheduledEvent(null);\n    setShowScheduleForm(true);\n  };\n\n  const handleScheduleDate = async () => {\n    if (!requireSignedIn()) return;\n    if (!scheduleDate || !scheduleTime) {\n      toast.error(t.scheduleRequired);\n      return;\n    }\n    try {\n      setIsScheduling(true);\n      const event = await createCalendarEvent(currentUser.id, {\n        title: selectedIdea.title,\n        description: selectedIdea.description || null,\n        event_date: scheduleDate,\n        event_time: scheduleTime,\n        event_type: 'date',\n        location: formatOptionList(selectedIdea.locations || selectedIdea.location_type, t.locationOptions) || null,\n        notes: selectedIdea.week ? `One2OneLove Date Idea • Week ${selectedIdea.week}/52` : 'One2OneLove Date Idea',\n        color: 'pink',\n        reminder_enabled: true,\n        reminder_days_before: 1\n      });\n      setScheduledEvent({\n        id: event?.id || null,\n        title: selectedIdea.title,\n        date: scheduleDate,\n        time: scheduleTime\n      });\n      toast.success(t.dateScheduled);\n    } catch (error) {\n      console.error('Error scheduling date idea:', error);\n      toast.error(error?.message || t.actionFailed);\n    } finally {\n      setIsScheduling(false);\n    }\n  };\n\n  const formatScheduledDate = (dateValue, timeValue) => {\n    if (!dateValue) return '';\n    try {\n      const value = new Date(`${dateValue}T${timeValue || '12:00'}`);\n      return new Intl.DateTimeFormat(currentLanguage || 'en', {\n        dateStyle: 'full',\n        timeStyle: timeValue ? 'short' : undefined\n      }).format(value);\n    } catch {\n      return `${dateValue}${timeValue ? ` ${timeValue}` : ''}`;\n    }\n  };\n\n  const handleShareScheduledDate = async () => {\n    if (!scheduledEvent || !selectedIdea) return;\n    const when = formatScheduledDate(scheduledEvent.date, scheduledEvent.time);\n    await shareText({\n      title: selectedIdea.title,\n      text: `${selectedIdea.title}\\n${t.scheduledFor}: ${when}\\n\\n${selectedIdea.description || ''}`.trim(),\n      successMessage: t.scheduleShared,\n      copiedMessage: t.scheduleShareCopied\n    });\n  };\n\n  const openDateIdea = (idea) => {\n    setSelectedIdea(idea);\n    setShowScheduleForm(false);\n    setScheduleDate('');\n    setScheduleTime('');\n    setScheduledEvent(null);\n  };\n\n  const localToday = (() => {\n    const now = new Date();\n    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);\n    return local.toISOString().split('T')[0];\n  })();\n\n  const formatOptionList ='''
s, count = handlers_pattern.subn(handlers_replacement, s, count=1)
if count != 1:
    raise SystemExit(f'Expected to replace action handlers once, replaced {count}')

# Saved count comes from the actual annotated/derived saved list.
s = s.replace('{t.savedDates} ({savedDates.length})', '{t.savedDates} ({savedIdeas.length})', 1)

# Open a title with schedule state reset.
s = s.replace('onClick={() => setSelectedIdea(idea)}', 'onClick={() => openDateIdea(idea)}', 1)

# Keep hover-away close behavior except while the scheduling panel is actively open.
s = s.replace(
    'onMouseLeave={() => setSelectedIdea(null)}',
    'onMouseLeave={() => { if (!showScheduleForm) setSelectedIdea(null); }}',
    1,
)

# Replace the old custom-only action footer with universal functional actions plus scheduler.
footer_pattern = re.compile(
    r"\n                    \{selectedIdea\.created_by === currentUser\?\.email && \(.*?\n                    \)\}",
    re.S,
)
footer_replacement = '''\n                    <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">\n                      <Button\n                        size="sm"\n                        variant="outline"\n                        onClick={() => handleSaveDate(selectedIdea)}\n                        className={selectedIdea.is_favorite ? 'bg-pink-50 border-pink-300' : ''}\n                      >\n                        <Bookmark className={`w-4 h-4 mr-2 ${selectedIdea.is_favorite ? 'fill-pink-500 text-pink-500' : ''}`} />\n                        {selectedIdea.is_favorite ? t.saved : t.addToSaved}\n                      </Button>\n                      <Button size="sm" variant="outline" onClick={() => handleShareDate(selectedIdea)}>\n                        <Share2 className="w-4 h-4 mr-2" />\n                        {t.shareWithPartner}\n                      </Button>\n                      <Button size="sm" variant="outline" onClick={openSchedule}>\n                        <CalendarDays className="w-4 h-4 mr-2" />\n                        {t.schedule}\n                      </Button>\n                      <Button\n                        size="sm"\n                        variant="outline"\n                        onClick={() => handleCompleteDate(selectedIdea)}\n                        disabled={Boolean(selectedIdea.is_completed)}\n                        className={selectedIdea.is_completed ? 'bg-green-50 border-green-300 text-green-700' : ''}\n                      >\n                        <Check className="w-4 h-4 mr-2" />\n                        {selectedIdea.is_completed ? t.done : t.markComplete}\n                      </Button>\n                    </div>\n\n                    <AnimatePresence>\n                      {showScheduleForm && (\n                        <motion.div\n                          initial={{ opacity: 0, y: -6 }}\n                          animate={{ opacity: 1, y: 0 }}\n                          exit={{ opacity: 0, y: -6 }}\n                          className="mt-4 rounded-xl border border-purple-200 bg-purple-50/60 p-4"\n                        >\n                          {!scheduledEvent ? (\n                            <>\n                              <div className="flex items-center gap-2 mb-4">\n                                <CalendarDays className="w-5 h-5 text-purple-600" />\n                                <h4 className="font-bold text-gray-900">{t.scheduleTitle}</h4>\n                              </div>\n                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">\n                                <div>\n                                  <label className="block text-sm font-semibold text-gray-700 mb-1">{t.scheduleDate}</label>\n                                  <Input\n                                    type="date"\n                                    min={localToday}\n                                    value={scheduleDate}\n                                    onChange={(event) => setScheduleDate(event.target.value)}\n                                  />\n                                </div>\n                                <div>\n                                  <label className="block text-sm font-semibold text-gray-700 mb-1">{t.scheduleTime}</label>\n                                  <div className="relative">\n                                    <Clock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />\n                                    <Input\n                                      type="time"\n                                      value={scheduleTime}\n                                      onChange={(event) => setScheduleTime(event.target.value)}\n                                      className="pl-9"\n                                    />\n                                  </div>\n                                </div>\n                              </div>\n                              <div className="flex flex-wrap gap-2 mt-4">\n                                <Button\n                                  type="button"\n                                  size="sm"\n                                  variant="outline"\n                                  onClick={() => setShowScheduleForm(false)}\n                                  disabled={isScheduling}\n                                >\n                                  {t.cancel}\n                                </Button>\n                                <Button\n                                  type="button"\n                                  size="sm"\n                                  onClick={handleScheduleDate}\n                                  disabled={isScheduling || !scheduleDate || !scheduleTime}\n                                  className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"\n                                >\n                                  <CalendarDays className="w-4 h-4 mr-2" />\n                                  {isScheduling ? t.scheduling : t.scheduleAction}\n                                </Button>\n                              </div>\n                            </>\n                          ) : (\n                            <>\n                              <p className="font-semibold text-gray-900 mb-1">{t.dateScheduled}</p>\n                              <p className="text-sm text-gray-700 mb-4">\n                                {t.scheduledFor}: {formatScheduledDate(scheduledEvent.date, scheduledEvent.time)}\n                              </p>\n                              <div className="flex flex-wrap gap-2">\n                                <Button type="button" size="sm" onClick={handleShareScheduledDate} className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700">\n                                  <Share2 className="w-4 h-4 mr-2" />\n                                  {t.shareSchedule}\n                                </Button>\n                                <Button type="button" size="sm" variant="outline" onClick={() => setShowScheduleForm(false)}>\n                                  {t.close}\n                                </Button>\n                              </div>\n                            </>\n                          )}\n                        </motion.div>\n                      )}\n                    </AnimatePresence>'''
s, count = footer_pattern.subn(footer_replacement, s, count=1)
if count != 1:
    raise SystemExit(f'Expected to replace action footer once, replaced {count}')

page.write_text(s)

# Update seven-language Date Ideas UI copy.
ui_path = Path('src/components/dateideas/dateIdeasUiCopy.js')
raw = ui_path.read_text().strip()
prefix = 'export const DATE_IDEAS_UI='
if not raw.startswith(prefix) or not raw.endswith(';'):
    raise SystemExit('Unexpected dateIdeasUiCopy.js format')
ui = json.loads(raw[len(prefix):-1])

extra = {
  'en': {
    'saved': 'Saved', 'dateUnsaved': 'Removed from saved dates.', 'schedule': 'Schedule',
    'scheduleTitle': 'Schedule This Date', 'scheduleDate': 'Date', 'scheduleTime': 'Time',
    'scheduleAction': 'Schedule Date', 'scheduling': 'Scheduling…', 'dateScheduled': 'Date scheduled!',
    'scheduledFor': 'Scheduled for', 'shareSchedule': 'Share Scheduled Date',
    'scheduleShared': 'Scheduled date shared!', 'shareCopied': 'Date details copied to your clipboard.',
    'scheduleShareCopied': 'Scheduled date copied to your clipboard.', 'shareUnavailable': 'Sharing is not available on this device.',
    'scheduleRequired': 'Please select both a date and a time.', 'signInRequired': 'Please sign in to save, schedule, or mark dates as done.',
    'actionFailed': 'That action could not be completed. Please try again.', 'cancel': 'Cancel', 'done': 'Done'
  },
  'es': {
    'saved': 'Guardada', 'dateUnsaved': 'Eliminada de las citas guardadas.', 'schedule': 'Programar',
    'scheduleTitle': 'Programar Esta Cita', 'scheduleDate': 'Fecha', 'scheduleTime': 'Hora',
    'scheduleAction': 'Programar Cita', 'scheduling': 'Programando…', 'dateScheduled': '¡Cita programada!',
    'scheduledFor': 'Programada para', 'shareSchedule': 'Compartir Cita Programada',
    'scheduleShared': '¡Cita programada compartida!', 'shareCopied': 'Detalles de la cita copiados al portapapeles.',
    'scheduleShareCopied': 'Cita programada copiada al portapapeles.', 'shareUnavailable': 'Compartir no está disponible en este dispositivo.',
    'scheduleRequired': 'Selecciona una fecha y una hora.', 'signInRequired': 'Inicia sesión para guardar, programar o marcar citas como realizadas.',
    'actionFailed': 'No se pudo completar la acción. Inténtalo de nuevo.', 'cancel': 'Cancelar', 'done': 'Realizada'
  },
  'fr': {
    'saved': 'Enregistré', 'dateUnsaved': 'Retiré des rendez-vous enregistrés.', 'schedule': 'Planifier',
    'scheduleTitle': 'Planifier ce Rendez-vous', 'scheduleDate': 'Date', 'scheduleTime': 'Heure',
    'scheduleAction': 'Planifier', 'scheduling': 'Planification…', 'dateScheduled': 'Rendez-vous planifié !',
    'scheduledFor': 'Prévu pour', 'shareSchedule': 'Partager le Rendez-vous Planifié',
    'scheduleShared': 'Rendez-vous planifié partagé !', 'shareCopied': 'Détails copiés dans le presse-papiers.',
    'scheduleShareCopied': 'Rendez-vous planifié copié dans le presse-papiers.', 'shareUnavailable': 'Le partage n’est pas disponible sur cet appareil.',
    'scheduleRequired': 'Sélectionnez une date et une heure.', 'signInRequired': 'Connectez-vous pour enregistrer, planifier ou marquer un rendez-vous comme fait.',
    'actionFailed': 'Cette action n’a pas pu être effectuée. Réessayez.', 'cancel': 'Annuler', 'done': 'Fait'
  },
  'it': {
    'saved': 'Salvato', 'dateUnsaved': 'Rimosso dagli appuntamenti salvati.', 'schedule': 'Programma',
    'scheduleTitle': 'Programma Questo Appuntamento', 'scheduleDate': 'Data', 'scheduleTime': 'Ora',
    'scheduleAction': 'Programma Appuntamento', 'scheduling': 'Programmazione…', 'dateScheduled': 'Appuntamento programmato!',
    'scheduledFor': 'Programmato per', 'shareSchedule': 'Condividi Appuntamento Programmato',
    'scheduleShared': 'Appuntamento programmato condiviso!', 'shareCopied': 'Dettagli copiati negli appunti.',
    'scheduleShareCopied': 'Appuntamento programmato copiato negli appunti.', 'shareUnavailable': 'La condivisione non è disponibile su questo dispositivo.',
    'scheduleRequired': 'Seleziona una data e un’ora.', 'signInRequired': 'Accedi per salvare, programmare o segnare gli appuntamenti come completati.',
    'actionFailed': 'Impossibile completare l’azione. Riprova.', 'cancel': 'Annulla', 'done': 'Fatto'
  },
  'de': {
    'saved': 'Gespeichert', 'dateUnsaved': 'Aus gespeicherten Dates entfernt.', 'schedule': 'Planen',
    'scheduleTitle': 'Dieses Date Planen', 'scheduleDate': 'Datum', 'scheduleTime': 'Uhrzeit',
    'scheduleAction': 'Date Planen', 'scheduling': 'Wird geplant…', 'dateScheduled': 'Date geplant!',
    'scheduledFor': 'Geplant für', 'shareSchedule': 'Geplantes Date Teilen',
    'scheduleShared': 'Geplantes Date geteilt!', 'shareCopied': 'Date-Details in die Zwischenablage kopiert.',
    'scheduleShareCopied': 'Geplantes Date in die Zwischenablage kopiert.', 'shareUnavailable': 'Teilen ist auf diesem Gerät nicht verfügbar.',
    'scheduleRequired': 'Bitte Datum und Uhrzeit auswählen.', 'signInRequired': 'Bitte anmelden, um Dates zu speichern, zu planen oder als erledigt zu markieren.',
    'actionFailed': 'Die Aktion konnte nicht abgeschlossen werden. Bitte erneut versuchen.', 'cancel': 'Abbrechen', 'done': 'Erledigt'
  },
  'nl': {
    'saved': 'Opgeslagen', 'dateUnsaved': 'Uit opgeslagen dates verwijderd.', 'schedule': 'Plannen',
    'scheduleTitle': 'Deze Date Plannen', 'scheduleDate': 'Datum', 'scheduleTime': 'Tijd',
    'scheduleAction': 'Date Plannen', 'scheduling': 'Plannen…', 'dateScheduled': 'Date gepland!',
    'scheduledFor': 'Gepland voor', 'shareSchedule': 'Geplande Date Delen',
    'scheduleShared': 'Geplande date gedeeld!', 'shareCopied': 'Date-details naar het klembord gekopieerd.',
    'scheduleShareCopied': 'Geplande date naar het klembord gekopieerd.', 'shareUnavailable': 'Delen is niet beschikbaar op dit apparaat.',
    'scheduleRequired': 'Selecteer zowel een datum als een tijd.', 'signInRequired': 'Log in om dates op te slaan, te plannen of als gedaan te markeren.',
    'actionFailed': 'Deze actie kon niet worden voltooid. Probeer het opnieuw.', 'cancel': 'Annuleren', 'done': 'Gedaan'
  },
  'pt': {
    'saved': 'Salvo', 'dateUnsaved': 'Removido dos encontros salvos.', 'schedule': 'Agendar',
    'scheduleTitle': 'Agendar Este Encontro', 'scheduleDate': 'Data', 'scheduleTime': 'Hora',
    'scheduleAction': 'Agendar Encontro', 'scheduling': 'Agendando…', 'dateScheduled': 'Encontro agendado!',
    'scheduledFor': 'Agendado para', 'shareSchedule': 'Compartilhar Encontro Agendado',
    'scheduleShared': 'Encontro agendado compartilhado!', 'shareCopied': 'Detalhes copiados para a área de transferência.',
    'scheduleShareCopied': 'Encontro agendado copiado para a área de transferência.', 'shareUnavailable': 'O compartilhamento não está disponível neste dispositivo.',
    'scheduleRequired': 'Selecione uma data e uma hora.', 'signInRequired': 'Entre para salvar, agendar ou marcar encontros como concluídos.',
    'actionFailed': 'Não foi possível concluir a ação. Tente novamente.', 'cancel': 'Cancelar', 'done': 'Concluído'
  }
}

for lang, values in extra.items():
    if lang not in ui:
        raise SystemExit(f'Missing language {lang}')
    ui[lang].update(values)

ui_path.write_text(prefix + json.dumps(ui, ensure_ascii=False, separators=(',', ':')) + ';\n')
print('Date Ideas Save/Share/Schedule/Done actions and seven-language scheduler copy applied.')
