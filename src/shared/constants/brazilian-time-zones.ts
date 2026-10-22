/**
 * IANA time zone of each state's capital. Local times are always derived
 * with Intl from these zones (never from hard-coded offsets), so they stay
 * correct even if Brazil's time rules change again.
 */
export const STATE_TIME_ZONES: Record<string, string> = {
  AC: "America/Rio_Branco",
  AL: "America/Maceio",
  AP: "America/Belem",
  AM: "America/Manaus",
  BA: "America/Bahia",
  CE: "America/Fortaleza",
  DF: "America/Sao_Paulo",
  ES: "America/Sao_Paulo",
  GO: "America/Sao_Paulo",
  MA: "America/Fortaleza",
  MT: "America/Cuiaba",
  MS: "America/Campo_Grande",
  MG: "America/Sao_Paulo",
  PA: "America/Belem",
  PB: "America/Fortaleza",
  PR: "America/Sao_Paulo",
  PE: "America/Recife",
  PI: "America/Fortaleza",
  RJ: "America/Sao_Paulo",
  RN: "America/Fortaleza",
  RS: "America/Sao_Paulo",
  RO: "America/Porto_Velho",
  RR: "America/Boa_Vista",
  SC: "America/Sao_Paulo",
  SP: "America/Sao_Paulo",
  SE: "America/Maceio",
  TO: "America/Araguaina",
};

export const BRASILIA_TIME_ZONE = "America/Sao_Paulo";

/** Areas whose clock differs from their state capital's. */
export const TIME_ZONE_EXCEPTIONS = [
  {
    zone: "America/Eirunepe",
    label: "Sudoeste do Amazonas (região de Eirunepé)",
  },
  { zone: "America/Noronha", label: "Fernando de Noronha (PE)" },
] as const;
