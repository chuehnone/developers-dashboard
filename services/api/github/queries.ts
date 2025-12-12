export const GET_ORGANIZATION_PULL_REQUESTS = `
  query GetOrgPullRequests($org: String!, $first: Int = 20) {
    organization(login: $org) {
      repositories(first: 10, orderBy: {field: UPDATED_AT, direction: DESC}) {
        nodes {
          name
          pullRequests(first: $first, orderBy: {field: UPDATED_AT, direction: DESC}, states: [MERGED]) {
            nodes {
              number
              title
              state
              createdAt
              updatedAt
              mergedAt
              additions
              deletions
              author {
                login
              }
              reviews(first: 3) {
                nodes {
                  author {
                    login
                  }
                  createdAt
                }
              }
              commits(first: 1) {
                nodes {
                  commit {
                    committedDate
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

export const GET_USER_CONTRIBUTIONS = `
  query GetUserContributions($login: String!, $from: DateTime!, $to: DateTime!) {
    user(login: $login) {
      login
      name
      avatarUrl
      contributionsCollection(from: $from, to: $to) {
        totalCommitContributions
        totalPullRequestContributions
        totalPullRequestReviewContributions
        restrictedContributionsCount
        pullRequestContributionsByRepository {
          repository {
            name
          }
          contributions {
            totalCount
          }
        }
        commitContributionsByRepository {
          repository {
            name
          }
          contributions {
            totalCount
          }
        }
        pullRequestReviewContributionsByRepository {
          repository {
            name
          }
          contributions {
            totalCount
          }
        }
      }
    }
  }
`;

export const GET_ORGANIZATION_MEMBERS = `
  query GetOrgMembers($org: String!, $first: Int = 100) {
    organization(login: $org) {
      membersWithRole(first: $first) {
        nodes {
          login
          name
          avatarUrl
          email
        }
      }
    }
  }
`;

export const GET_PULL_REQUEST_DETAILS = `
  query GetPullRequestDetails($owner: String!, $repo: String!, $number: Int!) {
    repository(owner: $owner, name: $repo) {
      pullRequest(number: $number) {
        number
        title
        state
        createdAt
        updatedAt
        mergedAt
        closedAt
        additions
        deletions
        author {
          login
        }
        commits(first: 100) {
          nodes {
            commit {
              committedDate
              author {
                user {
                  login
                }
              }
            }
          }
        }
        reviews(first: 50) {
          nodes {
            author {
              login
            }
            createdAt
            state
            comments {
              totalCount
            }
          }
        }
        timelineItems(first: 100) {
          nodes {
            __typename
            ... on ReadyForReviewEvent {
              createdAt
            }
            ... on ReviewRequestedEvent {
              createdAt
              requestedReviewer {
                ... on User {
                  login
                }
              }
            }
            ... on PullRequestReview {
              createdAt
              state
              author {
                login
              }
            }
          }
        }
      }
    }
  }
`;

export const GET_REPOSITORY_ACTIVITY = `
  query GetRepoActivity($owner: String!, $repo: String!, $since: GitTimestamp!) {
    repository(owner: $owner, name: $repo) {
      name
      defaultBranchRef {
        target {
          ... on Commit {
            history(first: 100, since: $since) {
              nodes {
                committedDate
                author {
                  user {
                    login
                  }
                }
                additions
                deletions
              }
            }
          }
        }
      }
    }
  }
`;

export const SEARCH_RECENT_PULL_REQUESTS = `
  query SearchRecentPRs($query: String!, $first: Int = 100) {
    search(query: $query, type: ISSUE, first: $first) {
      nodes {
        ... on PullRequest {
          number
          title
          state
          createdAt
          updatedAt
          mergedAt
          closedAt
          additions
          deletions
          repository {
            name
            owner {
              login
            }
          }
          author {
            login
          }
          reviews(first: 10) {
            nodes {
              author {
                login
              }
              createdAt
              state
            }
          }
          comments {
            totalCount
          }
          commits(first: 1) {
            nodes {
              commit {
                committedDate
              }
            }
          }
        }
      }
    }
  }
`;
