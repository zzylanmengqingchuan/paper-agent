/**
 * RAG Agent 完整示例：检索增强生成
 *
 * 流程：
 * 1. 用户提问
 * 2. 从向量数据库检索相关文档
 * 3. 将文档上下文 + 问题交给 LLM
 * 4. LLM 生成最终答案
 *
 * 使用 LangGraph 构建工作流
 */

import { ChromaClient } from 'chromadb'
import { ChatDeepSeek } from '@langchain/deepseek'
import { AlibabaTongyiEmbeddings } from '@langchain/community/embeddings/alibaba_tongyi'
import { StateGraph, END } from '@langchain/langgraph'
import { HumanMessage, SystemMessage, AIMessage } from '@langchain/core/messages'
import 'dotenv/config'

// ============================================
// 配置
// ============================================

const CHROMA_HOST = 'http://localhost:8000'
const COLLECTION_NAME = 'nike_annual_report' // 使用之前 rag-demo.js 创建的 collection

// 初始化 LLM
const llm = new ChatDeepSeek({
  model: 'deepseek-chat',
  temperature: 0,
})

// 初始化 Embedding 模型
const embeddings = new AlibabaTongyiEmbeddings({})

// 连接 Chroma
const chromaClient = new ChromaClient()

// ============================================
// 定义 Agent 状态
// ============================================

/**
 * Agent 状态定义
 * @property {string} question - 用户问题
 * @property {string} context - 检索到的上下文
 * @property {string} answer - 最终答案
 * @property {Array} documents - 检索到的文档
 */
const AgentState = {
  channels: {
    question: { value: null },
    context: { value: null },
    answer: { value: null },
    documents: { value: null },
  },
}

// ============================================
// 节点函数：检索文档
// ============================================

async function retrieveDocuments(state) {
  console.log('\n📖 正在检索文档...')

  const { question } = state

  try {
    // 获取 collection
    const collection = await chromaClient.getOrCreateCollection({
      name: COLLECTION_NAME,
    })

    // 将问题转换为向量
    const queryVector = await embeddings.embedQuery(question)

    // 检索最相关的 4 个文档
    const results = await collection.query({
      queryEmbeddings: [queryVector],
      nResults: 4,
    })

    // 整理检索结果
    const documents = results.documents[0].map((doc, i) => ({
      content: doc,
      score: 1 - results.distances[0][i], // 转换为相似度
      id: results.ids[0][i],
    }))

    // 合并上下文
    const context = documents.map(d => d.content).join('\n\n---\n\n')

    console.log(`   检索到 ${documents.length} 个相关文档`)
    documents.forEach((doc, i) => {
      console.log(`   [${i + 1}] 相似度: ${doc.score.toFixed(4)}`)
    })

    return {
      question,
      context,
      documents,
    }
  } catch (error) {
    console.error('   检索失败:', error.message)
    return {
      question,
      context: '无法检索到相关文档',
      documents: [],
    }
  }
}

// ============================================
// 节点函数：生成答案
// ============================================

async function generateAnswer(state) {
  console.log('\n🤖 正在生成答案...')

  const { question, context, documents } = state

  // 构建 RAG Prompt
  const systemPrompt = `你是一个专业的问答助手。请根据提供的上下文信息回答用户问题。

## 规则
1. 只使用上下文中的信息来回答问题
2. 如果上下文中没有相关信息，请诚实地说"根据现有信息无法回答"
3. 回答要简洁、准确、有条理
4. 如果涉及数据，请明确指出数据来源

## 上下文信息
${context}`

  const messages = [
    new SystemMessage(systemPrompt),
    new HumanMessage(question),
  ]

  try {
    // 调用 LLM 生成答案
    const response = await llm.invoke(messages)
    const answer = response.content

    console.log('\n📝 答案生成完成!')

    return {
      question,
      context,
      documents,
      answer,
    }
  } catch (error) {
    console.error('   生成失败:', error.message)
    return {
      question,
      context,
      documents,
      answer: '抱歉，生成答案时出现错误。',
    }
  }
}

// ============================================
// 构建工作流
// ============================================

function buildRAGWorkflow() {
  // 创建状态图
  const workflow = new StateGraph({
    channels: AgentState.channels,
  })

  // 添加节点
  workflow.addNode('retrieve', retrieveDocuments)
  workflow.addNode('generate', generateAnswer)

  // 设置入口点
  workflow.setEntryPoint('retrieve')

  // 添加边：retrieve -> generate
  workflow.addEdge('retrieve', 'generate')

  // 添加边：generate -> END
  workflow.addEdge('generate', END)

  // 编译工作流
  return workflow.compile()
}

// ============================================
// 主函数
// ============================================

async function main() {
  console.log('='.repeat(60))
  console.log('RAG Agent 示例：检索增强生成')
  console.log('='.repeat(60))

  // 构建 RAG 工作流
  const ragWorkflow = buildRAGWorkflow()

  // 测试问题列表
  const questions = [
    'What was Nike revenue in 2023?',
    // 'What technology innovations does Nike have?',
    // 'Nike 的可持续发展计划是什么？',
  ]

  for (const question of questions) {
    console.log('\n' + '-'.repeat(60))
    console.log(`❓ 用户问题: ${question}`)
    console.log('-'.repeat(60))

    // 运行 RAG 工作流
    const result = await ragWorkflow.invoke({
      question,
    })

    // 输出结果
    console.log('\n' + '='.repeat(60))
    console.log('📊 RAG 流程完成')
    console.log('='.repeat(60))

    console.log('\n🔍 检索到的文档片段:')
    result.documents?.forEach((doc, i) => {
      console.log(`\n--- 文档 ${i + 1} (相似度: ${doc.score.toFixed(4)}) ---`)
      console.log(doc.content.substring(0, 200) + '...')
    })

    console.log('\n💬 最终答案:')
    console.log(result.answer)
  }

  // 流程图说明
  console.log('\n' + '='.repeat(60))
  console.log('📈 RAG 工作流程图')
  console.log('='.repeat(60))
  console.log(`
  ┌─────────────┐
  │  用户提问    │
  └──────┬──────┘
         │
         ▼
  ┌─────────────┐
  │  检索文档    │  ← Chroma 向量数据库
  │  (retrieve) │
  └──────┬──────┘
         │
         ▼
  ┌─────────────┐
  │  生成答案    │  ← DeepSeek LLM
  │  (generate) │
  └──────┬──────┘
         │
         ▼
  ┌─────────────┐
  │  输出结果    │
  └─────────────┘
`)
}

main().catch(console.error)
