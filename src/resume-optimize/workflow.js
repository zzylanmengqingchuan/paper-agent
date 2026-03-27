import { StateGraph, START, END, MemorySaver } from '@langchain/langgraph'
import { ResumeState } from './state.js'
import { extractResumeInfo, analyzeWithTools, generateSuggestions } from './nodes.js'

// 构建工作流
const workflow = new StateGraph(ResumeState)
  // 添加节点
  .addNode('extract', extractResumeInfo)
  .addNode('analyze', analyzeWithTools)
  .addNode('suggest', generateSuggestions)
  // 添加边
  .addEdge(START, 'extract')
  .addEdge('extract', 'analyze')
  .addEdge('analyze', 'suggest')
  .addEdge('suggest', END)

// 配置 Memory
const checkpointer = new MemorySaver()

// 编译工作流
const graph = workflow.compile({ checkpointer })

export { graph }
