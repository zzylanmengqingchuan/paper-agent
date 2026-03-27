# LangChain & LangGraph Learning

本项目用于学习 LangChain 和 LangGraph 的各种功能。

## 功能列表

| 功能 | 说明 | 运行命令 |
|------|------|----------|
| Weather Tool | 自定义工具 + DeepSeek 调用 | `npm start` |
| Chain Demo | LangChain 链式调用 | `npm run chain` |
| Vector/Embedding | 文本转向量 + 语义相似度 | `npm run vector` |
| Chroma 向量数据库 | 向量存储 + 语义搜索 | `npm run chroma` |

## 安装

```bash
npm install
```

## 配置

创建 `.env` 文件：

```env
# DeepSeek API Key（用于 LLM）
DEEPSEEK_API_KEY=your_deepseek_api_key

# 阿里云百炼 API Key（用于 Embedding）
# 申请地址: https://bailian.console.aliyun.com/?tab=model#/api-key
ALIBABA_API_KEY=your_alibaba_api_key
```

## 运行

### Weather Tool

```bash
npm start
```

演示如何定义自定义工具，让模型自动决定何时调用。

### Chain Demo

```bash
npm run chain

# 可指定主题
node src/chain-demo.js 北极熊
```

演示 LangChain 链式调用。

### Vector/Embedding (RAG 基础)

```bash
npm run vector
```

演示 RAG 的核心概念 - 文本转向量：

1. **单文本转向量** - 将文字转换为 1536 维向量
2. **批量文本转向量** - 一次处理多个文本
3. **语义相似度计算** - 使用余弦相似度比较语义接近程度

输出示例：
```
语义相似度计算:
  "双11降价促销" vs "11.11购物节优惠": 0.7127  (语义相近)
  "双11降价促销" vs "今天天气真好": 0.0977    (语义无关)
```

### Chroma 向量数据库

```bash
# 1. 先启动 Chroma 服务（需要单独终端）
chroma run

# 2. 运行示例（另一个终端）
npm run chroma
```

演示向量数据库的核心功能：

1. **存储向量** - 将文本向量持久化到数据库
2. **语义搜索** - 根据查询文本找出最相似的文档
3. **距离计算** - 距离越小，语义越相似

输出示例：
```
查询文本: 夏威夷的菠萝种植

搜索结果:
  [1] "菠萝是一种热带水果..." 距离: 0.8175 (最相似)
  [2] "夏威夷是美国的一个州..." 距离: 0.8676
  [3] "苹果是最常见的水果..." 距离: 1.2005
```

## RAG 概念

RAG (Retrieval-Augmented Generation) 检索增强生成，是 AI 搜索资料辅助生成答案的有效方式。

核心步骤：
1. 把资料拆分为向量格式，存储在向量数据库
2. 用户提问时去向量数据库检索相关内容
3. 把检索结果发送给 AI 配合一起生成最终答案

## 依赖

- `@langchain/core` - LangChain 核心
- `@langchain/deepseek` - DeepSeek 模型集成
- `@langchain/community` - 社区集成（含阿里通义 Embedding）
- `@langchain/langgraph` - LangGraph 状态图
- `chromadb` - Chroma 向量数据库客户端
