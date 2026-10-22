import { useCallback, useState } from "react";
import { AlertTriangle, Loader2, Lock, Vote } from "lucide-react";
import { ToastProvider } from "./shared/toast/ToastProvider";
import { useElectionResults } from "./features/elections/hooks/useElectionResults";
import ResultsSummary from "./features/elections/components/ResultsSummary";
import AnalyticsSection from "./features/analytics/components/AnalyticsSection";
import VoteForm from "./features/elections/components/VoteForm";
import VotingCountdown from "./features/elections/components/VotingCountdown";

function ElectionPage() {
  const { results, error, loading, refresh } = useElectionResults();
  // Flips the instant the countdown hits zero, without waiting for the next
  // results poll (the backend rejects late votes regardless).
  const [deadlinePassed, setDeadlinePassed] = useState(false);
  const [analyticsRefreshKey, setAnalyticsRefreshKey] = useState(0);
  const votingOpen = Boolean(results?.votingOpen) && !deadlinePassed;

  const handleDeadline = useCallback(() => {
    setDeadlinePassed(true);
    void refresh();
  }, [refresh]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-white">
              <Vote className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <h1 className="text-lg font-bold leading-tight text-slate-900 sm:text-xl">
                Eleições Presidenciais 2026
              </h1>
              <p className="text-xs text-slate-500 sm:text-sm">
                Enquete popular · Brasil · 2º turno
              </p>
            </div>
          </div>
          {results && (
            <VotingCountdown
              closesAt={results.votingClosesAt}
              votingOpen={votingOpen}
              onExpire={handleDeadline}
            />
          )}
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-10 px-4 py-6 sm:py-8">
        <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>
            <strong>Enquete não oficial.</strong> Não é pesquisa eleitoral
            registrada no TSE e não tem valor estatístico: reflete apenas a
            opinião de quem participou por este site.
          </p>
        </div>

        <section aria-labelledby="results-heading">
          <h2
            id="results-heading"
            className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500"
          >
            Resultado parcial
          </h2>
          {loading && !results ? (
            <div className="flex h-40 items-center justify-center rounded-2xl border border-slate-200 bg-white">
              <Loader2
                className="h-6 w-6 animate-spin text-slate-400"
                aria-label="Carregando"
              />
            </div>
          ) : results ? (
            <ResultsSummary results={results} />
          ) : (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
              {error}{" "}
              <button
                type="button"
                className="font-semibold underline"
                onClick={() => void refresh()}
              >
                Tentar novamente
              </button>
            </div>
          )}
        </section>

        {results && (
          <section aria-labelledby="vote-heading">
            <h2
              id="vote-heading"
              className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500"
            >
              Vote
            </h2>
            <VoteForm
              candidates={results.candidates}
              otherOptions={results.otherOptions}
              votingOpen={votingOpen}
              onVoted={() => {
                void refresh();
                setAnalyticsRefreshKey((key) => key + 1);
              }}
            />
          </section>
        )}

        {results && <AnalyticsSection refreshKey={analyticsRefreshKey} />}
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-start gap-2 px-4 py-6 text-xs text-slate-500">
          <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          <p>
            Privacidade: o CPF é usado só para impedir votos duplicados e fica
            guardado apenas como código criptográfico irreversível, separado do
            voto. A data de nascimento serve apenas para confirmar a identidade
            e não é armazenada.
          </p>
        </div>
        <p className="mx-auto max-w-6xl px-4 pb-6 text-xs text-slate-400">
          Nomes e fotos oficiais de candidatura: Tribunal Superior Eleitoral
          (Portal de Dados Abertos do TSE).
        </p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <ElectionPage />
    </ToastProvider>
  );
}
