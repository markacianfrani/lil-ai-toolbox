import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { assertWithinWorkspace } from './path-utils'

// Basic parameters for our simplified write tool
export interface WriteFileParams {
  filePath: string
  content: string
  guardrailDir?: string
}

// Minimal tool definition
export async function writeFile(params: WriteFileParams): Promise<void> {
  // Basic validation: ensure filePath and content are provided
  if (!params.filePath) {
    throw new Error('The "filePath" parameter is required.')
  }
  if (params.content === undefined) {
    throw new Error('The "content" parameter is required.')
  }

  const resolvedPath = path.resolve(params.filePath)

  const guardrailDir = params.guardrailDir || process.cwd()
  assertWithinWorkspace(resolvedPath, guardrailDir)

  try {
    // Write the content to the file
    await fs.writeFile(resolvedPath, params.content, { encoding: 'utf-8' })
  } catch (e: unknown) {
    // Basic error handling
    const error = e as Error
    throw new Error(`An unexpected error occurred: ${error.message}`)
  }
}
