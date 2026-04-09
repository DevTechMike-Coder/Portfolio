export interface ContributionDay {
  date: string;
  contributionCount: number;
  color: string;
}

export interface ContributionWeek {
  contributionDays: ContributionDay[];
}

export interface ContributionData {
  totalContributions: number;
  weeks: ContributionWeek[];
}

export async function getGitHubContributions(): Promise<ContributionData> {
  const GITHUB_ACCESS_TOKEN = import.meta.env.GITHUB_ACCESS_TOKEN;
  const GITHUB_USERNAME = import.meta.env.GITHUB_USERNAME;

  const fallbackData: ContributionData = {
    totalContributions: 0,
    weeks: [],
  };

  if (!GITHUB_ACCESS_TOKEN || !GITHUB_USERNAME) {
    console.warn("GitHub environment variables are missing");
    return fallbackData;
  }

  const query = `
    query($username: String!) {
      user(login: $username) {
        contributionsCollection {
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays {
                date
                contributionCount
                color
              }
            }
          }
        }
      }
    }
  `;

  try {
    const res = await fetch("https://api.github.com/graphql", {
      cache: "no-store",
      method: "POST",
      headers: {
        Authorization: `Bearer ${GITHUB_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        variables: { username: GITHUB_USERNAME },
      }),
    });

    if (!res.ok) {
      throw new Error(`GitHub API error: ${res.status}`);
    }

    const { data, errors } = await res.json();

    if (errors) {
      console.error("GitHub GraphQL errors:", errors);
      return fallbackData;
    }

    return data.user.contributionsCollection.contributionCalendar;
  } catch (error) {
    console.error("Failed to fetch GitHub contributions:", error);
    return fallbackData;
  }
}
