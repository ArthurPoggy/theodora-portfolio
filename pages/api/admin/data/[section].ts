import type { NextApiRequest, NextApiResponse } from 'next'
import { isAuthenticated } from '@/lib/auth'
import { getRepoFile, putRepoFile } from '@/lib/github'
import path from 'path'
import fs from 'fs'

const VALID_SECTIONS = ['galleries', 'animations', 'about', 'testimonials', 'tracks', 'home', 'social']

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { section } = req.query as { section: string }

  if (!VALID_SECTIONS.includes(section)) {
    return res.status(400).json({ ok: false, error: 'Seção inválida' })
  }

  if (!isAuthenticated(req)) {
    return res.status(401).json({ ok: false, error: 'Não autorizado' })
  }

  const filePath = `data/${section}.json`

  if (req.method === 'GET') {
    try {
      const { content, sha } = await getRepoFile(filePath)
      return res.status(200).json({ ok: true, data: JSON.parse(content), sha })
    } catch {
      // Fallback: ler do sistema de arquivos local (ambiente de dev)
      try {
        const localPath = path.join(process.cwd(), filePath)
        const content = fs.readFileSync(localPath, 'utf-8')
        return res.status(200).json({ ok: true, data: JSON.parse(content), sha: undefined })
      } catch {
        return res.status(500).json({ ok: false, error: 'Erro ao ler dados' })
      }
    }
  }

  if (req.method === 'PUT') {
    const { data, sha } = req.body as { data: unknown; sha?: string }
    if (!data) return res.status(400).json({ ok: false, error: 'Dados ausentes' })

    const content = JSON.stringify(data, null, 2)

    try {
      // Obter SHA atual se não foi enviado
      let currentSha = sha
      if (!currentSha) {
        try {
          const current = await getRepoFile(filePath)
          currentSha = current.sha
        } catch {
          // arquivo novo, sem SHA
        }
      }
      await putRepoFile(filePath, content, `cms: atualizar ${section}`, currentSha)
      return res.status(200).json({ ok: true })
    } catch (err) {
      return res.status(500).json({ ok: false, error: String(err) })
    }
  }

  return res.status(405).end()
}
