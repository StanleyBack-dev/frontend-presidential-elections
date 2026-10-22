import type { BallotOption, Candidate } from "../../../api/elections";

/** What the voter chose, in the shape the receipt draws it. */
export interface ReceiptChoice {
  kind: "CANDIDATE" | "BLANK" | "NULL_VOTE";
  title: string;
  /** "PL · 22" for candidates; null for blank/null. */
  subtitle: string | null;
  color: string;
  photoUrl: string | null;
}

export function toReceiptChoice(
  slug: string,
  candidates: Candidate[],
  otherOptions: BallotOption[],
): ReceiptChoice | null {
  const candidate = candidates.find((c) => c.slug === slug);
  if (candidate) {
    return {
      kind: "CANDIDATE",
      title: candidate.fullName,
      subtitle: `${candidate.party} · ${candidate.ballotNumber}`,
      color: candidate.color,
      photoUrl: candidate.photoUrl,
    };
  }

  const option = otherOptions.find((o) => o.slug === slug);
  if (option) {
    return {
      kind: option.kind,
      title: option.fullName,
      subtitle: null,
      color: option.color,
      photoUrl: null,
    };
  }

  return null;
}
