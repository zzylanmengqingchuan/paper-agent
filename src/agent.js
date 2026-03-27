import { ChatDeepSeek } from '@langchain/deepseek'
import 'dotenv/config'
import { tool } from '@langchain/core/tools'
import { createReactAgent } from '@langchain/langgraph/prebuilt'
import { MemorySaver } from '@langchain/langgraph'
import * as z from 'zod'

/**
 * 本节学习内容：
 * 1. System Prompt - 定义 Agent 的角色
 * 2. 多个 Tools - Agent 可以使用多个工具
 * 3. Memory (MemorySaver) - 保存对话历史
 * 4. Context - 传递上下文信息给工具
 */

// 1. 定义 model
const model = new ChatDeepSeek({
  model: 'deepseek-chat',
})

// 2. 定义 system prompt
const systemPrompt = `You are an expert weather forecaster, who speaks in puns.

You have access to two tools:
- get_weather_for_location: use this to get the weather for a specific location
- get_user_location: use this to get the user's location

If a user asks you for the weather, make sure you know the location.
If the question implies "where I am", use get_user_location first.`

// 3. 定义 tools
// 工具1：获取天气
const getWeather = tool(
  (input) => `The weather in ${input.city} is sunny and 25°C!`,
  {
    name: 'get_weather_for_location',
    description: 'Get the weather for a given city',
    schema: z.object({
      city: z.string().describe('The city to get the weather for'),
    }),
  }
)

// 工具2：获取用户位置
// 重点：config.context 可以获取调用时传入的上下文
const getUserLocation = tool(
  async (_, config) => {
    // config.context 来自 agent.invoke 的 config 参数
    const userId = config?.configurable?.user_id || 'unknown'
    const location = userId === '1' ? 'Florida' : 'San Francisco'
    console.log(`[Tool] getUserLocation called, user_id=${userId}, returning: ${location}`)
    return location
  },
  {
    name: 'get_user_location',
    description: "Get the user's current location based on their user ID",
    schema: z.object({}), // 不需要输入参数
  }
)

// 4. Memory - 用于保存对话历史
// 同一个 thread_id 的对话会保存上下文
const checkpointer = new MemorySaver()

// 5. 创建 Agent
const agent = createReactAgent({
  llm: model,
  tools: [getWeather, getUserLocation],
  messageModifier: systemPrompt, // 通过 messageModifier 传入 system prompt
  checkpointer,  // 添加 memory
})

// 6. 配置
// - thread_id: 对话的唯一标识，不同对话用不同 ID
// - user_id: 传给工具的上下文信息
const config = {
  configurable: {
    thread_id: 'conversation-001',  // 对话ID
    user_id: '1',                   // 用户ID（会传给工具）
  },
}

// ============ 执行对话 ============

console.log('=== 第一次对话：问天气 ===')
console.log('用户: what is the weather outside?')
console.log('')

const response1 = await agent.invoke(
  { messages: [{ role: 'user', content: 'what is the weather outside?' }] },
  config
)

// 提取最后一条 AI 消息
const lastMessage1 = response1.messages[response1.messages.length - 1]
console.log('AI:', lastMessage1.content)
console.log('')

// 等待一下
await new Promise(r => setTimeout(r, 1000))

console.log('=== 第二次对话：测试 Memory ===')
console.log('用户: thank you!')
console.log('')

// 第二次对话使用相同的 thread_id，AI 会记住之前的上下文
const response2 = await agent.invoke(
  { messages: [{ role: 'user', content: 'thank you!' }] },
  config  // 相同的 thread_id
)

const lastMessage2 = response2.messages[response2.messages.length - 1]
console.log('AI:', lastMessage2.content)
console.log('')

// 换一个 thread_id 测试 - 这是一个全新的对话
console.log('=== 新对话 (不同 thread_id) ===')
const newConfig = {
  configurable: {
    thread_id: 'conversation-002',  // 新的对话ID
    user_id: '2',                   // 不同的用户
  },
}

const response3 = await agent.invoke(
  { messages: [{ role: 'user', content: 'what did we talk about before?' }] },
  newConfig
)

const lastMessage3 = response3.messages[response3.messages.length - 1]
console.log('AI:', lastMessage3.content)
console.log('(因为没有历史记录，AI 不知道之前聊了什么)')
