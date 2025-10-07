// Basic parameters for our simplified replace tool
import * as fs from 'node:fs/promises'
import * as path from 'node:path'

export interface ReplaceParams {
  filePath: string
  oldString: string
  newString: string
  replaceAll?: boolean
}

// Minimal tool definition
export async function replace(params: ReplaceParams): Promise<void> {
  // Basic validation
  if (!params.filePath || !params.oldString || params.newString === undefined) {
    throw new Error('The "filePath", "oldString", and "newString" parameters are required.')
  }

  const resolvedPath = path.resolve(params.filePath)

  try {
    // Read the file content
    const content = await fs.readFile(resolvedPath, { encoding: 'utf-8' })

    // Check for uniqueness
    const occurrences = (
      content.match(new RegExp(params.oldString.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []
    ).length
    if (occurrences > 1 && !params.replaceAll) {
      throw new Error(
        'The "oldString" is not unique in the file. Either provide a larger string with more surrounding context to make it unique or use "replaceAll" to change every instance.'
      )
    }

    // Perform the replacement
    const newContent = params.replaceAll
      ? content.replaceAll(params.oldString, params.newString)
      : content.replace(params.oldString, params.newString)

    // Write the new content back to the file
    await fs.writeFile(resolvedPath, newContent, { encoding: 'utf-8' })
  } catch (e: unknown) {
    // Basic error handling
    const error = e as Error
    throw new Error(`An unexpected error occurred: ${error.message}`)
  }
}
