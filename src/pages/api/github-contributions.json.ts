import type { APIRoute } from "astro";

import { getGitHubContributions } from "../../lib/contribution";

export const prerender = false;

export const GET: APIRoute = async () => {
  const data = await getGitHubContributions();

  return new Response(JSON.stringify(data), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
};
