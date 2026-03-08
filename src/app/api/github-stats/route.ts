import { NextRequest, NextResponse } from "next/server";

function extractUsername(githubUrl: string): string | null {
  const match = githubUrl.match(
    /(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_-]+)\/?$/
  );
  return match ? match[1] : null;
}

export async function POST(request: NextRequest) {
  try {
    const { githubUrl } = (await request.json()) as { githubUrl: string };

    if (!githubUrl) {
      return NextResponse.json({ error: "No GitHub URL provided" }, { status: 400 });
    }

    const username = extractUsername(githubUrl);
    if (!username) {
      return NextResponse.json(
        { error: "Invalid GitHub profile URL. Expected format: https://github.com/username" },
        { status: 400 }
      );
    }

    const headers: HeadersInit = { "Accept": "application/vnd.github.v3+json" };
    if (process.env.GITHUB_TOKEN) {
      headers["Authorization"] = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    const userRes = await fetch(`https://api.github.com/users/${username}`, { headers });
    if (!userRes.ok) {
      if (userRes.status === 404) {
        return NextResponse.json({ error: "GitHub user not found" }, { status: 404 });
      }
      return NextResponse.json({ error: "GitHub API error" }, { status: 502 });
    }

    const userData = await userRes.json();

    const reposRes = await fetch(
      `https://api.github.com/users/${username}/repos?per_page=100&sort=stars&direction=desc`,
      { headers }
    );
    let totalStars = 0;
    const langCounts: Record<string, number> = {};
    const topRepos: { name: string; description: string; language: string; stars: number; forks: number; url: string }[] = [];

    if (reposRes.ok) {
      const repos = await reposRes.json();
      for (const repo of repos) {
        totalStars += repo.stargazers_count || 0;
        if (repo.language) {
          langCounts[repo.language] = (langCounts[repo.language] || 0) + 1;
        }
      }

      const sorted = [...repos].sort(
        (a: { stargazers_count: number }, b: { stargazers_count: number }) =>
          (b.stargazers_count || 0) - (a.stargazers_count || 0)
      );
      for (const repo of sorted.slice(0, 6)) {
        topRepos.push({
          name: repo.name,
          description: repo.description || "",
          language: repo.language || "",
          stars: repo.stargazers_count || 0,
          forks: repo.forks_count || 0,
          url: repo.html_url || "",
        });
      }
    }

    const topLanguages = Object.entries(langCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([lang]) => lang);

    return NextResponse.json({
      stats: {
        repos: userData.public_repos || 0,
        stars: totalStars,
        followers: userData.followers || 0,
        topLanguages,
        topRepos,
      },
    });
  } catch (error) {
    console.error("GitHub stats error:", error);
    return NextResponse.json({ error: "Failed to fetch GitHub stats" }, { status: 500 });
  }
}
