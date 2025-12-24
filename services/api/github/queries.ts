export const GET_ORGANIZATION_PULL_REQUESTS = `
  query GetOrgPullRequests($org: String!, $first: Int = 20) {
    organization(login: $org) {
      login
      repositories(first: 10, orderBy: {field: UPDATED_AT, direction: DESC}) {
        nodes {
          name
          owner {
            login
          }
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
              milestone {
                title
                number
                state
              }
              author {
                login
              }
              reviews(first: 50) {
                nodes {
                  author {
                    login
                  }
                  createdAt
                }
              }
              comments(first: 100) {
                nodes {
                  author {
                    login
                  }
                  createdAt
                }
              }
              timelineItems(first: 100, itemTypes: ISSUE_COMMENT) {
                nodes {
                  __typename
                  ... on IssueComment {
                    author {
                      login
                    }
                    createdAt
                  }
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
      teams(first: 50) {
        nodes {
          name
          slug
          members(first: 100) {
            nodes {
              login
            }
          }
        }
      }
    }
  }
`;