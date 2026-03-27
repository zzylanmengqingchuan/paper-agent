import { graph } from './workflow.js'
import { formatOutput } from './output.js'

// 示例简历
const sampleResume = `
张三
邮箱：zhangsan@example.com
电话：138-xxxx-xxxx
所在地：北京

个人简介：
5年前端开发经验，熟悉 React、Vue 等主流框架，有大型项目开发经验。

专业技能：
- 熟练掌握 JavaScript、TypeScript
- 熟悉 React、Vue、Next.js 框架
- 了解 Node.js、Express
- 使用过 Webpack、Vite 构建工具
- 熟悉 Git 版本控制

项目经验：

1. 电商平台前端开发
描述：负责电商平台的前端开发，使用 React + TypeScript
技术栈：React、TypeScript、Ant Design、Redux
角色：前端开发工程师

2. 企业管理系统
描述：开发企业内部管理系统，包括权限管理、数据统计等功能
技术栈：Vue3、Element Plus、Axios
角色：前端开发工程师

3. 移动端 H5 页面开发
描述：负责移动端活动页面的开发
技术栈：HTML5、CSS3、JavaScript
角色：前端开发
`

// 主函数
async function main() {
  console.log('🤖 简历优化 Agent 启动中...\n')

  const config = {
    configurable: {
      thread_id: 'resume-analysis-001',
    },
  }

  try {
    const result = await graph.invoke(
      {
        resumeText: sampleResume,
      },
      config
    )

    formatOutput(result)
  } catch (error) {
    console.error('执行出错:', error)
  }
}

main()
