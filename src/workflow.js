import { ChatDeepSeek } from '@langchain/deepseek'
import { trimMessages } from "@langchain/core/messages";
import 'dotenv/config'

const llm = new ChatDeepSeek({
  model: 'deepseek-chat',
})

// 创建 trimmer，保留最后 10 条消息
const trimmer = trimMessages({
  maxTokens: 10,
  strategy: "last",
  tokenCounter: (msgs) => msgs.length,  // 用消息数量作为计数
  includeSystem: true,                    // 保留系统消息
  allowPartial: false,
  startOn: "human",                       // 从用户消息开始
});

// Define the function that calls the model
const callModel = async (state) => {
  console.log('Input messages length: ', state.messages.length)

  // 使用 trimMessages 裁剪消息，只保留最后 10 条
  const trimmedMessages = await trimmer.invoke(state.messages)
  console.log('Trimmed messages length: ', trimmedMessages.length)

  const response = await llm.invoke(trimmedMessages)
  return { messages: response }
}

import {
  START,
  END,
  MessagesAnnotation,
  StateGraph,
  MemorySaver,
} from '@langchain/langgraph'

// Define a new graph
const workflow = new StateGraph(MessagesAnnotation)
  // Define the node and edge
  .addNode('model', callModel)
  .addEdge(START, 'model')
  .addEdge('model', END)

// Add memory
const memory = new MemorySaver()
const app = workflow.compile({ checkpointer: memory })



import { v4 as uuidv4 } from "uuid";

const config = { configurable: { thread_id: uuidv4() } };

// 多轮对话测试，观察 trimMessages 效果
const questions = [
  '你好，我是qingchuan',
  '我今年25岁',
  '我住在北京',
  '我喜欢编程',
  '我在学习AI',
  '我有一个猫',
  '我喜欢喝咖啡',
  '我会弹吉他',
  '我喜欢看电影',
  '我叫什么名字？',      // 第10轮
  '我今年多大？',        // 第11轮 - 超过10条，早期消息会被裁剪
  '我住在哪里？',        // 第12轮
]

for (let i = 0; i < questions.length; i++) {
  const input = [{ role: 'user', content: questions[i] }]
  const output = await app.invoke({ messages: input }, config)

  console.log(`\n=== 第 ${i + 1} 轮对话 ===`)
  console.log(`问题: ${questions[i]}`)
  console.log(`state中总消息数: ${output.messages.length}`)
  console.log(`回答: ${output.messages[output.messages.length - 1].content}`)
}


