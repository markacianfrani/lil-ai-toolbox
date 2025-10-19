import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { minimatch } from 'minimatch'
import { assertWithinWorkspace } from './path-utils'

// Basic parameters for our simplified list tool
export interface ListDirectoryParams {
  path: string
  ignore?: string[]
  guardrailDir?: string
}

// Minimal tool definition
export async function listDirectory(params: ListDirectoryParams): Promise<string[]> {
  // Basic validation: ensure path is provided
  if (!params.path) {
    throw new Error('The "path" parameter is required.')
  }

  const resolvedPath = path.resolve(params.path)

  const guardrailDir = params.guardrailDir || process.cwd()
  assertWithinWorkspace(resolvedPath, guardrailDir)

  try {
    // Read the directory contents
    let files = await fs.readdir(resolvedPath)
    if (params.ignore) {
      files = files.filter((file) => !params.ignore?.some((pattern) => minimatch(file, pattern)))
    }
    return files
  } catch (e: unknown) {
    // Basic error handling
    const error = e as Error & { code?: string }
    if (error.code === 'ENOENT') {
      throw new Error(`Directory not found at path: ${resolvedPath}`)
    } else if (error.code === 'ENOTDIR') {
      throw new Error(`The path is not a directory: ${resolvedPath}`)
    } else {
      throw new Error(`An unexpected error occurred: ${error.message}`)
    }
  }
}
