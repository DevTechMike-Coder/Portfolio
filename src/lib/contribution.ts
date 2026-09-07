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

const COLOR_MAP: Record<string, string> = {
  "0": "#161b22",
  "1": "#0e4429",
  "2": "#006d32",
  "3": "#26a641",
  "4": "#39d353",
};

// In-memory cache to avoid rate limiting and ensure snappy response
let cachedData: ContributionData | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

function parsePublicContributionsHtml(html: string): ContributionData {
  // 1. Total contributions count
  const totalMatch = html.match(/([\d,]+)\s+contributions\s+in the last year/i);
  const totalContributions = totalMatch ? parseInt(totalMatch[1].replace(/,/g, ""), 10) : 0;

  // 2. Extract tooltips for exact count
  const tooltips = new Map<string, number>();
  const tooltipRegex = /<tool-tip[^>]*for="([^"]+)"[^>]*>([\s\S]*?)<\/tool-tip>/gi;
  let tMatch: RegExpExecArray | null;
  while ((tMatch = tooltipRegex.exec(html)) !== null) {
    const forId = tMatch[1];
    const text = tMatch[2].trim();
    const countMatch = text.match(/^(\d+)\s+contribution/i);
    const count = countMatch ? parseInt(countMatch[1], 10) : 0;
    tooltips.set(forId, count);
  }

  // 3. Extract all calendar days
  const tdRegexAlt = /<td\s+[^>]*class="[^"]*ContributionCalendar-day[^"]*"[^>]*>/gi;
  const days: ContributionDay[] = [];
  let dMatch: RegExpExecArray | null;

  while ((dMatch = tdRegexAlt.exec(html)) !== null) {
    const tdStr = dMatch[0];
    const dateMatch = tdStr.match(/data-date="([^"]+)"/);
    if (!dateMatch) continue;

    const date = dateMatch[1];
    const idMatch = tdStr.match(/id="([^"]+)"/);
    const id = idMatch ? idMatch[1] : "";
    const levelMatch = tdStr.match(/data-level="(\d+)"/);
    const level = levelMatch ? levelMatch[1] : "0";

    const count = tooltips.has(id)
      ? (tooltips.get(id) as number)
      : (parseInt(level, 10) > 0 ? parseInt(level, 10) : 0);
    const color = COLOR_MAP[level] || "#161b22";

    days.push({ date, contributionCount: count, color });
  }

  // Sort chronologically
  days.sort((a, b) => a.date.localeCompare(b.date));

  // Group into weeks starting with Sunday
  const weeks: ContributionWeek[] = [];
  let currentWeek: ContributionDay[] = [];

  for (const day of days) {
    const dayOfWeek = new Date(`${day.date}T00:00:00Z`).getUTCDay();
    if (dayOfWeek === 0 && currentWeek.length > 0) {
      weeks.push({ contributionDays: currentWeek });
      currentWeek = [];
    }
    currentWeek.push(day);
  }

  if (currentWeek.length > 0) {
    weeks.push({ contributionDays: currentWeek });
  }

  return {
    totalContributions,
    weeks,
  };
}

async function fetchFromPublicPage(username: string): Promise<ContributionData> {
  const res = await fetch(`https://github.com/users/${username}/contributions`, {
    signal: AbortSignal.timeout(8000),
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html",
    },
  });

  if (!res.ok) {
    throw new Error(`GitHub public contributions returned status ${res.status}`);
  }

  const html = await res.text();
  const parsed = parsePublicContributionsHtml(html);
  if (parsed.weeks.length === 0) {
    throw new Error("Unable to parse calendar days from GitHub public page");
  }
  return parsed;
}

export async function getGitHubContributions(): Promise<ContributionData> {
  const now = Date.now();
  if (cachedData && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedData;
  }

  const GITHUB_ACCESS_TOKEN = import.meta.env.GITHUB_ACCESS_TOKEN;
  const GITHUB_USERNAME = import.meta.env.GITHUB_USERNAME || "DevTechMike-Coder";

  const fallbackData: ContributionData = {
    totalContributions: 0,
    weeks: [],
  };

  // 1. Try GitHub GraphQL API if token is provided
  if (GITHUB_ACCESS_TOKEN && GITHUB_USERNAME) {
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
        signal: AbortSignal.timeout(3000),
        method: "POST",
        headers: {
          Authorization: `Bearer ${GITHUB_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
          "User-Agent": "Portfolio-App",
        },
        body: JSON.stringify({
          query,
          variables: { username: GITHUB_USERNAME },
        }),
      });

      if (res.ok) {
        const { data, errors } = await res.json();
        if (!errors && data?.user?.contributionsCollection?.contributionCalendar) {
          const calendar = data.user.contributionsCollection.contributionCalendar;
          cachedData = calendar;
          cacheTimestamp = now;
          return calendar;
        }
      } else {
        console.warn(`GitHub GraphQL returned ${res.status}, attempting public fallback...`);
      }
    } catch (err) {
      console.warn("GitHub GraphQL fetch failed, attempting public fallback:", err);
    }
  }

  // 2. Fallback to public contributions page (requires no token and doesn't expire)
  try {
    const publicData = await fetchFromPublicPage(GITHUB_USERNAME);
    cachedData = publicData;
    cacheTimestamp = now;
    return publicData;
  } catch (publicErr) {
    console.error("Failed to fetch public GitHub contributions:", publicErr);
  }

  return cachedData || fallbackData;
}

