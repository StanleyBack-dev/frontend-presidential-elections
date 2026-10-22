import { executeGraphql } from "../../../shared/http/graphql-client.js";

const CANDIDATE_FIELDS = `
  slug
  name
  fullName
  photoUrl
  party
  ballotNumber
  color
`;

export class ElectionsService {
  async getCandidates({ clientIp, requestId }) {
    const query = `
      query Candidates {
        candidates {
          success
          message
          code
          data { ${CANDIDATE_FIELDS} }
        }
      }
    `;

    const data = await executeGraphql({ query, clientIp, requestId });
    return data.candidates;
  }

  async getResults({ clientIp, requestId }) {
    const query = `
      query ElectionResults {
        electionResults {
          success
          message
          code
          data {
            totalVotes
            validVotes
            blankVotes
            nullVotes
            blankPercentage
            nullPercentage
            votingOpen
            votingClosesAt
            updatedAt
            candidates {
              ${CANDIDATE_FIELDS}
              votes
              percentage
            }
            otherOptions {
              slug
              name
              fullName
              kind
              color
            }
            states {
              state
              totalVotes
              validVotes
              blankVotes
              nullVotes
              candidates {
                slug
                votes
                percentage
              }
            }
          }
        }
      }
    `;

    const data = await executeGraphql({ query, clientIp, requestId });
    return data.electionResults;
  }

  async getAnalytics(filter, { clientIp, requestId }) {
    const query = `
      query ElectionAnalytics($filter: ElectionAnalyticsFilterInput) {
        electionAnalytics(filter: $filter) {
          success
          message
          code
          data {
            summary {
              totalVotes
              validVotes
              blankVotes
              nullVotes
              blankPercentage
              nullPercentage
              nationalVotes
              shareOfNational
              leaderSlug
              marginVotes
              marginPoints
              statesWon { slug states }
              tiedStates
              statesWithoutVotes
            }
            candidates {
              ${CANDIDATE_FIELDS}
              votes
              percentage
            }
            regions {
              region
              label
              totalVotes
              validVotes
              blankVotes
              nullVotes
              leaderSlug
              marginPoints
              candidates { slug votes percentage }
            }
            states {
              state
              region
              totalVotes
              validVotes
              blankVotes
              nullVotes
              shareOfSlice
              leaderSlug
              marginVotes
              marginPoints
              candidates { slug votes percentage }
            }
            granularity
            timeline {
              at
              totalVotes
              cumulativeTotal
              cumulativeValid
              candidates { slug votes cumulativeVotes cumulativePercentage }
            }
            updatedAt
          }
        }
      }
    `;

    const data = await executeGraphql({
      query,
      variables: { filter },
      clientIp,
      requestId,
    });
    return data.electionAnalytics;
  }

  async castVote(input, { clientIp, requestId }) {
    const mutation = `
      mutation CastVote($input: CastVoteInputDto!) {
        castVote(input: $input) {
          success
          message
          code
          data {
            registered
            candidateSlug
            state
            votedAt
          }
        }
      }
    `;

    const data = await executeGraphql({
      query: mutation,
      variables: { input },
      clientIp,
      requestId,
    });
    return data.castVote;
  }
}
