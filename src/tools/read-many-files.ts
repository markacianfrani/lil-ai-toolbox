import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { assertWithinWorkspace } from './path-utils'

// Basic parameters for our simplified read_many_files tool
export interface ReadManyFilesParams {
  filePaths: string[]
}

// Minimal tool definition
export async function readManyFiles(
  params: ReadManyFilesParams
): Promise<{ filePath: string; content: string }[]> {
  // Basic validation
  if (!params.filePaths || params.filePaths.length === 0) {
    throw new Error('The "filePaths" parameter is required and must not be empty.')
  }

  const results: { filePath: string; content: string }[] = []

  for (const filePath of params.filePaths) {
    const resolvedPath = path.resolve(filePath)
    assertWithinWorkspace(resolvedPath)
    try {
      const content = await fs.readFile(resolvedPath, { encoding: 'utf-8' })
      results.push({ filePath: filePath, content })
    } catch (e: unknown) {
      const error = e as Error
      throw new Error(`An unexpected error occurred for ${filePath}: ${error.message}`)
    }
  }

  return results
}
