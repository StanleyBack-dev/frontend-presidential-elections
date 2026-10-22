const integerFormatter = new Intl.NumberFormat("pt-BR");
const percentFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const timeFormatter = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

export const formatInteger = (value: number) => integerFormatter.format(value);
export const formatPercent = (value: number) =>
  `${percentFormatter.format(value)}%`;
export const formatTime = (iso: string) => timeFormatter.format(new Date(iso));

/** "1 voto" / "2 votos". */
export const formatVotes = (value: number) =>
  `${integerFormatter.format(value)} ${value === 1 ? "voto" : "votos"}`;
