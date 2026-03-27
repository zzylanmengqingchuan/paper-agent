/**
 * 少数派文档向量存储示例
 *
 * 功能：
 * 1. 加载 files/shaoshupai.md 文件
 * 2. 拆分为 chunks（1000字，重叠200字）
 * 3. 转换为向量
 * 4. 存储到 Chroma 数据库（collection: shaoshupai-doc）
 * 5. 存储前清空 collection
 */

import { ChromaClient } from 'chromadb'
import { AlibabaTongyiEmbeddings } from '@langchain/community/embeddings/alibaba_tongyi'
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import 'dotenv/config'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 配置
const CONFIG = {
  chromaUrl: 'http://localhost:8000',
  collectionName: 'shaoshupai-doc',
  filePath: path.join(__dirname, '../files/shaoshupai.md'),
  chunkSize: 1000,
  chunkOverlap: 200,
}

/**
 * 加载文档
 */
function loadDocument(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`文件不存在: ${filePath}`)
  }
  const text = fs.readFileSync(filePath, 'utf-8')
  return {
    text,
    metadata: { source: filePath }
  }
}

/**
 * 拆分文本为 chunks
 */
async function splitText(text, chunkSize = 1000, chunkOverlap = 200) {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize,
    chunkOverlap,
    separators: ['\n\n', '\n', '. ', '。', ' ', ''],
  })
  return await splitter.splitText(text)
}

/**
 * 主函数：存储文档到向量数据库
 */
async function storeDocument() {
  console.log('=== 少数派文档向量存储 ===\n')

  // 1. 初始化
  const embeddings = new AlibabaTongyiEmbeddings({})
  const client = new ChromaClient({ path: CONFIG.chromaUrl })

  // 2. 加载文档
  console.log('📄 加载文档...')
  const doc = loadDocument(CONFIG.filePath)
  console.log(`   文件: ${CONFIG.filePath}`)
  console.log(`   长度: ${doc.text.length} 字符\n`)

  // 3. 拆分 chunks
  console.log('✂️  拆分为 chunks...')
  const chunks = await splitText(doc.text, CONFIG.chunkSize, CONFIG.chunkOverlap)
  console.log(`   Chunk 数量: ${chunks.length}`)
  console.log(`   Chunk 大小: ${CONFIG.chunkSize} 字`)
  console.log(`   重叠大小: ${CONFIG.chunkOverlap} 字\n`)

  // 4. 转换向量
  console.log('🔢 转换为向量...')
  const vectors = await embeddings.embedDocuments(chunks)
  console.log(`   向量数量: ${vectors.length}`)
  console.log(`   向量维度: ${vectors[0].length}\n`)

  // 5. 存储到 Chroma
  console.log('💾 存储到 Chroma...')

  // 获取或创建 collection
  const collection = await client.getOrCreateCollection({
    name: CONFIG.collectionName,
  })

  // 清空已有数据
  const existingCount = await collection.count()
  if (existingCount > 0) {
    const existing = await collection.get()
    await collection.delete({ ids: existing.ids })
    console.log(`   已清理 ${existingCount} 条旧数据`)
  }

  // 生成 ID 和元数据
  const ids = chunks.map((_, i) => `chunk_${i + 1}`)
  const metadatas = chunks.map((_, i) => ({
    chunk_index: i + 1,
    source: CONFIG.filePath,
  }))

  // 存储
  await collection.add({
    ids,
    embeddings: vectors,
    documents: chunks,
    metadatas,
  })

  console.log(`   存储成功! 当前文档数: ${await collection.count()}\n`)

  return { client, collection, embeddings }
}

/**
 * 测试：验证插入是否成功
 */
async function runTests(embeddings, collection) {
  console.log('🧪 运行测试...\n')

  // 测试1：检查文档数量
  const count = await collection.count()
  console.log(`测试1 - 文档数量检查:`)
  console.log(`   期望: > 0, 实际: ${count}`)
  console.log(`   结果: ${count > 0 ? '✅ 通过' : '❌ 失败'}\n`)

  // 测试2：语义检索测试
  console.log(`测试2 - 语义检索测试:`)

  const queries = [
    'Claude Code 是什么？',
    'Obsidian 怎么用？',
    '知识管理有什么重要性？',
  ]

  for (const query of queries) {
    console.log(`\n   查询: "${query}"`)
    const queryVector = await embeddings.embedQuery(query)
    const results = await collection.query({
      queryEmbeddings: [queryVector],
      nResults: 2,
    })

    console.log(`   结果:`)
    results.documents[0].forEach((doc, i) => {
      const distance = results.distances[0][i]
      console.log(`   [${i + 1}] 距离: ${distance.toFixed(4)}`)
      console.log(`       "${doc.substring(0, 80)}..."`)
    })
  }

  // 测试3：元数据检查
  console.log(`\n\n测试3 - 元数据检查:`)
  const sample = await collection.get({ limit: 1 })
  if (sample.metadatas && sample.metadatas.length > 0) {
    console.log(`   元数据: ${JSON.stringify(sample.metadatas[0])}`)
    console.log(`   结果: ✅ 通过`)
  } else {
    console.log(`   结果: ❌ 失败`)
  }

  console.log('\n✅ 所有测试完成!')
}

// 主程序
async function main() {
  const { embeddings, collection } = await storeDocument()
  await runTests(embeddings, collection)
}

main().catch(console.error)
