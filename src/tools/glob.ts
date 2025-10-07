import * as glob from 'glob'

// Basic parameters for our simplified glob tool
export interface GlobParams {
  pattern: string
  path?: string
}

// Minimal tool definition
export async function globSearch(params: GlobParams): Promise<string[]> {
  // Basic validation
  if (!params.pattern) {
    throw new Error('The "pattern" parameter is required.')
  }

  let cwdOption = {}
  if (params.path) {
    const resolvedPath = require('path').resolve(params.path)
    // Guardrail: restrict access to current working directory
    const cwd = process.cwd()
    if (!resolvedPath.startsWith(cwd)) {
      throw new Error('Access denied: path outside working directory')
    }
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
