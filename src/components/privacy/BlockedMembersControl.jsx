import React from 'react';
import { Ban, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/Layout';
import { MEMBER_BLOCKING_ENABLED } from '@/lib/memberBlockService';

const COPY = {
  en: { title: 'Blocked members', text: 'Review your private block list and unblock someone whenever you choose.', button: 'Manage blocked members' },
  es: { title: 'Miembros bloqueados', text: 'Revisa tu lista privada de bloqueos y desbloquea a alguien cuando tú decidas.', button: 'Administrar bloqueados' },
  fr: { title: 'Membres bloqués', text: 'Consultez votre liste privée de blocage et débloquez une personne quand vous le souhaitez.', button: 'Gérer les membres bloqués' },
  it: { title: 'Membri bloccati', text: 'Controlla la tua lista privata e sblocca una persona quando vuoi.', button: 'Gestisci membri bloccati' },
  de: { title: 'Blockierte Mitglieder', text: 'Prüfe deine private Blockliste und entsperre Personen jederzeit selbst.', button: 'Blockierte verwalten' },
  nl: { title: 'Geblokkeerde leden', text: 'Bekijk je privéblokkeerlijst en deblokkeer iemand wanneer jij dat wilt.', button: 'Geblokkeerde leden beheren' },
};

export default function BlockedMembersControl({ className = '' }) {
  const navigate = useNavigate();
  const { currentLanguage } = useLanguage();
  const t = COPY[currentLanguage] || COPY.en;

  if (!MEMBER_BLOCKING_ENABLED) return null;

  return (
    <Card className={`border-rose-200 ${className}`.trim()}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-slate-950">
          <Ban className="h-5 w-5 text-rose-600" />
          {t.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-6 text-gray-600">{t.text}</p>
        <Button variant="outline" className="mt-5 border-rose-200 text-rose-700 hover:bg-rose-50" onClick={() => navigate('/BlockedMembers')}>
          {t.button}
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
