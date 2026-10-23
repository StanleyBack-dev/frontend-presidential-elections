import type { ApiResponse } from "./elections";
import { httpClient } from "./httpClient";

/** The signed-in Google account. Shown in the form; never stored by us. */
export interface Voter {
  name: string;
  email: string;
  pictureUrl: string | null;
  hasVoted: boolean;
}

/** Trades the Google credential for a session (an httpOnly cookie). */
export async function signInWithGoogle(
  idToken: string,
): Promise<ApiResponse<Voter>> {
  const response = await httpClient.post<ApiResponse<Voter>>(
    "/api/auth/google",
    { idToken },
  );
  return response.data;
}

export async function getCurrentVoter(): Promise<Voter | null> {
  const response =
    await httpClient.get<ApiResponse<Voter | null>>("/api/auth/me");
  return response.data.data;
}

export async function signOut(): Promise<void> {
  await httpClient.post("/api/auth/logout");
}
