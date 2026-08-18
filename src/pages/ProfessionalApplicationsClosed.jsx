import React from 'react';
import { ArrowLeft, BriefcaseBusiness, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function ProfessionalApplicationsClosed() {
  return (
    <div className="min-h-[75vh] bg-gradient-to-br from-slate-50 via-white to-purple-50 px-4 py-16">
      <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl sm:p-12">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-purple-100">
          <BriefcaseBusiness className="h-8 w-8 text-purple-700" />
        </div>
        <p className="mt-6 text-sm font-black uppercase tracking-[0.18em] text-purple-700">Professional applications</p>
        <h1 className="mt-3 text-3xl font-black text-slate-900 sm:text-4xl">Applications are not open yet.</h1>
        <p className="mt-5 text-base leading-7 text-slate-600">
          One2OneLove is preparing the private intake and review process for therapists, influencers and other professional partners. We will not collect application details until that secure workflow is deliberately activated.
        </p>
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-left text-sm leading-6 text-emerald-950">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
          <p>No application was submitted from this page. When applications open, the form will confirm submission only after the private intake backend actually stores it.</p>
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild variant="outline">
            <Link to="/"><ArrowLeft className="mr-2 h-4 w-4" />Back to One2OneLove</Link>
          </Button>
          <Button asChild className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
            <Link to="/HelpCenter">Help Center</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
