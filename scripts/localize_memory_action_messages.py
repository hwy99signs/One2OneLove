from pathlib import Path

p = Path('src/pages/MemoryLane.jsx')
s = p.read_text()

replacements = {
'''    deleteConfirm: "Are you sure you want to delete this memory?",\n    back: "Back"''': '''    deleteConfirm: "Are you sure you want to delete this memory?",\n    memorySaved: "Memory saved!",\n    memorySaveFailed: "Unable to save memory.",\n    memoryUpdateFailed: "Unable to update memory.",\n    memoryDeleteFailed: "Unable to delete memory.",\n    back: "Back"''',
'''    deleteConfirm: "¿Estás seguro de que quieres eliminar este recuerdo?",\n    back: "Atrás"''': '''    deleteConfirm: "¿Estás seguro de que quieres eliminar este recuerdo?",\n    memorySaved: "¡Recuerdo guardado!",\n    memorySaveFailed: "No se pudo guardar el recuerdo.",\n    memoryUpdateFailed: "No se pudo actualizar el recuerdo.",\n    memoryDeleteFailed: "No se pudo eliminar el recuerdo.",\n    back: "Atrás"''',
'''    deleteConfirm: "Êtes-vous sûr de vouloir supprimer ce souvenir?",\n    back: "Retour"''': '''    deleteConfirm: "Êtes-vous sûr de vouloir supprimer ce souvenir?",\n    memorySaved: "Souvenir enregistré !",\n    memorySaveFailed: "Impossible d’enregistrer le souvenir.",\n    memoryUpdateFailed: "Impossible de mettre à jour le souvenir.",\n    memoryDeleteFailed: "Impossible de supprimer le souvenir.",\n    back: "Retour"''',
'''    deleteConfirm: "Sei sicuro di voler eliminare questo ricordo?",\n    back: "Indietro"''': '''    deleteConfirm: "Sei sicuro di voler eliminare questo ricordo?",\n    memorySaved: "Ricordo salvato!",\n    memorySaveFailed: "Impossibile salvare il ricordo.",\n    memoryUpdateFailed: "Impossibile aggiornare il ricordo.",\n    memoryDeleteFailed: "Impossibile eliminare il ricordo.",\n    back: "Indietro"''',
'''    deleteConfirm: "Sind Sie sicher, dass Sie diese Erinnerung löschen möchten?",\n    back: "Zurück"''': '''    deleteConfirm: "Sind Sie sicher, dass Sie diese Erinnerung löschen möchten?",\n    memorySaved: "Erinnerung gespeichert!",\n    memorySaveFailed: "Erinnerung konnte nicht gespeichert werden.",\n    memoryUpdateFailed: "Erinnerung konnte nicht aktualisiert werden.",\n    memoryDeleteFailed: "Erinnerung konnte nicht gelöscht werden.",\n    back: "Zurück"''',
'''    deleteConfirm: "Weet je zeker dat je deze herinnering wilt verwijderen?",\n    back: "Terug"''': '''    deleteConfirm: "Weet je zeker dat je deze herinnering wilt verwijderen?",\n    memorySaved: "Herinnering opgeslagen!",\n    memorySaveFailed: "Herinnering kon niet worden opgeslagen.",\n    memoryUpdateFailed: "Herinnering kon niet worden bijgewerkt.",\n    memoryDeleteFailed: "Herinnering kon niet worden verwijderd.",\n    back: "Terug"''',
'''    deleteConfirm: "Tem certeza de que deseja excluir esta memória?",\n    back: "Voltar"''': '''    deleteConfirm: "Tem certeza de que deseja excluir esta memória?",\n    memorySaved: "Memória salva!",\n    memorySaveFailed: "Não foi possível salvar a memória.",\n    memoryUpdateFailed: "Não foi possível atualizar a memória.",\n    memoryDeleteFailed: "Não foi possível excluir a memória.",\n    back: "Voltar"''',
}

for old, new in replacements.items():
    if old not in s:
        raise SystemExit(f'Missing translation block: {old[:60]}')
    s = s.replace(old, new, 1)

s = s.replace("toast.success('Memory saved!');", 'toast.success(t.memorySaved);', 1)
s = s.replace("toast.error(error?.message || 'Unable to save memory.');", 'toast.error(error?.message || t.memorySaveFailed);', 1)
s = s.replace("toast.error(error?.message || 'Unable to update memory.');", 'toast.error(error?.message || t.memoryUpdateFailed);', 1)
s = s.replace("toast.error(error?.message || 'Unable to delete memory.');", 'toast.error(error?.message || t.memoryDeleteFailed);', 1)

p.write_text(s)
print('Memory action messages localized.')
