import { useRef, useState, type FormEvent } from "react";
import {
  CheckCircle2,
  Loader2,
  LogOut,
  Receipt,
  ShieldCheck,
} from "lucide-react";
import type { Voter } from "../../../api/auth";
import {
  castVote,
  type BallotOption,
  type Candidate,
} from "../../../api/elections";
import { getHttpErrorCode, getHttpErrorMessage } from "../../../api/http-error";
import { BRAZILIAN_STATE_OPTIONS } from "../../../shared/constants/brazilian-states";
import { useToast } from "../../../shared/toast";
import GoogleSignInButton from "../../auth/components/GoogleSignInButton";
import { useVoterSession } from "../../auth/hooks/useVoterSession";
import CandidatePhoto from "./CandidatePhoto";
import FormField from "./FormField";
import { inputClass } from "./form-styles";
import TurnstileWidget, { type TurnstileHandle } from "./TurnstileWidget";
import ReceiptModal, {
  type VoteReceipt,
} from "../../receipt/components/ReceiptModal";
import { toReceiptChoice } from "../../receipt/utils/receipt-choice";

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as
  string | undefined;
const VOTED_STORAGE_KEY = "eleicoes2026:voted";
const RECEIPT_STORAGE_KEY = "eleicoes2026:receipt";

/**
 * What this device remembers about its own vote, so the receipt can be
 * reopened later. Lives only in this browser's localStorage — never sent
 * anywhere — and holds the chosen option's slug (e.g. "lula", "branco")
 * so the voter can show their vote again; they can still hide it.
 */
type StoredReceipt = Pick<VoteReceipt, "state" | "votedAt"> & {
  choiceSlug?: string;
};

function readStoredReceipt(): StoredReceipt | null {
  try {
    const raw = window.localStorage.getItem(RECEIPT_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<StoredReceipt>) : null;
    if (
      typeof parsed?.state !== "string" ||
      typeof parsed.votedAt !== "string"
    ) {
      return null;
    }
    return {
      state: parsed.state,
      votedAt: parsed.votedAt,
      choiceSlug:
        typeof parsed.choiceSlug === "string" &&
        /^[a-z0-9-]{1,40}$/.test(parsed.choiceSlug)
          ? parsed.choiceSlug
          : undefined,
    };
  } catch {
    return null;
  }
}

function storeReceipt(receipt: StoredReceipt) {
  try {
    window.localStorage.setItem(RECEIPT_STORAGE_KEY, JSON.stringify(receipt));
  } catch {
    // Storage unavailable: the receipt is still shown for this session.
  }
}

function readVotedFlag(): boolean {
  try {
    return window.localStorage.getItem(VOTED_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function writeVotedFlag() {
  try {
    // Only "already voted" is remembered on this device — never the choice.
    window.localStorage.setItem(VOTED_STORAGE_KEY, "1");
  } catch {
    // Storage unavailable (private mode): the server is the source of truth.
  }
}

interface VoteFormProps {
  candidates: Candidate[];
  /** Voto em branco / voto nulo. */
  otherOptions: BallotOption[];
  votingOpen: boolean;
  onVoted: () => void;
}

export default function VoteForm({
  candidates,
  otherOptions,
  votingOpen,
  onVoted,
}: VoteFormProps) {
  const { showError, showSuccess } = useToast();
  const turnstileRef = useRef<TurnstileHandle>(null);
  const session = useVoterSession();
  const { voter } = session;

  const [candidateSlug, setCandidateSlug] = useState("");
  const [state, setState] = useState("");
  const [consent, setConsent] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [voted, setVoted] = useState(readVotedFlag);
  const [storedReceipt, setStoredReceipt] = useState(readStoredReceipt);
  const [openReceipt, setOpenReceipt] = useState<VoteReceipt | null>(null);

  const captchaReady = !TURNSTILE_SITE_KEY || Boolean(captchaToken);

  // What still blocks the vote, in the order the form asks for it.
  const missingSteps = [
    !candidateSlug && "escolha uma opção de voto",
    !state && "selecione o estado",
    !consent && "aceite o aviso de privacidade",
    !captchaReady && "conclua a verificação anti-robô",
  ].filter((step): step is string => Boolean(step));

  const canSubmit =
    votingOpen && !submitting && Boolean(voter) && missingSteps.length === 0;

  async function handleSignIn(idToken: string) {
    const signedIn = await session.signIn(idToken);
    if (signedIn.hasVoted) {
      showError(
        "Esta conta já votou",
        "Cada conta Google pode votar uma única vez.",
        6000,
      );
    } else {
      showSuccess("Conta conectada", `Votando como ${signedIn.name}.`);
    }
  }

  async function handleSwitchAccount() {
    await session.signOut();
    setVoted(false);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    try {
      const response = await castVote({
        candidateSlug,
        state,
        privacyConsent: true,
        captchaToken: captchaToken ?? undefined,
      });

      writeVotedFlag();
      const receipt: StoredReceipt = {
        state: response.data.state,
        votedAt: response.data.votedAt,
        choiceSlug: candidateSlug,
      };
      storeReceipt(receipt);
      setStoredReceipt(receipt);
      setOpenReceipt({
        state: receipt.state,
        votedAt: receipt.votedAt,
        choice: toReceiptChoice(candidateSlug, candidates, otherOptions),
      });
      setVoted(true);
      session.markVoted();
      showSuccess("Voto registrado!", response.message);
      onVoted();
    } catch (error) {
      showError(
        "Não foi possível registrar o voto",
        getHttpErrorMessage(error, "Tente novamente em instantes."),
        6000,
      );

      const code = getHttpErrorCode(error);
      if (code === "AUTH_REQUIRED") session.forget();
      if (code === "VOTE_ALREADY_CAST") session.markVoted();
      // Turnstile tokens are single-use.
      turnstileRef.current?.reset();
    } finally {
      setSubmitting(false);
    }
  }

  const receiptModal = openReceipt && (
    <ReceiptModal receipt={openReceipt} onClose={() => setOpenReceipt(null)} />
  );

  if (!votingOpen) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <p className="text-lg font-semibold text-slate-900">
          A votação está encerrada.
        </p>
        <p className="mt-1 text-sm text-slate-600">
          Acompanhe abaixo o resultado final da enquete.
        </p>
        {receiptModal}
      </div>
    );
  }

  if (voted || voter?.hasVoted) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center shadow-sm">
        <CheckCircle2 className="h-10 w-10 text-emerald-600" aria-hidden />
        <p className="text-lg font-semibold text-emerald-900">
          {voted
            ? "Seu voto foi registrado neste dispositivo."
            : "Esta conta Google já registrou um voto."}
        </p>
        <p className="max-w-md text-sm text-emerald-800">
          Cada conta Google pode votar uma única vez. Acompanhe os resultados em
          tempo real abaixo.
        </p>
        {storedReceipt && (
          <button
            type="button"
            onClick={() =>
              setOpenReceipt({
                state: storedReceipt.state,
                votedAt: storedReceipt.votedAt,
                choice: storedReceipt.choiceSlug
                  ? toReceiptChoice(
                      storedReceipt.choiceSlug,
                      candidates,
                      otherOptions,
                    )
                  : null,
              })
            }
            className="mt-1 flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
          >
            <Receipt className="h-4 w-4" aria-hidden />
            Ver e compartilhar meu comprovante
          </button>
        )}
        <button
          type="button"
          className="text-xs font-medium text-emerald-700 underline underline-offset-2"
          onClick={() => void handleSwitchAccount()}
        >
          Votar com outra conta Google
        </button>
        {receiptModal}
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
      noValidate
    >
      <fieldset>
        <legend className="text-sm font-semibold text-slate-900">
          1. Escolha seu voto
        </legend>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {candidates.map((candidate) => {
            const selected = candidate.slug === candidateSlug;
            return (
              <label
                key={candidate.slug}
                className={`flex cursor-pointer items-center gap-4 rounded-xl border-2 p-4 transition ${
                  selected
                    ? "shadow-md"
                    : "border-slate-200 hover:border-slate-300"
                }`}
                style={
                  selected
                    ? {
                        borderColor: candidate.color,
                        background: `${candidate.color}0D`,
                      }
                    : undefined
                }
              >
                <input
                  type="radio"
                  name="candidate"
                  value={candidate.slug}
                  checked={selected}
                  onChange={() => setCandidateSlug(candidate.slug)}
                  className="sr-only"
                />
                <CandidatePhoto candidate={candidate} className="h-16 w-16" />
                <span className="min-w-0">
                  <span className="block text-base font-semibold leading-snug text-slate-900">
                    {candidate.fullName}
                  </span>
                  <span className="mt-0.5 block text-sm text-slate-500">
                    {candidate.party} ·{" "}
                    <span
                      className="font-bold tabular-nums"
                      style={{ color: candidate.color }}
                    >
                      nº {candidate.ballotNumber}
                    </span>
                  </span>
                </span>
              </label>
            );
          })}
        </div>

        {otherOptions.length > 0 && (
          <div className="mt-3 grid grid-cols-2 gap-3">
            {otherOptions.map((option) => {
              const selected = option.slug === candidateSlug;
              return (
                <label
                  key={option.slug}
                  className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 px-3 py-3 text-sm font-semibold transition ${
                    selected
                      ? "border-slate-700 bg-slate-100 text-slate-900 shadow-sm"
                      : "border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="candidate"
                    value={option.slug}
                    checked={selected}
                    onChange={() => setCandidateSlug(option.slug)}
                    className="sr-only"
                  />
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                      selected ? "border-slate-700" : "border-slate-300"
                    }`}
                    aria-hidden
                  >
                    {selected && (
                      <span className="h-2 w-2 rounded-full bg-slate-700" />
                    )}
                  </span>
                  {option.kind === "BLANK" ? "Votar em branco" : "Votar nulo"}
                </label>
              );
            })}
          </div>
        )}
      </fieldset>

      <fieldset className="mt-6">
        <legend className="text-sm font-semibold text-slate-900">
          2. Onde você vota
        </legend>
        <div className="mt-3 sm:max-w-xs">
          <FormField label="Estado">
            <select
              value={state}
              onChange={(e) => setState(e.target.value)}
              className={inputClass(false)}
              required
            >
              <option value="">Selecione</option>
              {BRAZILIAN_STATE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.value} — {option.label}
                </option>
              ))}
            </select>
          </FormField>
        </div>
      </fieldset>

      <fieldset className="mt-6">
        <legend className="text-sm font-semibold text-slate-900">
          3. Confirme com sua conta Google
        </legend>
        <p className="mt-1 text-xs text-slate-500">
          Cada conta Google vota uma única vez.
        </p>

        {voter && (
          <VoterBadge
            voter={voter}
            onSwitch={() => void handleSwitchAccount()}
          />
        )}

        <label className="mt-4 flex items-start gap-3 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300"
          />
          <span>
            Declaro ter 16 anos ou mais e autorizo o uso da minha conta Google
            apenas para impedir votos duplicados. Guardamos somente um código
            criptográfico irreversível da conta, nunca seu nome ou e-mail, e sem
            vínculo com o voto (LGPD).
          </span>
        </label>

        {TURNSTILE_SITE_KEY && (
          <div className="mt-4">
            <TurnstileWidget
              ref={turnstileRef}
              siteKey={TURNSTILE_SITE_KEY}
              onToken={setCaptchaToken}
            />
          </div>
        )}
      </fieldset>

      {session.loading ? (
        <div className="mt-6 flex justify-center text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" aria-label="Carregando" />
        </div>
      ) : voter ? (
        <>
          <button
            type="submit"
            disabled={!canSubmit}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {submitting ? (
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
            ) : (
              <ShieldCheck className="h-5 w-5" aria-hidden />
            )}
            {submitting ? "Registrando voto..." : "Confirmar voto"}
          </button>
          {votingOpen && !submitting && missingSteps.length > 0 && (
            <p className="mt-2 text-center text-xs text-slate-500">
              Para votar: {missingSteps.join(", ")}.
            </p>
          )}
        </>
      ) : (
        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
          <p className="mb-3 text-sm font-medium text-slate-700">
            Para confirmar o voto, entre com sua conta Google.
          </p>
          <GoogleSignInButton onCredential={handleSignIn} />
        </div>
      )}
    </form>
  );
}

function VoterBadge({
  voter,
  onSwitch,
}: {
  voter: Voter;
  onSwitch: () => void;
}) {
  return (
    <div className="mt-3 flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5">
      {voter.pictureUrl ? (
        <img
          src={voter.pictureUrl}
          alt=""
          referrerPolicy="no-referrer"
          className="h-9 w-9 shrink-0 rounded-full"
        />
      ) : (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-semibold text-white">
          {voter.name.charAt(0).toUpperCase()}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-emerald-900">
          Votando como {voter.name}
        </span>
        <span className="block truncate text-xs text-emerald-800">
          {voter.email}
        </span>
      </span>
      <button
        type="button"
        onClick={onSwitch}
        className="flex shrink-0 items-center gap-1 text-xs font-medium text-emerald-700 underline underline-offset-2"
      >
        <LogOut className="h-3.5 w-3.5" aria-hidden />
        Sair
      </button>
    </div>
  );
}
