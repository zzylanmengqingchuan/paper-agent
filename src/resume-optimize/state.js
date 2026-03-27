import { Annotation } from '@langchain/langgraph'

// 定义工作流状态
const ResumeState = Annotation.Root({
  // 原始简历文本
  resumeText: Annotation({
    reducer: (x, y) => y ?? x ?? '',
    default: () => '',
  }),
  // 提取的个人信息
  personalInfo: Annotation({
    reducer: (x, y) => y ?? x ?? {},
    default: () => ({}),
  }),
  // 提取的专业技能
  skills: Annotation({
    reducer: (x, y) => y ?? x ?? [],
    default: () => [],
  }),
  // 提取的项目经验
  projects: Annotation({
    reducer: (x, y) => y ?? x ?? [],
    default: () => [],
  }),
  // 工作年限
  yearsOfExperience: Annotation({
    reducer: (x, y) => y ?? x ?? 0,
    default: () => 0,
  }),
  // 技能评估结果
  skillsEvaluation: Annotation({
    reducer: (x, y) => y ?? x ?? '',
    default: () => '',
  }),
  // 项目评估结果
  projectsEvaluation: Annotation({
    reducer: (x, y) => y ?? x ?? '',
    default: () => '',
  }),
  // 最终建议
  suggestions: Annotation({
    reducer: (x, y) => y ?? x ?? '',
    default: () => '',
  }),
  // 错误信息
  error: Annotation({
    reducer: (x, y) => y ?? x ?? '',
    default: () => '',
  }),
})

export { ResumeState }
