import { useRef, useState, type FormEvent } from "react";
import { CheckCircle2, Loader2, Receipt, ShieldCheck } from "lucide-react";
import {
  castVote,
  type BallotOption,
  type Candidate,
} from "../../../api/elections";
import { getHttpErrorMessage } from "../../../api/http-error";
import { BRAZILIAN_STATE_OPTIONS } from "../../../shared/constants/brazilian-states";
import { useToast } from "../../../shared/toast";
import {
  birthDateToIso,
  maskBirthDate,
} from "../../../shared/utils/birth-date";
import { isValidCpf, maskCpf, onlyDigits } from "../../../shared/utils/cpf";
import CandidatePhoto from "./CandidatePhoto";
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

  const [candidateSlug, setCandidateSlug] = useState("");
  const [cpf, setCpf] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [state, setState] = useState("");
  const [consent, setConsent] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [voted, setVoted] = useState(readVotedFlag);
  const [storedReceipt, setStoredReceipt] = useState(readStoredReceipt);
  const [openReceipt, setOpenReceipt] = useState<VoteReceipt | null>(null);

  const cpfComplete = onlyDigits(cpf).length === 11;
  const cpfError = cpfComplete && !isValidCpf(cpf) ? "CPF inválido." : null;
  const birthDateIso = birthDateToIso(birthDate);
  const birthDateError =
    birthDate.length === 10 && !birthDateIso ? "Data inválida." : null;

  const canSubmit =
    votingOpen &&
    !submitting &&
    Boolean(candidateSlug) &&
    cpfComplete &&
    !cpfError &&
    Boolean(birthDateIso) &&
    Boolean(state) &&
    consent &&
    (!TURNSTILE_SITE_KEY || Boolean(captchaToken));

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit || !birthDateIso) return;

    setSubmitting(true);
    try {
      const response = await castVote({
        cpf: onlyDigits(cpf),
        birthDate: birthDateIso,
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
      setCpf("");
      setBirthDate("");
      showSuccess("Voto registrado!", response.message);
      onVoted();
    } catch (error) {
      showError(
        "Não foi possível registrar o voto",
        getHttpErrorMessage(error, "Tente novamente em instantes."),
        6000,
      );
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

  if (voted) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center shadow-sm">
        <CheckCircle2 className="h-10 w-10 text-emerald-600" aria-hidden />
        <p className="text-lg font-semibold text-emerald-900">
          Seu voto foi registrado neste dispositivo.
        </p>
        <p className="max-w-md text-sm text-emerald-800">
          Cada CPF pode votar uma única vez. Acompanhe os resultados em tempo
          real abaixo.
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
          onClick={() => setVoted(false)}
        >
          Votar com outro CPF
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
          2. Confirme seus dados
        </legend>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="CPF" error={cpfError}>
            <input
              inputMode="numeric"
              autoComplete="off"
              placeholder="000.000.000-00"
              value={cpf}
              onChange={(e) => setCpf(maskCpf(e.target.value))}
              className={inputClass(Boolean(cpfError))}
              maxLength={14}
              required
            />
          </Field>
          <Field label="Data de nascimento" error={birthDateError}>
            <input
              inputMode="numeric"
              autoComplete="bday"
              placeholder="DD/MM/AAAA"
              value={birthDate}
              onChange={(e) => setBirthDate(maskBirthDate(e.target.value))}
              className={inputClass(Boolean(birthDateError))}
              maxLength={10}
              required
            />
          </Field>
          <Field label="Estado onde vota">
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
          </Field>
        </div>
      </fieldset>

      <label className="mt-5 flex items-start gap-3 text-sm text-slate-600">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300"
        />
        <span>
          Autorizo o uso do meu CPF e data de nascimento apenas para confirmar
          minha identidade e impedir votos duplicados. O CPF é guardado somente
          como código criptográfico irreversível, sem vínculo com o voto, e a
          data de nascimento não é armazenada (LGPD).
        </span>
      </label>

      {TURNSTILE_SITE_KEY && (
        <div className="mt-5">
          <TurnstileWidget
            ref={turnstileRef}
            siteKey={TURNSTILE_SITE_KEY}
            onToken={setCaptchaToken}
          />
        </div>
      )}

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
        {submitting ? "Validando CPF..." : "Confirmar voto"}
      </button>
    </form>
  );
}

function inputClass(hasError: boolean) {
  return `w-full rounded-lg border bg-white px-3 py-2.5 text-base text-slate-900 outline-none transition focus:ring-2 ${
    hasError
      ? "border-red-400 focus:ring-red-200"
      : "border-slate-300 focus:border-emerald-600 focus:ring-emerald-100"
  }`;
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string | null;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </span>
      {children}
      {error && (
        <span className="mt-1 block text-xs text-red-600">{error}</span>
      )}
    </label>
  );
}
