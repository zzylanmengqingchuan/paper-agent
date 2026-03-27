import { tool } from '@langchain/core/tools'
import * as z from 'zod'
import { ChatDeepSeek } from '@langchain/deepseek'
import 'dotenv/config'
import { Annotation, StateGraph, START, END, MemorySaver, messagesStateReducer } from '@langchain/langgraph'
import { HumanMessage, SystemMessage, isAIMessage } from '@langchain/core/messages'

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

// Define state using Annotation
const GraphState = Annotation.Root({
  messages: Annotation({
    reducer: messagesStateReducer,
    default: () => [],
  }),
  llmCalls: Annotation({
    reducer: (x, y) => y ?? x ?? 0,
    default: () => 0,
  }),
})

// Define llmCall node
async function llmCall(state) {
  const newMessages = await modelWithTools.invoke([
    new SystemMessage(
      'You are a helpful assistant tasked with performing arithmetic on a set of inputs.'
    ),
    ...state.messages,
  ])

  const newLlmCalls = (state.llmCalls ?? 0) + 1
  return {
    messages: [newMessages],
    llmCalls: newLlmCalls,
  }
}

// Define tool node
async function toolNode(state) {
  const lastMessage = state.messages.at(-1)

  if (lastMessage == null || !isAIMessage(lastMessage)) {
    return { messages: [] }
  }

  const result = []
  for (const toolCall of lastMessage.tool_calls ?? []) {
    const tool = toolsByName[toolCall.name]
    const observation = await tool.invoke(toolCall)
    result.push(observation)
  }

  return { messages: result }
}

// Define conditional edges
function shouldContinue(state) {
  const lastMessage = state.messages.at(-1)
  if (lastMessage == null || !isAIMessage(lastMessage)) return END

  // If the LLM makes a tool call, then perform an action
  if (lastMessage.tool_calls?.length) {
    return 'toolNode'
  }

  // Otherwise, we stop (reply to the user)
  return END
}

// Define workflow
const graph = new StateGraph(GraphState)
  .addNode('llmCall', llmCall)
  .addNode('toolNode', toolNode)
  .addEdge(START, 'llmCall')
  .addConditionalEdges('llmCall', shouldContinue, ['toolNode', END])
  .addEdge('toolNode', 'llmCall')

// ============ Memory 功能核心代码 ============
// 使用 MemorySaver 保存对话历史
const checkpointer = new MemorySaver()

// 编译 agent 时传入 checkpointer
const agent = graph.compile({ checkpointer })

// 配置 thread_id，同一 thread_id 的对话会保持上下文
const config = {
  configurable: {
    thread_id: 'conversation-001',
  },
}

// ============ 第一次对话 ============
console.log('=== 第一次对话 ===')
console.log('用户: Add 3 and 4.')

const result1 = await agent.invoke(
  { messages: [new HumanMessage('Add 3 and 4.')] },
  config
)

for (const message of result1.messages) {
  console.log(`[${message.getType()}]: ${message.text}`)
}

console.log('')

// ============ 第二次对话（测试 Memory） ============
console.log('=== 第二次对话（测试 Memory） ===')
console.log('用户: Multiply the result by 2.')

// 使用相同的 thread_id，AI 会记住之前的上下文
const result2 = await agent.invoke(
  { messages: [new HumanMessage('Multiply the result by 2.')] },
  config
)

for (const message of result2.messages) {
  console.log(`[${message.getType()}]: ${message.text}`)
}

console.log('')

// ============ 新对话（不同 thread_id） ============
console.log('=== 新对话（不同 thread_id） ===')
console.log('用户: What was the previous result?')

const newConfig = {
  configurable: {
    thread_id: 'conversation-002',
  },
}

const result3 = await agent.invoke(
  { messages: [new HumanMessage('What was the previous result?')] },
  newConfig
)

for (const message of result3.messages) {
  console.log(`[${message.getType()}]: ${message.text}`)
}

console.log('')
console.log('(因为是新的 thread_id，AI 不知道之前聊了什么)')
