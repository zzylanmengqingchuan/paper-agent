import { llm } from './llm.js'
import { skillsEvaluationTool, projectsEvaluationTool } from './tools.js'

// 提取简历信息节点
async function extractResumeInfo(state) {
  const prompt = `请从以下简历文本中提取信息，并以JSON格式返回。

简历内容：
${state.resumeText}

请提取以下信息（严格按照JSON格式返回，不要有多余文字）：
{
  "personalInfo": {
    "name": "姓名",
    "email": "邮箱",
    "phone": "电话",
    "location": "所在地"
  },
  "skills": ["技能1", "技能2", ...],
  "projects": [
    {
      "name": "项目名称",
      "description": "项目描述",
      "techStack": "技术栈",
      "role": "角色"
    }
  ],
  "yearsOfExperience": 工作年限数字
}

只返回JSON，不要有其他内容。`

  try {
    const response = await llm.invoke(prompt)
    const content = response.content

    // 提取JSON部分
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('无法解析简历信息')
    }

    const extracted = JSON.parse(jsonMatch[0])

    return {
      personalInfo: extracted.personalInfo || {},
      skills: extracted.skills || [],
      projects: extracted.projects || [],
      yearsOfExperience: extracted.yearsOfExperience || 0,
    }
  } catch (error) {
    return {
      error: `提取简历信息失败: ${error.message}`,
    }
  }
}

// 分析评估节点
async function analyzeWithTools(state) {
  try {
    // 并行评估技能和项目
    const [skillsResult, projectsResult] = await Promise.all([
      skillsEvaluationTool.invoke({
        skills: state.skills,
        yearsOfExperience: state.yearsOfExperience,
      }),
      projectsEvaluationTool.invoke({
        projects: state.projects,
        yearsOfExperience: state.yearsOfExperience,
      }),
    ])

    return {
      skillsEvaluation: skillsResult,
      projectsEvaluation: projectsResult,
    }
  } catch (error) {
    return {
      error: `分析评估失败: ${error.message}`,
    }
  }
}

// 生成建议节点
async function generateSuggestions(state) {
  const prompt = `你是一位资深的职业发展顾问。根据以下简历分析和评估结果，给出具体的简历优化建议。

## 个人信息
${JSON.stringify(state.personalInfo, null, 2)}

## 工作年限
${state.yearsOfExperience} 年

## 技能评估结果
${state.skillsEvaluation}

## 项目评估结果
${state.projectsEvaluation}

请从以下几个方面给出具体的优化建议：
1. 简历结构优化
2. 技能描述改进
3. 项目经验强化
4. 整体呈现建议

请用中文回答，格式清晰，建议具体可操作。`

  try {
    const response = await llm.invoke(prompt)
    return {
      suggestions: response.content,
    }
  } catch (error) {
    return {
      error: `生成建议失败: ${error.message}`,
    }
  }
}

export { extractResumeInfo, analyzeWithTools, generateSuggestions }
