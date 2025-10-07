import * as fs from 'node:fs/promises'
import * as path from 'node:path'

// Basic parameters for our simplified read tool
export interface ReadFileParams {
  filePath: string
  offset?: number
  limit?: number
}

// Minimal tool definition
export async function readFile(params: ReadFileParams): Promise<string> {
  // Basic validation: ensure filePath is provided
  if (!params.filePath) {
    throw new Error('The "filePath" parameter is required.')
  }

  const resolvedPath = path.resolve(params.filePath)

  // Guardrail: restrict access to current working directory
  const cwd = process.cwd()
  if (!resolvedPath.startsWith(cwd)) {
    throw new Error('Access denied: path outside working directory')
  }

  try {
    // Read the file content
    const content = await fs.readFile(resolvedPath, { encoding: 'utf-8' })
    const lines = content.split('\n')
    const start = params.offset || 0
    const limit = params.limit || 2000
    const end = Math.min(lines.length, start + limit)
    const selectedLines = lines.slice(start, end)
    const formatted = selectedLines
      .map((line, index) => {
        const lineNumber = start + index + 1
        return `${lineNumber.toString().padStart(6)}\t${line}`
      })
      .join('\n')
    return formatted
  } catch (e: unknown) {
    // Basic error handling
    const error = e as Error & { code?: string }
    if (error.code === 'ENOENT') {
      throw new Error(`File not found at path: ${resolvedPath}`)
    } else if (error.code === 'EISDIR') {
      throw new Error(`The path points to a directory, not a file: ${resolvedPath}`)
    } else {
      throw new Error(`An unexpected error occurred: ${error.message}`)
    }
  }
}
