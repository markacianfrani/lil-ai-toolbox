import { generateText } from 'ai'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import {
  globTool,
  grepTool,
  listDirectoryTool,
  readFileTool,
  readManyFilesTool,
  replaceTool,
  runShellCommandTool,
  searchFileContentTool,
  webFetchTool,
  writeFileTool,
} from './src'

async function main() {
  const provider = createOpenAICompatible({
    apiKey: process.env.OPENAI_API_KEY || 'your-api-key',
    baseURL: 'http://192.168.0.40:1234/v1',
  })

  const messages = [
    {
      role: 'user',
      content:
        'List the files in the src directory and then search for "export" in TypeScript files. then list each file name that you found that contains it',
    },
  ]

  const result = await generateText({
    model: provider('qwen/qwen3-coder-30b'),
    messages,
    tools: {
      globTool,
      grepTool,
      listDirectoryTool,
      readFileTool,
      readManyFilesTool,
      replaceTool,
      runShellCommandTool,
      // searchFileContentTool,
      webFetchTool,
      writeFileTool,
    },
  })

  console.log('Response:', result.text)
  console.log('Tool calls:', result.toolCalls)

  if (result.toolCalls.length > 0) {
    console.log('Executing tools...')
    for (const toolCall of result.toolCalls) {
      const tool = {
        globTool,
        grepTool,
        listDirectoryTool,
        readFileTool,
        readManyFilesTool,
        replaceTool,
        runShellCommandTool,
        searchFileContentTool,
        webFetchTool,
        writeFileTool,
      }[toolCall.toolName]

      if (tool) {
        try {
          let input = toolCall.input
          if (input.path === '/src') input.path = 'src'
          if (input.path === '/home/user/project/src') input.path = 'src'
          const toolResult = await tool.execute(input)
          console.log(`Tool ${toolCall.toolName} result:`, toolResult)
        } catch (error) {
          console.log(`Tool ${toolCall.toolName} error:`, error.message)
        }
      }
    }

    // Generate final response to summarize file names
    // Find the grep result
    let grepOutput = ''
    for (const toolCall of result.toolCalls) {
      if (toolCall.toolName === 'grepTool') {
        const tool = grepTool
        try {
          let input = toolCall.input
          if (input.path === '/src') input.path = 'src'
          const toolResult = await tool.execute(input)
          grepOutput = toolResult.output
        } catch {}
      }
    }

    const summaryPrompt = `Here is the grep search result:\n${grepOutput}\n\nList only the file names that contain "export" matches, one per line.`
    const finalResult = await generateText({
      model: provider('qwen/qwen3-coder-30b'),
      prompt: summaryPrompt,
    })

    console.log('File names with "export":', finalResult.text)
  }
}

main().catch(console.error)
