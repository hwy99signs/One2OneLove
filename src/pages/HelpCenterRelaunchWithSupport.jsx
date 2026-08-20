import React from 'react';
import HelpCenterRelaunch from './HelpCenterRelaunch';
import HelpCenterSupportControl from '@/components/support/HelpCenterSupportControl';
import { useLanguage } from '@/Layout';

export default function HelpCenterRelaunchWithSupport() {
  const { currentLanguage } = useLanguage();

  return (
    <>
      <HelpCenterRelaunch />
      <div className="mx-auto max-w-6xl px-5 pb-12 sm:px-8 lg:px-10">
        <HelpCenterSupportControl languageCode={currentLanguage} />
      </div>
    </>
  );
}
