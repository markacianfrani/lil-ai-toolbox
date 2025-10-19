import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import * as glob from 'glob'
import { assertWithinWorkspace } from './path-utils'

// Basic parameters for our simplified search tool
export interface SearchParams {
  pattern: string
  path?: string
  include?: string
  guardrailDir?: string
}

export interface Match {
  file_path: string
  line_number: number
  line: string
}

// Minimal tool definition
export async function searchFileContent(params: SearchParams): Promise<Match[]> {
  // Basic validation
  if (!params.pattern) {
    throw new Error('The "pattern" parameter is required.')
  }

  const matches: Match[] = []
  let cwdOption = {}
  if (params.path) {
    const resolvedPath = path.resolve(params.path)
    const guardrailDir = params.guardrailDir || process.cwd()
    assertWithinWorkspace(resolvedPath, guardrailDir)
    cwdOption = { cwd: resolvedPath }
  }
  const files = await glob.glob(params.include || '**/*', cwdOption)

  for (const file of files) {
    try {
      const content = await fs.readFile(file, { encoding: 'utf-8' })
      const lines = content.split('\n')
      for (let i = 0; i < lines.length; i++) {
        if (new RegExp(params.pattern).test(lines[i])) {
          matches.push({
            file_path: file,
            line_number: i + 1,
            line: lines[i],
          })
        }
      }
    } catch (_e: unknown) {
      // Ignore errors for individual files (e.g., directories)
    }
  }

  return matches
}
