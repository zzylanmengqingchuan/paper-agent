/**
 * 少数派文档 RAG 示例
 *
 * 流程：用户提问 → 检索向量数据库 → 将上下文交给 AI → 生成答案
 */

import { ChatDeepSeek } from '@langchain/deepseek'
import { AlibabaTongyiEmbeddings } from '@langchain/community/embeddings/alibaba_tongyi'
import { Chroma } from '@langchain/community/vectorstores/chroma'
import 'dotenv/config'

// 初始化模型
const llm = new ChatDeepSeek({
  model: 'deepseek-chat',
})

// 初始化 Embedding
const embeddings = new AlibabaTongyiEmbeddings({
  apiKey: process.env.ALIBABA_API_KEY,
})

// 连接到 ChromaDB（使用之前存储的 shaoshupai-doc collection）
const vectorStore = await Chroma.fromExistingCollection(embeddings, {
  collectionName: 'shaoshupai-doc',
  url: 'http://localhost:8000',
})

/**
 * RAG 主函数
 * @param {string} question - 用户问题
 */
async function rag(question) {
  console.log('='.repeat(60))
  console.log('🔍 RAG 检索增强生成')
  console.log('='.repeat(60))
  console.log(`\n❓ 用户问题: ${question}\n`)

  // 步骤1：检索相关文档
  console.log('📖 步骤1：检索相关文档...')
  const docs = await vectorStore.similaritySearch(question, 3)
  console.log(`   检索到 ${docs.length} 个相关文档:\n`)

  docs.forEach((doc, i) => {
    console.log(`   [${i + 1}] ${doc.pageContent.substring(0, 100)}...`)
    console.log()
  })

  // 步骤2：构建 Prompt
  console.log('📝 步骤2：构建 Prompt...')
  const context = docs.map((doc, i) => `[文档${i + 1}]\n${doc.pageContent}`).join('\n\n')

  const prompt = `你是一个助手，请根据以下上下文回答用户问题。
如果上下文中没有相关信息，请明确说明"根据现有资料无法回答"。

## 上下文
${context}

## 用户问题
${question}

## 请回答`

  // 步骤3：调用 LLM 生成答案
  console.log('🤖 步骤3：AI 生成答案...\n')
  const response = await llm.invoke(prompt)

  console.log('💬 最终答案:')
  console.log('-'.repeat(60))
  console.log(response.content)
  console.log('-'.repeat(60))

  return response.content
}

// 主程序
async function main() {
  const question = 'youmind好不好用'
  await rag(question)
}

main().catch(console.error)
