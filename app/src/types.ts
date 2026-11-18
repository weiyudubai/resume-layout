import type { SocialData } from './social'

export type ThemeId = 'minimal' | 'business' | 'tech' | 'academic'

export interface ResumeData extends SocialData {
  name: string
  jobTitle: string
  phone: string
  email: string
  tagline: string
  photo: string | null
  markdown: string
}

export const THEMES: { id: ThemeId; label: string }[] = [
  { id: 'minimal', label: '极简风格' },
  { id: 'business', label: '商务正式' },
  { id: 'tech', label: '互联网风' },
  { id: 'academic', label: '学术经典' },
]

export const DEFAULT_MARKDOWN = `## 个人简介
拥有5年以上开发经验的全栈工程师。专注于前端性能优化和用户体验。热衷于新技术探索，具备良好的团队领导能力和代码规范意识。

## 工作经历
### 高级前端开发 - 某某科技创新有限公司
*2021年6月 - 至今*
- 负责公司核心SaaS平台的前端架构重构，将首屏加载时间降低了40%。
- 制定前端团队代码规范，引入自动化测试流程，提升代码质量。
- 带领4人小组完成企业级组件库的开发与维护，覆盖公司内部5个主要产品。

### 软件工程师 - 某某初创企业
*2019年1月 - 2021年5月*
- 使用Node.js开发高并发RESTful API，服务超过5万日活用户。
- 集成支付网关与WebSocket实时通信功能。
- 与设计团队紧密配合，实现像素级还原的响应式页面。

## 项目经历
### 电商数据可视化大屏
*2023 | React, TypeScript, ECharts*
- 开发实时数据大屏，处理每秒上万条数据更新。
- 实现基于角色的权限控制系统(RBAC)。

### 智能任务管理系统
*2022 | Python, OpenAI API, Next.js*
- 独立开发基于AI的任务优先级自动排序工具。
- 获得Product Hunt每日推荐榜单前三名。

## 教育背景
某某理工大学 - 计算机科学与技术 本科 (2015 - 2019)

## 技能清单
| 类别 | 技能项 |
| --- | --- |
| **数据分析** | Excel（精通）、Tableau、SQL基础 |
| **销售运营** | 目标拆解、激励方案设计、数据监控 |
| **团队赋能** | 培训材料开发、案例沉淀、激励运营 |

***

- 编程语言: JavaScript, TypeScript, Python, SQL, HTML5, CSS3
- 框架技术: React, Vue.js, Node.js, Tailwind CSS, PostgreSQL
- 工具: Git, Docker, AWS, Figma, Webpack`

export const DEFAULT_DATA: ResumeData = {
  name: '张三',
  jobTitle: '高级前端工程师',
  phone: '138-0000-8888',
  email: 'zhangsan@example.com',
  tagline: '5年全栈开发经验，专注前端性能优化与用户体验',
  photo: null,
  // 社媒默认预填一组示例账号：老数据里没有这几个字段时，
  // loadData() 用默认值补齐，不用每次重新输入
  wechat: '示例公众号',
  xiaohongshu: '示例小红书',
  xiaohongshuUrl: '',
  github: 'example',
  // 示例主页地址，同上：老数据里没有这个字段时自动补齐
  website: 'https://example.com/',
  markdown: DEFAULT_MARKDOWN,
}
