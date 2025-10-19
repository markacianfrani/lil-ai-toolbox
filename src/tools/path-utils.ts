import * as path from 'node:path'

export function assertWithinWorkspace(resolvedPath: string, cwd = process.cwd()) {
  const relative = path.relative(cwd, resolvedPath)
  const isInside =
    relative === '' ||
    relative === '.' ||
    (!relative.startsWith('..') && !path.isAbsolute(relative))

  if (!isInside) {
    throw new Error('Access denied: path outside working directory')
  }
}
