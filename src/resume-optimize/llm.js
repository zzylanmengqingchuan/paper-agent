import { ChatDeepSeek } from '@langchain/deepseek'
import 'dotenv/config'

const llm = new ChatDeepSeek({
  model: 'deepseek-chat',
})

export { llm }
