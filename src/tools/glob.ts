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

  try {
    // Find files matching the pattern
    const files = await glob.glob(params.pattern, params.path ? { cwd: params.path } : {})
    return files
  } catch (e: unknown) {
    // Basic error handling
    const error = e as Error
    throw new Error(`An unexpected error occurred: ${error.message}`)
  }
}
