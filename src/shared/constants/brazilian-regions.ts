import type { BrazilianRegion } from "../../api/elections";

export const REGION_OPTIONS: Array<{
  value: BrazilianRegion;
  label: string;
  states: string[];
}> = [
  {
    value: "NORTE",
    label: "Norte",
    states: ["AC", "AP", "AM", "PA", "RO", "RR", "TO"],
  },
  {
    value: "NORDESTE",
    label: "Nordeste",
    states: ["AL", "BA", "CE", "MA", "PB", "PE", "PI", "RN", "SE"],
  },
  {
    value: "CENTRO_OESTE",
    label: "Centro-Oeste",
    states: ["DF", "GO", "MT", "MS"],
  },
  { value: "SUDESTE", label: "Sudeste", states: ["ES", "MG", "RJ", "SP"] },
  { value: "SUL", label: "Sul", states: ["PR", "RS", "SC"] },
];

export const STATE_REGION: Record<string, BrazilianRegion> = Object.fromEntries(
  REGION_OPTIONS.flatMap((region) =>
    region.states.map((state) => [state, region.value]),
  ),
);
