import { executeGraphql } from "../../../shared/http/graphql-client.js";

const VOTER_FIELDS = `
  name
  email
  pictureUrl
  hasVoted
`;

export class AuthService {
  async signInWithGoogle(idToken, { clientIp, requestId }) {
    const mutation = `
      mutation SignInWithGoogle($input: SignInWithGoogleInputDto!) {
        signInWithGoogle(input: $input) {
          success
          message
          code
          data {
            sessionToken
            expiresAt
            voter { ${VOTER_FIELDS} }
          }
        }
      }
    `;

    const data = await executeGraphql({
      query: mutation,
      variables: { input: { idToken } },
      clientIp,
      requestId,
    });
    return data.signInWithGoogle;
  }

  async currentVoter({ clientIp, requestId, sessionToken }) {
    const query = `
      query CurrentVoter {
        currentVoter {
          success
          message
          code
          data { ${VOTER_FIELDS} }
        }
      }
    `;

    const data = await executeGraphql({
      query,
      clientIp,
      requestId,
      sessionToken,
    });
    return data.currentVoter;
  }
}
