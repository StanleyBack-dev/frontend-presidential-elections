import { useState } from "react";
import type { Candidate } from "../../../api/elections";

interface CandidatePhotoProps {
  candidate: Candidate;
  /** Tailwind size classes for the frame, e.g. "h-16 w-16". */
  className?: string;
}

/** Official TSE candidacy photo, falling back to the ballot number. */
export default function CandidatePhoto({
  candidate,
  className = "h-16 w-16",
}: CandidatePhotoProps) {
  const [failed, setFailed] = useState(false);

  if (!candidate.photoUrl || failed) {
    return (
      <span
        className={`flex shrink-0 items-center justify-center rounded-full text-xl font-bold text-white tabular-nums ${className}`}
        style={{ background: candidate.color }}
        aria-hidden
      >
        {candidate.ballotNumber}
      </span>
    );
  }

  return (
    <img
      src={candidate.photoUrl}
      alt={`Foto oficial de ${candidate.fullName}`}
      width={161}
      height={225}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={`shrink-0 rounded-full object-cover object-top ring-2 ring-offset-2 ${className}`}
      style={{ ["--tw-ring-color" as string]: candidate.color }}
    />
  );
}
