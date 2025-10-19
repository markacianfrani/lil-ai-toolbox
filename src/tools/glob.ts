import * as path from 'node:path'
import * as glob from 'glob'
import { assertWithinWorkspace } from './path-utils'

// Basic parameters for our simplified glob tool
export interface GlobParams {
  pattern: string
  path?: string
  guardrailDir?: string
}

// Minimal tool definition
export async function globSearch(params: GlobParams): Promise<string[]> {
  // Basic validation
  if (!params.pattern) {
    throw new Error('The "pattern" parameter is required.')
  }

  let cwdOption = {}
  if (params.path) {
    const resolvedPath = path.resolve(params.path)
    const guardrailDir = params.guardrailDir || process.cwd()
    assertWithinWorkspace(resolvedPath, guardrailDir)
    cwdOption = { cwd: resolvedPath }
  }

  try {
    // Find files matching the pattern
    const files = await glob.glob(params.pattern, cwdOption)
    return files
  } catch (e: unknown) {
    // Basic error handling
    const error = e as Error
    throw new Error(`An unexpected error occurred: ${error.message}`)
  }
}
