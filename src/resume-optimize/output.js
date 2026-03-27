// 格式化输出结果
function formatOutput(finalState) {
  console.log('\n' + '='.repeat(60))
  console.log('📋 简历优化分析报告')
  console.log('='.repeat(60))

  // 个人信息
  if (finalState.personalInfo && Object.keys(finalState.personalInfo).length > 0) {
    console.log('\n📌 个人信息')
    console.log('-'.repeat(40))
    console.log(`  姓名：${finalState.personalInfo.name || '未提取'}`)
    console.log(`  邮箱：${finalState.personalInfo.email || '未提取'}`)
    console.log(`  电话：${finalState.personalInfo.phone || '未提取'}`)
    console.log(`  地点：${finalState.personalInfo.location || '未提取'}`)
  }

  // 工作年限
  console.log('\n📅 工作年限')
  console.log('-'.repeat(40))
  console.log(`  ${finalState.yearsOfExperience || 0} 年`)

  // 技能列表
  if (finalState.skills && finalState.skills.length > 0) {
    console.log('\n💻 专业技能')
    console.log('-'.repeat(40))
    finalState.skills.forEach((skill, index) => {
      console.log(`  ${index + 1}. ${skill}`)
    })
  }

  // 项目经验
  if (finalState.projects && finalState.projects.length > 0) {
    console.log('\n🚀 项目经验')
    console.log('-'.repeat(40))
    finalState.projects.forEach((project, index) => {
      console.log(`  项目 ${index + 1}: ${project.name || '未命名'}`)
      if (project.description) console.log(`    描述：${project.description}`)
      if (project.techStack) console.log(`    技术栈：${project.techStack}`)
      if (project.role) console.log(`    角色：${project.role}`)
    })
  }

  // 技能评估
  if (finalState.skillsEvaluation) {
    console.log('\n📊 技能评估')
    console.log('-'.repeat(40))
    console.log(finalState.skillsEvaluation)
  }

  // 项目评估
  if (finalState.projectsEvaluation) {
    console.log('\n📊 项目评估')
    console.log('-'.repeat(40))
    console.log(finalState.projectsEvaluation)
  }

  // 优化建议
  if (finalState.suggestions) {
    console.log('\n💡 优化建议')
    console.log('-'.repeat(40))
    console.log(finalState.suggestions)
  }

  // 错误信息
  if (finalState.error) {
    console.log('\n❌ 错误信息')
    console.log('-'.repeat(40))
    console.log(finalState.error)
  }

  console.log('\n' + '='.repeat(60))
}

export { formatOutput }
