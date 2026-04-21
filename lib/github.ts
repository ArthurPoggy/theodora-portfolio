const BASE = 'https://api.github.com'

function headers() {
  return {
    Authorization: `Bearer ${process.env.GITHUB_PAT}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
  }
}

function repoPath(filePath: string) {
  const owner = process.env.GITHUB_OWNER
  const repo = process.env.GITHUB_REPO
  return `${BASE}/repos/${owner}/${repo}/contents/${filePath}`
}

export interface GitHubFileResult {
  content: string
  sha: string
}

export async function getRepoFile(filePath: string): Promise<GitHubFileResult> {
  const branch = process.env.GITHUB_BRANCH || 'master'
  const res = await fetch(`${repoPath(filePath)}?ref=${branch}`, { headers: headers() })
  if (!res.ok) {
    throw new Error(`GitHub GET failed for ${filePath}: ${res.status}`)
  }
  const json = await res.json()
  const content = Buffer.from(json.content, 'base64').toString('utf-8')
  return { content, sha: json.sha }
}

export async function putRepoFile(
  filePath: string,
  content: string,
  message: string,
  sha?: string,
): Promise<void> {
  const branch = process.env.GITHUB_BRANCH || 'master'
  const body: Record<string, string> = {
    message,
    content: Buffer.from(content, 'utf-8').toString('base64'),
    branch,
  }
  if (sha) body.sha = sha

  const res = await fetch(repoPath(filePath), {
    method: 'PUT',
    headers: headers(),
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`GitHub PUT failed for ${filePath}: ${res.status} — ${err}`)
  }
}

export async function putRepoImage(
  filePath: string,
  base64Content: string,
  message: string,
  sha?: string,
): Promise<void> {
  const branch = process.env.GITHUB_BRANCH || 'master'
  const body: Record<string, string> = {
    message,
    content: base64Content,
    branch,
  }
  if (sha) body.sha = sha

  const res = await fetch(repoPath(filePath), {
    method: 'PUT',
    headers: headers(),
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`GitHub image upload failed for ${filePath}: ${res.status} — ${err}`)
  }
}

export async function getRepoFileSha(filePath: string): Promise<string | undefined> {
  try {
    const { sha } = await getRepoFile(filePath)
    return sha
  } catch {
    return undefined
  }
}
