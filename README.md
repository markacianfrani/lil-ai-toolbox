# Lil AI Toolbox

A collection of standalone tools for agentic search. Mostly ripped from other CLIs.

## Installation

```bash
npm install @cianfrani/lil-ai-toolbox
```

For AI SDK features, also install:
```bash
npm install ai zod
```

Note: `ai` and `zod` are optional dependencies. They're only required if you plan to use the AI SDK tool wrappers. The core filesystem and search tools work without them.

## Publishing

To publish a new version to npm:

```bash
npm version patch  # or minor/major
npm run publish
```

The `prepublishOnly` script will automatically run build, typecheck, and lint before publishing.

## Tools

| Tool | AI SDK Tool | Description |
| --- | --- | --- |
| `glob` | `globTool` | Finds files matching a specified pattern. |
| `list-directory` | `listDirectoryTool` | Lists files and directories in a given path. |
| `read-file` | `readFileTool` | Reads the content of a file. |
| `read-many-files` | `readManyFilesTool` | Reads the content of multiple files. |
| `replace` | `replaceTool` | Replaces text in a file. |
| `run-shell-command` | `runShellCommandTool` | Executes a shell command. |
| `search-file-content` | `searchFileContentTool` | Searches for a pattern in the content of files. |
| `web-fetch` | `webFetchTool` | Fetches content from a URL. |
| `write-file` | `writeFileTool` | Writes content to a file. |

## AI SDK Usage

*Requires `ai` and `zod` packages to be installed.*

### Using Tool Wrappers

Import the AI SDK-compatible tools and use them with `generateText` or `streamText`:

```typescript
import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { globTool, readFileTool } from '@cianfrani/lil-ai-toolbox/ai'

const { text } = await generateText({
  model: openai('gpt-4'),
  prompt: 'Find all TypeScript files in the src directory and show me the first one',
  tools: [globTool, readFileTool],
})
```

### Using Raw Tools

You can also use the raw tool functions directly in your applications:

```typescript
import { glob } from '@cianfrani/lil-ai-toolbox'

const files = await glob({ pattern: 'src/**/*.ts' })
console.log(files)
```
