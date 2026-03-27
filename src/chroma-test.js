/**
 * Chroma 向量数据库示例
 *
 * Chroma 是一个开源的向量数据库，用于存储和检索文本向量
 * 核心概念：
 * - Collection: 类似数据库中的表，存储同类数据
 * - Embedding: 将文本转换为高维向量
 * - Distance: 向量之间的距离，越小表示语义越相似
 */

import { ChromaClient } from 'chromadb'
import { AlibabaTongyiEmbeddings } from '@langchain/community/embeddings/alibaba_tongyi'
import 'dotenv/config'

async function main() {
  console.log('=== Chroma 向量数据库示例 ===\n')

  // 1. 创建 Chroma 客户端（连接本地服务）
  console.log('1. 连接 Chroma 服务...')
  const client = new ChromaClient()
  console.log('   连接成功!\n')

  // 2. 创建 Embedding 模型（用于文本转向量）
  const embeddings = new AlibabaTongyiEmbeddings({})

  // 3. 获取或创建 Collection（数据集合）
  console.log('2. 创建/获取 Collection...')
  const collection = await client.getOrCreateCollection({
    name: 'test_collection',
  })
  console.log('   Collection 名称:', collection.name)
  console.log('   已有文档数:', await collection.count())
  console.log()

  // 4. 准备要存储的文档
  const documents = [
    '菠萝是一种热带水果，味道酸甜可口',
    '橙子富含维生素C，有助于增强免疫力',
    '苹果是最常见的水果之一，营养丰富',
    '夏威夷是美国的一个州，以美丽的海滩闻名',
    '机器学习是人工智能的一个重要分支',
  ]

  // 5. 将文本转换为向量
  console.log('3. 将文本转换为向量...')
  const vectors = await embeddings.embedDocuments(documents)
  console.log('   文档数量:', documents.length)
  console.log('   向量维度:', vectors[0].length)
  console.log()

  // 6. 将向量存入 Chroma
  console.log('4. 将向量存入 Chroma...')
  const ids = documents.map((_, i) => `doc_${i + 1}`)
  await collection.add({
    ids: ids,
    embeddings: vectors,
    documents: documents,
    metadatas: documents.map((_, i) => ({ index: i + 1 })),
  })
  console.log('   存入成功! 当前文档数:', await collection.count())
  console.log()

  // 7. 执行语义搜索
  console.log('5. 执行语义搜索...')
  const queryText = '夏威夷的菠萝种植'
  console.log('   查询文本:', queryText)

  // 将查询文本也转换为向量
  const queryVector = await embeddings.embedQuery(queryText)

  // 在 Chroma 中搜索最相似的文档
  const results = await collection.query({
    queryEmbeddings: [queryVector],
    nResults: 3, // 返回最相似的 3 个结果
  })

  console.log('\n   搜索结果:')
  console.log('   '.padEnd(50, '-'))
  results.documents[0].forEach((doc, i) => {
    const distance = results.distances[0][i]
    const id = results.ids[0][i]
    console.log(`   [${i + 1}] ID: ${id}`)
    console.log(`       文档: "${doc}"`)
    console.log(`       距离: ${distance.toFixed(4)} (越小越相似)`)
    console.log()
  })

  // 8. 解释距离含义
  console.log('6. 距离解读:')
  console.log('   距离越小 = 语义越相似')
  console.log('   "夏威夷的菠萝种植" 与 "菠萝..." 的距离最小')
  console.log('   因为它们在语义上最相关（夏威夷以菠萝种植闻名）')
  console.log()

  // 清理：删除测试数据（可选）
  // await client.deleteCollection({ name: 'test_collection' })
  // console.log('已清理测试数据')
}

main().catch(console.error)
