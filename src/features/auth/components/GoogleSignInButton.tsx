import { useState } from "react";
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import { Loader2 } from "lucide-react";
import { getHttpErrorMessage } from "../../../api/http-error";
import { useToast } from "../../../shared/toast";

// Public by design: it only identifies this site to Google.
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as
  string | undefined;

interface GoogleSignInButtonProps {
  onCredential: (idToken: string) => Promise<unknown>;
}

/** Google's official button; the ID token goes to our API, never stored here. */
export default function GoogleSignInButton({
  onCredential,
}: GoogleSignInButtonProps) {
  const { showError } = useToast();
  const [busy, setBusy] = useState(false);

  if (!GOOGLE_CLIENT_ID) {
    return (
      <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
        Login com Google não configurado (defina VITE_GOOGLE_CLIENT_ID).
      </p>
    );
  }

  async function handleCredential(idToken: string | undefined) {
    if (!idToken) {
      showError("Não foi possível entrar", "O Google não enviou a credencial.");
      return;
    }

    setBusy(true);
    try {
      await onCredential(idToken);
    } catch (error) {
      showError(
        "Não foi possível entrar",
        getHttpErrorMessage(error, "Tente novamente em instantes."),
        6000,
      );
    } finally {
      setBusy(false);
    }
  }

  if (busy) {
    return (
      <span className="flex min-h-[44px] items-center justify-center gap-2 text-sm text-slate-600">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        Entrando…
      </span>
    );
  }

  return (
    <div className="flex min-h-[44px] justify-center">
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID} locale="pt-BR">
        <GoogleLogin
          onSuccess={(response) => void handleCredential(response.credential)}
          onError={() =>
            showError("Não foi possível entrar", "Falha no login com o Google.")
          }
          theme="outline"
          size="large"
          shape="pill"
          text="continue_with"
        />
      </GoogleOAuthProvider>
    </div>
  );
}
