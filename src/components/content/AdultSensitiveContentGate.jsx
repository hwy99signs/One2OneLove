import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/Layout";
import { supabase } from "@/lib/supabase";

export const ADULT_SENSITIVE_CONTENT_CONSENT_VERSION = "2026-09-13-v1";

const copy = {
  en: {
    loading: "Checking content access…",
    signInTitle: "Sign in required",
    signInBody:
      "Adult and sensitive-content consent is saved to your One2OneLove account, so you need to be signed in before entering this section.",
    signIn: "Sign In",
    createAccount: "Create Account",
    title: "Adult & Sensitive Content Acknowledgment — 18+",
    paragraphs: [
      "One2OneLove’s podcast library includes independent third-party creators discussing relationships, dating, marriage, sexuality, intimacy, mental health, identity, infidelity, trauma, and other adult or sensitive subjects.",
      "Some episodes may contain explicit language, sexual discussions, or material that some listeners may find sensitive, uncomfortable, or triggering.",
      "Podcast content represents the views of the individual creators and guests. One2OneLove and ERANT Property Services LLC do not necessarily endorse those views and are not responsible for statements made by third-party creators.",
      "Podcast content is provided for informational and educational purposes and is not a substitute for professional medical, mental-health, legal, or therapeutic advice.",
      "By continuing, you acknowledge that you are choosing to access this content at your own discretion.",
    ],
    age: "I confirm that I am 18 years of age or older.",
    content:
      "I understand and accept that this library may contain mature, sexual, sensitive, or potentially triggering relationship content.",
    agree: "I Agree — Enter Podcast Library",
    saving: "Saving your consent…",
    error: "We could not save your consent. Please try again.",
    privacy: "Your acceptance date and agreement version are saved to your account so you do not have to accept this notice every time.",
  },
  es: {
    loading: "Comprobando el acceso al contenido…",
    signInTitle: "Se requiere iniciar sesión",
    signInBody:
      "El consentimiento para contenido adulto y sensible se guarda en tu cuenta de One2OneLove, por lo que debes iniciar sesión antes de entrar en esta sección.",
    signIn: "Iniciar Sesión",
    createAccount: "Crear Cuenta",
    title: "Reconocimiento de Contenido Adulto y Sensible — 18+",
    paragraphs: [
      "La biblioteca de podcasts de One2OneLove incluye creadores independientes de terceros que hablan sobre relaciones, citas, matrimonio, sexualidad, intimidad, salud mental, identidad, infidelidad, trauma y otros temas adultos o sensibles.",
      "Algunos episodios pueden contener lenguaje explícito, conversaciones sexuales o material que algunas personas pueden considerar sensible, incómodo o desencadenante.",
      "El contenido de los podcasts representa las opiniones de sus creadores e invitados. One2OneLove y ERANT Property Services LLC no necesariamente respaldan esas opiniones y no son responsables de las declaraciones de creadores externos.",
      "El contenido se ofrece con fines informativos y educativos y no sustituye el asesoramiento profesional médico, de salud mental, legal o terapéutico.",
      "Al continuar, reconoces que eliges acceder a este contenido bajo tu propia discreción.",
    ],
    age: "Confirmo que tengo 18 años de edad o más.",
    content:
      "Entiendo y acepto que esta biblioteca puede contener contenido de relaciones maduro, sexual, sensible o potencialmente desencadenante.",
    agree: "Acepto — Entrar a la Biblioteca de Podcasts",
    saving: "Guardando tu consentimiento…",
    error: "No pudimos guardar tu consentimiento. Inténtalo de nuevo.",
    privacy: "La fecha de aceptación y la versión del acuerdo se guardan en tu cuenta para que no tengas que aceptar este aviso cada vez.",
  },
  fr: {
    loading: "Vérification de l’accès au contenu…",
    signInTitle: "Connexion requise",
    signInBody:
      "Le consentement au contenu adulte et sensible est enregistré dans votre compte One2OneLove. Vous devez donc être connecté avant d’accéder à cette section.",
    signIn: "Se Connecter",
    createAccount: "Créer un Compte",
    title: "Reconnaissance du Contenu Adulte et Sensible — 18+",
    paragraphs: [
      "La bibliothèque de podcasts One2OneLove comprend des créateurs tiers indépendants qui abordent les relations, les rencontres, le mariage, la sexualité, l’intimité, la santé mentale, l’identité, l’infidélité, les traumatismes et d’autres sujets adultes ou sensibles.",
      "Certains épisodes peuvent contenir un langage explicite, des discussions sexuelles ou du contenu que certaines personnes peuvent trouver sensible, inconfortable ou déclencheur.",
      "Le contenu des podcasts reflète les opinions des créateurs et des invités. One2OneLove et ERANT Property Services LLC ne cautionnent pas nécessairement ces opinions et ne sont pas responsables des déclarations faites par des créateurs tiers.",
      "Le contenu est fourni à des fins d’information et d’éducation et ne remplace pas les conseils professionnels médicaux, psychologiques, juridiques ou thérapeutiques.",
      "En continuant, vous reconnaissez choisir d’accéder à ce contenu à votre propre discrétion.",
    ],
    age: "Je confirme avoir 18 ans ou plus.",
    content:
      "Je comprends et j’accepte que cette bibliothèque puisse contenir du contenu relationnel adulte, sexuel, sensible ou potentiellement déclencheur.",
    agree: "J’Accepte — Entrer dans la Bibliothèque de Podcasts",
    saving: "Enregistrement de votre consentement…",
    error: "Nous n’avons pas pu enregistrer votre consentement. Veuillez réessayer.",
    privacy: "La date d’acceptation et la version de l’accord sont enregistrées dans votre compte afin que vous n’ayez pas à accepter cet avis à chaque visite.",
  },
  it: {
    loading: "Verifica dell’accesso ai contenuti…",
    signInTitle: "Accesso richiesto",
    signInBody:
      "Il consenso ai contenuti per adulti e sensibili viene salvato nel tuo account One2OneLove, quindi devi accedere prima di entrare in questa sezione.",
    signIn: "Accedi",
    createAccount: "Crea Account",
    title: "Riconoscimento di Contenuti per Adulti e Sensibili — 18+",
    paragraphs: [
      "La libreria podcast di One2OneLove include creatori indipendenti di terze parti che discutono di relazioni, appuntamenti, matrimonio, sessualità, intimità, salute mentale, identità, infedeltà, trauma e altri argomenti per adulti o sensibili.",
      "Alcuni episodi possono contenere linguaggio esplicito, discussioni sessuali o materiale che alcuni ascoltatori potrebbero trovare sensibile, scomodo o scatenante.",
      "Il contenuto dei podcast rappresenta le opinioni dei singoli creatori e ospiti. One2OneLove ed ERANT Property Services LLC non approvano necessariamente tali opinioni e non sono responsabili delle dichiarazioni di creatori terzi.",
      "Il contenuto è fornito a scopo informativo ed educativo e non sostituisce una consulenza professionale medica, di salute mentale, legale o terapeutica.",
      "Continuando, riconosci di scegliere di accedere a questi contenuti a tua discrezione.",
    ],
    age: "Confermo di avere almeno 18 anni.",
    content:
      "Comprendo e accetto che questa libreria possa contenere contenuti relazionali maturi, sessuali, sensibili o potenzialmente scatenanti.",
    agree: "Accetto — Entra nella Libreria Podcast",
    saving: "Salvataggio del consenso…",
    error: "Non siamo riusciti a salvare il tuo consenso. Riprova.",
    privacy: "La data di accettazione e la versione dell’accordo vengono salvate nel tuo account, così non dovrai accettare questo avviso ogni volta.",
  },
  de: {
    loading: "Inhaltszugang wird geprüft…",
    signInTitle: "Anmeldung erforderlich",
    signInBody:
      "Die Zustimmung zu Erwachsenen- und sensiblen Inhalten wird in Ihrem One2OneLove-Konto gespeichert. Bitte melden Sie sich an, bevor Sie diesen Bereich öffnen.",
    signIn: "Anmelden",
    createAccount: "Konto Erstellen",
    title: "Bestätigung für Erwachsene & Sensible Inhalte — 18+",
    paragraphs: [
      "Die One2OneLove-Podcastbibliothek enthält unabhängige Drittanbieter, die über Beziehungen, Dating, Ehe, Sexualität, Intimität, psychische Gesundheit, Identität, Untreue, Trauma und andere erwachsene oder sensible Themen sprechen.",
      "Einige Episoden können explizite Sprache, sexuelle Gespräche oder Inhalte enthalten, die manche Hörer als sensibel, unangenehm oder belastend empfinden.",
      "Podcast-Inhalte geben die Ansichten der jeweiligen Ersteller und Gäste wieder. One2OneLove und ERANT Property Services LLC unterstützen diese Ansichten nicht zwingend und sind nicht für Aussagen von Drittanbietern verantwortlich.",
      "Podcast-Inhalte dienen Informations- und Bildungszwecken und ersetzen keine professionelle medizinische, psychologische, rechtliche oder therapeutische Beratung.",
      "Mit dem Fortfahren bestätigen Sie, dass Sie sich freiwillig und nach eigenem Ermessen für den Zugriff auf diese Inhalte entscheiden.",
    ],
    age: "Ich bestätige, dass ich mindestens 18 Jahre alt bin.",
    content:
      "Ich verstehe und akzeptiere, dass diese Bibliothek erwachsene, sexuelle, sensible oder potenziell belastende Beziehungsinhalte enthalten kann.",
    agree: "Ich Stimme Zu — Podcastbibliothek Öffnen",
    saving: "Zustimmung wird gespeichert…",
    error: "Ihre Zustimmung konnte nicht gespeichert werden. Bitte versuchen Sie es erneut.",
    privacy: "Ihr Zustimmungsdatum und die Version der Vereinbarung werden in Ihrem Konto gespeichert, damit Sie diesen Hinweis nicht jedes Mal erneut akzeptieren müssen.",
  },
};

export default function AdultSensitiveContentGate({ children }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { currentLanguage } = useLanguage();
  const t = copy[currentLanguage] || copy.en;
  const [isChecking, setIsChecking] = useState(true);
  const [hasConsent, setHasConsent] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [contentConfirmed, setContentConfirmed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = useMemo(
    () => ageConfirmed && contentConfirmed && !isSaving,
    [ageConfirmed, contentConfirmed, isSaving]
  );

  useEffect(() => {
    let active = true;

    const checkConsent = async () => {
      if (isLoading) return;

      if (!isAuthenticated || !user?.id) {
        if (active) {
          setHasConsent(false);
          setIsChecking(false);
        }
        return;
      }

      setIsChecking(true);
      setError("");

      try {
        const { data, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;

        const consent = data?.user?.user_metadata?.adult_sensitive_content_consent;
        const accepted =
          consent?.version === ADULT_SENSITIVE_CONTENT_CONSENT_VERSION &&
          consent?.age_18_plus === true &&
          consent?.sensitive_content_acknowledged === true;

        if (active) setHasConsent(Boolean(accepted));
      } catch (checkError) {
        console.error("Adult content consent check failed:", checkError);
        if (active) setError(t.error);
      } finally {
        if (active) setIsChecking(false);
      }
    };

    checkConsent();
    return () => {
      active = false;
    };
  }, [isAuthenticated, isLoading, user?.id, t.error]);

  const acceptConsent = async () => {
    if (!canSubmit) return;

    setIsSaving(true);
    setError("");

    try {
      const acceptedAt = new Date().toISOString();
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          adult_sensitive_content_consent: {
            version: ADULT_SENSITIVE_CONTENT_CONSENT_VERSION,
            accepted_at: acceptedAt,
            age_18_plus: true,
            sensitive_content_acknowledged: true,
            source: "adult_sensitive_content_gate",
          },
        },
      });

      if (updateError) throw updateError;
      setHasConsent(true);
    } catch (saveError) {
      console.error("Adult content consent save failed:", saveError);
      setError(t.error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || isChecking) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 px-4">
        <div className="flex items-center gap-3 rounded-2xl bg-white px-6 py-5 shadow-lg text-gray-700">
          <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
          <span>{t.loading}</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 px-4 py-12">
        <div className="w-full max-w-xl rounded-3xl border border-purple-100 bg-white p-8 shadow-xl text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100">
            <ShieldCheck className="h-7 w-7 text-purple-700" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">{t.signInTitle}</h2>
          <p className="mt-3 text-sm leading-6 text-gray-600">{t.signInBody}</p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link to={createPageUrl("SignIn")}>
              <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 sm:w-auto">
                {t.signIn}
              </Button>
            </Link>
            <Link to={createPageUrl("SignUp")}>
              <Button variant="outline" className="w-full border-purple-200 text-purple-700 sm:w-auto">
                {t.createAccount}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (hasConsent) return children;

  return (
    <div className="min-h-[70vh] bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 px-4 py-12">
      <div className="mx-auto max-w-3xl rounded-3xl border border-purple-100 bg-white p-6 shadow-xl sm:p-9">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-100">
            <ShieldCheck className="h-6 w-6 text-purple-700" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">{t.title}</h2>
            <p className="mt-1 text-xs text-gray-500">Agreement version {ADULT_SENSITIVE_CONTENT_CONSENT_VERSION}</p>
          </div>
        </div>

        <div className="mt-7 space-y-4 text-sm leading-6 text-gray-700">
          {t.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>

        <div className="mt-7 space-y-4 rounded-2xl border border-purple-100 bg-purple-50/50 p-5">
          <label className="flex cursor-pointer items-start gap-3 text-sm leading-6 text-gray-800">
            <input
              type="checkbox"
              checked={ageConfirmed}
              onChange={(event) => setAgeConfirmed(event.target.checked)}
              className="mt-1 h-4 w-4 rounded border-gray-300 accent-purple-600"
            />
            <span>{t.age}</span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 text-sm leading-6 text-gray-800">
            <input
              type="checkbox"
              checked={contentConfirmed}
              onChange={(event) => setContentConfirmed(event.target.checked)}
              className="mt-1 h-4 w-4 rounded border-gray-300 accent-purple-600"
            />
            <span>{t.content}</span>
          </label>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <Button
          onClick={acceptConsent}
          disabled={!canSubmit}
          className="mt-6 w-full bg-gradient-to-r from-purple-600 to-pink-600 py-6 text-base font-semibold disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              {t.saving}
            </>
          ) : (
            t.agree
          )}
        </Button>

        <p className="mt-4 text-center text-xs leading-5 text-gray-500">{t.privacy}</p>
      </div>
    </div>
  );
}
