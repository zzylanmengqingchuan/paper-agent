import { tool } from '@langchain/core/tools'
import * as z from 'zod'
import { ChatDeepSeek } from '@langchain/deepseek'
import 'dotenv/config'
import { task, entrypoint } from '@langchain/langgraph'
import { HumanMessage, SystemMessage } from '@langchain/core/messages'
import { addMessages } from '@langchain/langgraph'

// Define tools
const add = tool(({ a, b }) => a + b, {
  name: 'add',
  description: 'Add two numbers',
  schema: z.object({
    a: z.number().describe('First number'),
    b: z.number().describe('Second number'),
  }),
})

const multiply = tool(({ a, b }) => a * b, {
  name: 'multiply',
  description: 'Multiply two numbers',
  schema: z.object({
    a: z.number().describe('First number'),
    b: z.number().describe('Second number'),
  }),
})

const divide = tool(({ a, b }) => a / b, {
  name: 'divide',
  description: 'Divide two numbers',
  schema: z.object({
    a: z.number().describe('First number'),
    b: z.number().describe('Second number'),
  }),
})

const llm = new ChatDeepSeek({
  model: 'deepseek-chat',
})

// Augment the LLM with tools
const toolsByName = {
  [add.name]: add,
  [multiply.name]: multiply,
  [divide.name]: divide,
}
const tools = Object.values(toolsByName)
const modelWithTools = llm.bindTools(tools)

// 定义 callModel task
const callModel = task({ name: 'callLlm' }, async (messages) => {
  return modelWithTools.invoke([
    new SystemMessage(
      'You are a helpful assistant tasked with performing arithmetic on a set of inputs.'
    ),
    ...messages,
  ])
})

// 定义 callTool task
const callTool = task({ name: 'callTool' }, async (toolCall) => {
  const tool = toolsByName[toolCall.name]
  return tool.invoke(toolCall)
})

// 定义 Agent (使用函数式 API)
const agent = entrypoint({ name: 'agent' }, async (messages) => {
  // 先调用 llm
  let modelResponse = await callModel(messages)

  // 一个无限循环
  while (true) {
    // 看是否需要 tool call
    if (!modelResponse.tool_calls?.length) {
      // 不需要则退出循环
      break
    }

    // 执行 tool
    const toolResults = await Promise.all(
      modelResponse.tool_calls.map((toolCall) => callTool(toolCall))
    )
    // 将 tool 执行结果再调用 llm
    messages = addMessages(messages, [modelResponse, ...toolResults])
    modelResponse = await callModel(messages)
  }

  return messages
})

// 调用 Agent
const result = await agent.invoke([new HumanMessage('Add 3 and 4.')])

for (const message of result) {
  console.log(`[${message.getType()}]: ${message.text}`)
}
