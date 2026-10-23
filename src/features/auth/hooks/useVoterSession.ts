import { useCallback, useEffect, useState } from "react";
import {
  getCurrentVoter,
  signInWithGoogle,
  signOut as requestSignOut,
  type Voter,
} from "../../../api/auth";

/**
 * Who is signed in with Google. Loaded once from the session cookie, so a
 * reload keeps the voter signed in until the session expires.
 */
export function useVoterSession() {
  const [voter, setVoter] = useState<Voter | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    getCurrentVoter()
      .then((current) => {
        if (!cancelled) setVoter(current);
      })
      .catch(() => {
        // No session (or the API is down): the form offers sign-in again.
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (idToken: string) => {
    const response = await signInWithGoogle(idToken);
    setVoter(response.data);
    return response.data;
  }, []);

  const signOut = useCallback(async () => {
    setVoter(null);
    try {
      await requestSignOut();
    } catch {
      // The cookie expires on its own; the UI is already signed out.
    }
  }, []);

  /** After a successful vote, or when the API says this account already voted. */
  const markVoted = useCallback(() => {
    setVoter((current) => current && { ...current, hasVoted: true });
  }, []);

  /** The API rejected the session (expired): forget it locally too. */
  const forget = useCallback(() => setVoter(null), []);

  return { voter, loading, signIn, signOut, markVoted, forget };
}
