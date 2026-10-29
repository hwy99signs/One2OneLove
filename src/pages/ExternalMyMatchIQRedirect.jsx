import { useEffect } from 'react';

// Do not point One2OneLove visitors at the standalone app until the
// production database, production Neon Auth, and v33 Worker are certified.
// The current live launch address is workers.dev; switch to app.mymatchiq.com
// only after Cloudflare zone activation and custom-domain verification.
export const MYMATCHIQ_PRODUCTION_APP_URL = 'https://mymatchiq-app.hwy99signs.workers.dev/';

export default function ExternalMyMatchIQRedirect() {
  useEffect(() => {
    window.location.replace(MYMATCHIQ_PRODUCTION_APP_URL);
  }, []);

  return (
    <main className="min-h-[60vh] grid place-items-center bg-gradient-to-br from-indigo-950 to-violet-950 p-6 text-center text-white">
      <div>
        <h1 className="text-2xl font-bold">Opening MyMatchIQ</h1>
        <p className="mt-3 text-white/80">MyMatchIQ now opens in its dedicated app, with its own secure signup and login.</p>
        <a href={MYMATCHIQ_PRODUCTION_APP_URL} className="mt-5 inline-block rounded-full bg-fuchsia-600 px-6 py-3 font-bold text-white">Continue to MyMatchIQ</a>
      </div>
    </main>
  );
}
