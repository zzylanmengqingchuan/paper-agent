/**
 * RAG 入门：文本转向量（Embedding）示例
 *
 * 向量（Vector）是将文本转换为高维坐标表示的方式
 * 语义相近的文字，其向量在空间中的距离也更近
 */

import { AlibabaTongyiEmbeddings } from '@langchain/community/embeddings/alibaba_tongyi'
import 'dotenv/config'

async function main() {
  console.log('=== 文本转向量示例 ===\n')

  // 创建 Embedding 模型实例
  const model = new AlibabaTongyiEmbeddings({})

  // 1. 单个文本转向量
  console.log('1. 单个文本转向量:')
  const vector = await model.embedQuery('双11降价促销活动')
  console.log('   输入文本: "双11降价促销活动"')
  console.log('   向量维度:', vector.length)
  console.log('   向量前10位:', vector.slice(0, 10))
  console.log()

  // 2. 批量文本转向量
  console.log('2. 批量文本转向量:')
  const texts = [
    '双11降价促销',
    '11.11购物节优惠',
    '今天天气真好',
    '机器学习入门教程'
  ]
  const vectors = await model.embedDocuments(texts)
  console.log('   输入文本:', texts)
  console.log('   生成向量数:', vectors.length)
  console.log('   每个向量维度:', vectors[0].length)
  console.log()

  // 3. 计算语义相似度（余弦相似度）
  console.log('3. 语义相似度计算:')
  const v1 = vectors[0] // "双11降价促销"
  const v2 = vectors[1] // "11.11购物节优惠"
  const v3 = vectors[2] // "今天天气真好"

  const similarity12 = cosineSimilarity(v1, v2)
  const similarity13 = cosineSimilarity(v1, v3)

  console.log('   "双11降价促销" vs "11.11购物节优惠":', similarity12.toFixed(4))
  console.log('   "双11降价促销" vs "今天天气真好":', similarity13.toFixed(4))
  console.log()
  console.log('   结论: 语义相近的文本，相似度更高!')
}

/**
 * 计算两个向量的余弦相似度
 * 值范围 [-1, 1]，越接近 1 表示越相似
 */
function cosineSimilarity(a, b) {
  if (a.length !== b.length) {
    throw new Error('向量维度必须相同')
  }

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

main().catch(console.error)
