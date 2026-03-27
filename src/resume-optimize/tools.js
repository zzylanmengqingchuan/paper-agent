import { tool } from '@langchain/core/tools'
import * as z from 'zod'
import { llm } from './llm.js'

// 技能评估工具
const skillsEvaluationTool = tool(
  async ({ skills, yearsOfExperience }) => {
    const prompt = `你是一位资深的技术面试官和职业发展顾问。请评估以下技能与工作年限的匹配程度。

工作年限：${yearsOfExperience} 年

技能列表：
${skills.map((s, i) => `${i + 1}. ${s}`).join('\n')}

请从以下维度进行评估：
1. 技能广度：技术栈是否覆盖了该年限应有的技术范围
2. 技能深度：是否体现了足够的技术深度和原理理解
3. 技能相关性：技能之间是否有关联性，能否体现完整的技术体系
4. 匹配度评分：1-10分，10分最匹配

请给出具体的评估结果和改进建议。`

    const response = await llm.invoke(prompt)
    return response.content
  },
  {
    name: 'evaluate_skills',
    description: '评估技能与工作年限的匹配程度',
    schema: z.object({
      skills: z.array(z.string()).describe('技能列表'),
      yearsOfExperience: z.number().describe('工作年限'),
    }),
  }
)

// 项目经验评估工具
const projectsEvaluationTool = tool(
  async ({ projects, yearsOfExperience }) => {
    const prompt = `你是一位资深的技术面试官和职业发展顾问。请评估以下项目经验与工作年限的匹配程度。

工作年限：${yearsOfExperience} 年

项目列表：
${projects
  .map(
    (p, i) =>
      `${i + 1}. ${p.name || '未命名项目'}
   - 描述：${p.description || '无描述'}
   - 技术栈：${p.techStack || '未说明'}
   - 角色：${p.role || '未说明'}`
  )
  .join('\n\n')}

请从以下维度进行评估：
1. 项目复杂度：是否体现了该年限应有的项目复杂度
2. 技术挑战：是否包含足够的技术难点和解决方案
3. 业务价值：是否清晰展示了项目的业务价值和成果
4. 角色定位：是否体现了应有的技术职责和影响力
5. 匹配度评分：1-10分，10分最匹配

请给出具体的评估结果和改进建议。`

    const response = await llm.invoke(prompt)
    return response.content
  },
  {
    name: 'evaluate_projects',
    description: '评估项目经验与工作年限的匹配程度',
    schema: z.object({
      projects: z.array(
        z.object({
          name: z.string(),
          description: z.string().optional(),
          techStack: z.string().optional(),
          role: z.string().optional(),
        })
      ),
      yearsOfExperience: z.number(),
    }),
  }
)

const toolsByName = {
  [skillsEvaluationTool.name]: skillsEvaluationTool,
  [projectsEvaluationTool.name]: projectsEvaluationTool,
}

export { skillsEvaluationTool, projectsEvaluationTool, toolsByName }
