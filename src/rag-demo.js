/**
 * RAG 完整示例：加载 PDF → 拆分 Chunk → 向量化 → 存储 → 检索
 *
 * 核心流程：
 * 1. 加载文档（PDF/文本）
 * 2. 拆分为小块（chunk），每块 1000 字符，重叠 200 字符
 * 3. 将每个 chunk 转换为向量
 * 4. 存储到 Chroma 向量数据库
 * 5. 根据查询检索最相关的内容
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

// ============================================
// 第一步：文档加载器（模拟 PDF 加载）
// ============================================

/**
 * 加载文档内容
 * 实际项目中可以用 pdf-parse 解析 PDF
 */
async function loadDocument(filePath) {
  // 如果文件存在，读取文件
  if (fs.existsSync(filePath)) {
    const ext = path.extname(filePath).toLowerCase()

    if (ext === '.pdf') {
      // 使用 pdf-parse 解析 PDF
      const pdfParse = (await import('pdf-parse')).default
      const buffer = fs.readFileSync(filePath)
      const data = await pdfParse(buffer)
      return {
        text: data.text,
        metadata: { source: filePath, pages: data.numpages }
      }
    } else if (ext === '.txt') {
      // 直接读取文本文件
      const text = fs.readFileSync(filePath, 'utf-8')
      return {
        text: text,
        metadata: { source: filePath }
      }
    }
  }

  // 返回示例文档（NIKE 年度报告模拟内容）
  return {
    text: getSampleDocument(),
    metadata: { source: 'sample-document', type: 'demo' }
  }
}

/**
 * 示例文档内容（模拟 NIKE 年度报告）
 */
function getSampleDocument() {
  return `
NIKE, INC. 2023 ANNUAL REPORT

BUSINESS OVERVIEW

NIKE, Inc. was incorporated in 1967 under the laws of the State of Oregon.
As used herein, the terms "NIKE" and the "Company" refer to NIKE, Inc. and
its predecessors, subsidiaries and affiliates, unless otherwise indicated.

Our principal business activity involves the design, development and
worldwide marketing and selling of athletic footwear, apparel, equipment,
accessories and services. NIKE is the largest seller of athletic footwear
and apparel in the world.

PRODUCTS

We sell our products through three primary business segments: North America,
Europe, Middle East & Africa (EMEA), and Greater China. Our products are
designed primarily for specific athletic use, although a large percentage
of the products are worn for casual or leisure purposes.

Footwear Products
We focus our footwear product offerings in nine categories: Running,
Basketball, Football (Soccer), Training, Sportswear, Baseball, Golf,
Skateboarding and Tennis. We also market footwear designed for aquatic
activities, baseball, cheerleading, football, lacrosse, outdoor activities
and other athletic and recreational uses.

Apparel Products
Our apparel offerings include sports apparel and accessories featuring our
NIKE Brand products in nine categories: Running, Basketball, Football (Soccer),
Training, Sportswear, Baseball, Golf, Skateboarding and Tennis.

TECHNOLOGY AND INNOVATION

Innovation is one of our key competitive advantages. We have established
leading positions in the athletic footwear and apparel industries by developing
innovative products that help improve athletic performance.

Our commitment to innovation includes developing new technologies such as:
- Flyknit technology for lightweight, formfitting footwear
- React foam cushioning for enhanced energy return
- Dri-FIT technology for moisture management in apparel
- Air technology for cushioning and support

SUSTAINABILITY

We are committed to creating a more sustainable future. Our Move to Zero
initiative aims to achieve zero carbon and zero waste to help protect the
future of sport. Key initiatives include:

1. Using recycled materials in our products
2. Transitioning to renewable energy in our facilities
3. Reducing water consumption in manufacturing
4. Creating circular design principles

FINANCIAL PERFORMANCE

For the fiscal year ended May 31, 2023:
- Total revenues: $51.2 billion
- Net income: $5.1 billion
- Gross margin: 43.5%

Our cash and short-term investments totaled $11.0 billion at fiscal year-end.

RISK FACTORS

Our business is subject to various risks including:
- Intense competition in the athletic apparel industry
- Fluctuations in foreign currency exchange rates
- Supply chain disruptions
- Changes in consumer preferences
- Economic conditions in key markets

FUTURE OUTLOOK

We continue to invest in digital capabilities and direct-to-consumer channels.
Our strategic priorities include:
- Accelerating digital transformation
- Expanding our presence in growth markets
- Continuing product innovation
- Strengthening our supply chain resilience

For more information, visit our website at www.nike.com
`
}

// ============================================
// 第二步：文本拆分器
// ============================================

/**
 * 将文档拆分为小块（chunks）
 * @param {string} text - 原始文本
 * @param {object} options - 拆分选项
 */
async function splitText(text, options = {}) {
  const {
    chunkSize = 1000,    // 每块大小
    chunkOverlap = 200,  // 重叠大小
  } = options

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize,
    chunkOverlap,
    separators: ['\n\n', '\n', '. ', ' ', ''], // 按优先级拆分
  })

  const chunks = await splitter.splitText(text)
  return chunks
}

// ============================================
// 主函数：完整 RAG 流程
// ============================================

async function main() {
  console.log('=== RAG 完整示例：PDF加载 → 拆分 → 向量化 → 存储 → 检索 ===\n')

  // 初始化 Embedding 模型
  const embeddings = new AlibabaTongyiEmbeddings({})

  // 连接 Chroma 数据库
  const client = new ChromaClient()

  // ============================================
  // 步骤 1：加载文档
  // ============================================
  console.log('📄 步骤 1：加载文档...')
  const filePath = path.join(__dirname, '../files/nke-10k-2023.pdf')
  const document = await loadDocument(filePath)
  console.log(`   文档来源: ${document.metadata.source}`)
  console.log(`   文档长度: ${document.text.length} 字符\n`)

  // ============================================
  // 步骤 2：拆分为 chunks
  // ============================================
  console.log('✂️  步骤 2：拆分为 chunks...')
  const chunks = await splitText(document.text, {
    chunkSize: 1000,
    chunkOverlap: 200,
  })
  console.log(`   拆分数量: ${chunks.length} 个 chunks`)
  console.log(`   Chunk 大小: 1000 字符`)
  console.log(`   重叠大小: 200 字符\n`)

  // 打印前 2 个 chunk 示例
  console.log('   前 2 个 chunk 示例:')
  chunks.slice(0, 2).forEach((chunk, i) => {
    console.log(`   [${i + 1}] "${chunk.substring(0, 80)}..." (${chunk.length} 字符)`)
  })
  console.log()

  // ============================================
  // 步骤 3：转换为向量
  // ============================================
  console.log('🔢 步骤 3：转换为向量...')
  const vectors = await embeddings.embedDocuments(chunks)
  console.log(`   向量数量: ${vectors.length}`)
  console.log(`   向量维度: ${vectors[0].length}\n`)

  // ============================================
  // 步骤 4：存储到 Chroma
  // ============================================
  console.log('💾 步骤 4：存储到 Chroma 数据库...')

  // 创建/获取 collection
  const collection = await client.getOrCreateCollection({
    name: 'nike_annual_report',
  })

  // 清理旧数据
  const existingCount = await collection.count()
  if (existingCount > 0) {
    const existingIds = (await collection.get()).ids
    await collection.delete({ ids: existingIds })
    console.log(`   已清理 ${existingCount} 条旧数据`)
  }

  // 生成 ID 并存储
  const ids = chunks.map((_, i) => `chunk_${i + 1}`)
  const metadatas = chunks.map((_, i) => ({
    chunk_index: i + 1,
    source: document.metadata.source,
  }))

  await collection.add({
    ids,
    embeddings: vectors,
    documents: chunks,
    metadatas,
  })

  console.log(`   存储成功! 当前文档数: ${await collection.count()}\n`)

  // ============================================
  // 步骤 5：执行检索
  // ============================================
  console.log('🔍 步骤 5：执行语义检索...\n')

  // 检索 1：关于技术创新
  const query1 = 'What technology innovations does Nike have?'
  console.log(`   查询 1: "${query1}"`)

  const queryVector1 = await embeddings.embedQuery(query1)
  const results1 = await collection.query({
    queryEmbeddings: [queryVector1],
    nResults: 3,
  })

  console.log('   检索结果:')
  results1.documents[0].forEach((doc, i) => {
    const score = 1 - results1.distances[0][i] // 转换为相似度
    console.log(`   [${i + 1}] 相似度: ${score.toFixed(4)}`)
    console.log(`       "${doc.substring(0, 120)}..."`)
    console.log()
  })

  // 检索 2：关于可持续发展
  const query2 = '可持续发展相关的信息'
  console.log(`   查询 2: "${query2}"`)

  const queryVector2 = await embeddings.embedQuery(query2)
  const results2 = await collection.query({
    queryEmbeddings: [queryVector2],
    nResults: 3,
  })

  console.log('   检索结果:')
  results2.documents[0].forEach((doc, i) => {
    const score = 1 - results2.distances[0][i]
    console.log(`   [${i + 1}] 相似度: ${score.toFixed(4)}`)
    console.log(`       "${doc.substring(0, 120)}..."`)
    console.log()
  })

  // ============================================
  // 总结
  // ============================================
  console.log('='.repeat(60))
  console.log('RAG 流程完成!')
  console.log('='.repeat(60))
  console.log(`
核心概念回顾:
1. Chunk 拆分: 大文档 → 小块，便于精准检索
2. 重叠(Overlap): 相邻 chunk 有重叠，保证语义完整性
3. 语义检索: 根据含义而非关键词匹配内容
4. 相似度: 距离越小越相似，可转换为 0-1 的相似度分数
`)
}

main().catch(console.error)
