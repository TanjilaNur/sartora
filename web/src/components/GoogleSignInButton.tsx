import { useEffect, useRef } from 'react';

interface GoogleCredentialResponse {
  credential: string;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
          }) => void;
          renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
        };
      };
    };
  }
}

// Placeholder allows the app to boot; replace VITE_GOOGLE_CLIENT_ID with your
// real OAuth client ID before going live (same convention as the mobile app's
// and this web app's Stripe key — see stripe.ts).
const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID || 'replace-with-your-google-client-id.apps.googleusercontent.com';

// hl=en pins the button label's language — otherwise Google renders it in
// whatever locale the browser/OS reports, which would read oddly next to an
// otherwise all-English storefront.
const SCRIPT_SRC = 'https://accounts.google.com/gsi/client?hl=en';
let scriptLoadPromise: Promise<void> | null = null;

function loadGoogleScript(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (scriptLoadPromise) return scriptLoadPromise;
  scriptLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Sign-In script'));
    document.head.appendChild(script);
  });
  return scriptLoadPromise;
}

export function GoogleSignInButton({ onCredential }: { onCredential: (idToken: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  // Holds the latest callback so the setup effect below can run exactly once
  // (avoiding a re-render, e.g. from typing in nearby form fields, tearing
  // down and re-mounting Google's own button) while still always invoking
  // whatever the current onCredential prop is.
  const onCredentialRef = useRef(onCredential);
  onCredentialRef.current = onCredential;

  useEffect(() => {
    let cancelled = false;
    loadGoogleScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.google) return;
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) => onCredentialRef.current(response.credential),
        });
        window.google.accounts.id.renderButton(containerRef.current, {
          theme: 'outline',
          size: 'large',
          width: 320,
          text: 'signin_with',
        });
      })
      .catch(() => {
        // Non-critical — the rest of the auth page still works without it.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return <div ref={containerRef} className="flex justify-center" />;
}
