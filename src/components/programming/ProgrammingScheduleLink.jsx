import React from 'react';
import { CalendarDays } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/Layout';
import { CREATOR_PROGRAMMING_ENABLED } from '@/lib/creatorProgrammingService';

const COPY = {
  en: 'View programming schedule',
  es: 'Ver calendario de programación',
  fr: 'Voir le calendrier de programmation',
  it: 'Vedi calendario programmazione',
  de: 'Programmkalender anzeigen',
  nl: 'Programmakalender bekijken',
};

export default function ProgrammingScheduleLink({ className = '' }) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { currentLanguage } = useLanguage();

  if (!CREATOR_PROGRAMMING_ENABLED || !isAuthenticated) return null;

  return (
    <Button type="button" variant="outline" onClick={() => navigate('/ProgrammingSchedule')} className={className}>
      <CalendarDays className="mr-2 h-4 w-4" />{COPY[currentLanguage] || COPY.en}
    </Button>
  );
}
