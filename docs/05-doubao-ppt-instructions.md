# 交付物二B轨：豆包 PPT 生成指令（中文版）

**整体风格**：深色科技风，背景深蓝 #1e293b，文字白色，强调色 #4f46e5。标题 28pt 粗体，正文 16pt，每页不超过 5 个要点。图表优先，避免纯文字页。

---

**第 1 页 - 封面**
标题：语流 VoiceFlow Builder — 10分钟搭建专业语音接待员
要点：
1. 副标题：面向中小企业的可视化工作流构建器
2. 产品Logo占位
3. 2026年5月
视觉：居中大标题 + 副标题 + 产品图标占位，深蓝渐变背景

**第 2 页 - 产品理解：核心问题**
标题：中小企业的语音接待困境
要点：
1. 78%的中小企业仍在用人工接听所有来电
2. 现有方案要么太贵（呼叫中心），要么太简陋（录音电话）
3. 非技术用户无法使用开发者工具（Bland AI/Vapi需API能力）
4. 核心诉求：10分钟能用 + 业务复杂能扛
视觉：左侧痛点列表 + 右侧对比图（传统方案 vs 语流）

**第 3 页 - 产品理解：核心能力**
标题：语流的三大核心能力
要点：
1. 可视化工作流构建器：拖拽节点+连线，零代码搭建流程
2. 规则优先AI增强：核心流程零延迟零成本，AI在三个质变点精准赋能
3. 节点级运营洞察：热力图+漏斗定位流失节点，数据驱动迭代
视觉：左侧3个能力图标 + 右侧产品界面截图占位

**第 4 页 - 产品理解：目标用户**
标题：谁需要语流？
要点：
1. 小企业主(1-20人)：无技术团队，需快速搭建语音接待员
2. 中型企业团队管理者(20-200人)：需客服分流和自动化
3. 在线业务运营者：需网站嵌入语音通话，无电话号码需求
视觉：三列用户画像卡片，每列包含角色图标+特征+诉求

**第 5 页 - 工作流构建器架构：运作原理**
标题：工作流如何运转？
要点：
1. 来电触发 → 节点执行 → 条件路由 → 动作执行 → 通话结束
2. 每个节点：输入 → 处理逻辑 → 输出，确定性执行
3. AI节点有降级方案：AI不可用时自动回退到规则流程
视觉：用横向流程图展示来电→节点链→结束的全流程，标注节点类型颜色

**第 6 页 - 工作流构建器架构：用户如何构建**
标题：三步构建语音接待员
要点：
1. 拖拽节点：从节点库拖入画布，19种节点覆盖全场景
2. 连线配置：连线表达数据流，双击节点配置参数
3. 模拟发布：文字模拟验证 → 一键发布上线
视觉：三步骤横向流程图，每步配产品界面截图占位

**第 7 页 - 工作流构建器架构：画布交互**
标题：画布交互设计
要点：
1. 拖拽添加节点 + 连线表达数据流 + 双击配置参数
2. 实时校验：环路/断路/必填项，错误即时提示
3. 配置即时预览：修改话术可TTS试听
4. 缩放/平移/小地图，支持大型流程
视觉：产品界面截图占位，标注关键交互区域

**第 8 页 - 核心节点库：四层节点体系**
标题：19个节点，四层递进
要点：
1. 核心层(8节点)：来电触发/问候/提问/收集/转接/发短信/记录/结束
2. 逻辑层(4节点)：条件分支/If-Else/营业时间判断/来电类型检测
3. 集成层(4节点)：CRM查询/日历预订/发送通知/Webhook
4. AI增强层(3节点)：意图检测/知识库问答/通话摘要
视觉：用2×2矩阵图展示四层节点，每层不同颜色

**第 9 页 - 核心节点库：核心层详解**
标题：核心层 — 通话流程骨架
要点：
1. 来电触发器：唯一入口，自动提取来电信息
2. 问候/开场白：按时间段智能选话术，变量替换
3. 提问节点：支持语音+按键双输入，超时重试可配
4. 转接呼叫：暖/冷转接，失败路径自动降级
5. 每个节点有明确配置项，用户"知道配什么"
视觉：节点卡片列表，每个展示名称+图标+关键配置项

**第 10 页 - 核心节点库：逻辑层详解**
标题：逻辑层 — 流程控制中枢
要点：
1. 条件分支：多条件路由（≤4分支），支持正则匹配
2. If/Else：简单二元判断，降低配置复杂度
3. 营业时间判断：时区+节假日日历+特殊日期覆盖
4. 来电类型检测：老客户/VIP/黑名单自动识别
视觉：条件分支的决策树示意图，标注各分支条件

**第 11 页 - 高级节点与AI论证：为什么AI不是越多越好**
标题：规则优先、AI增强策略
要点：
1. 17个规则节点覆盖80%场景，零延迟零增量成本
2. AI仅在3个质变点引入：意图检测(通话时长-35%)、知识库问答(人工转接-68%)、通话摘要(节省100%人工)
3. 情感检测和智能路由归入P2：规则近似替代代价可控(精度差~15%)，省去$0.05/min成本和500ms延迟
4. AI节点必须有降级方案：意图未识别→按键菜单
视觉：用2列对比图展示"全AI"vs"规则优先AI增强"的成本/延迟/覆盖对比

**第 12 页 - 高级节点与AI论证：AI节点详解**
标题：三个AI质变点
要点：
1. AI意图检测：将按键导航替换为自然语言理解，1步直达vs4.2步，放弃率6%vs28%
2. 知识库问答(RAG)：一个知识库覆盖数百FAQ，拦截68%人工转接
3. 通话摘要：离线生成，零实时延迟，3分钟人工→30秒AI
视觉：3列卡片，每列展示一个AI节点的输入→处理→输出

**第 13 页 - 高级节点与AI论证：成本与延迟权衡**
标题：成本与延迟的精确边界
要点：
1. 纯规则引擎：$0增量成本，<10ms延迟
2. +AI意图检测：+$0.02/min，+300ms，回报：通话时长-35%
3. +知识库问答：+$0.03/min，+600ms，回报：人工转接-68%
4. 全AI Agent：+$0.08-0.12/min，+800ms，仅高复杂度场景值得
视觉：用折线图展示4种策略的成本(横轴)vs延迟(纵轴)vs回报(气泡大小)

**第 14 页 - 通信接入与模拟测试：三种接入模式**
标题：三模通信接入
要点：
1. 平台托管号码：开箱即用，购买→绑定→上线，$1-3/月+0.01/min
2. 自带号码(SIP/移植)：保持现有号码，SIP Forwarding或号码移植
3. WebRTC浏览器通话：无需电话号码，嵌入网站直接通话，$0.003-0.008/min
4. 全市场唯一同时提供三种模式的语音AI平台
视觉：用3列卡片对比展示三种模式的步骤/成本/适用客群

**第 15 页 - 通信接入与模拟测试：双模测试**
标题：两种模拟测试
要点：
1. 文字模拟：画布内即时验证，秒级迭代，高亮当前执行节点
2. 真实通话模拟：临时号码语音测试，TTS+ASR真实验证
3. 被低估的杀手功能：文字模拟将"设计-测试"循环从分钟级降到秒级
视觉：左右分屏展示两种模式的界面截图占位

**第 16 页 - 版本管理与运营看板：版本管理**
标题：安全迭代，恐惧归零
要点：
1. 每次保存自动快照，保留最近50个版本
2. 版本Diff：新增绿/删除红/修改黄高亮对比
3. 一键回滚：修改出错30秒恢复
4. 草稿/发布分离：已发布版本不可直接修改
视觉：版本时间线图 + Diff对比截图占位

**第 17 页 - 版本管理与运营看板：运营看板**
标题：节点级洞察，精准归因
要点：
1. 基础指标：通话量/接通率/平均时长/满意度
2. 节点热力图：绿>90%/黄70-90%/红<70%，定位流失节点
3. 转化漏斗：来电→意图检测→信息收集→转接→结束
4. 异常告警：连续失败/超时/路由失败实时通知
视觉：看板界面截图占位，标注热力图和漏斗图区域

**第 18 页 - 示例工作流A**
标题：示例：标准客服分流
要点：
1. 来电→营业时间判断→(营业)AI意图检测→咨询/预约/投诉分支
2. 非营业→知识库FAQ或留言
3. 预约分支→日历预订→发送确认短信→结束
4. 关键配置：意图检测3意图+0.7阈值+按键降级
视觉：用纵向流程图展示节点链路，标注节点类型和关键配置

**第 19 页 - 示例工作流B**
标题：示例：医疗诊所高级自动化
要点：
1. 来电→来电类型检测→(老患者)CRM查询→AI意图检测→预约/咨询/紧急分支
2. 紧急→暖转接急诊，跳过所有流程
3. 预约→匹配主治医生日历→冲突推荐最近时段
4. 知识库覆盖FAQ(营业时间/医保/停车/科室)
视觉：用纵向流程图展示多层分支+集成+AI节点组合

**第 20 页 - 总图一：竞争力全景**
标题：产品定位与竞争力
要点：
1. 差异化①：三模通信接入+双模模拟测试（全市场唯一）
2. 差异化②：规则优先AI增强的分层节点体系（每节点有配置项）
3. 差异化③：节点级运营洞察看板（热力图+漏斗归因）
4. vs Bland/Vapi/Retell：非技术用户10分钟上手
5. vs Synthflow：节点体系透明+三模接入+节点级洞察
视觉：用2×2矩阵图展示，横轴"技术门槛低→高"，纵轴"功能完整度低→高"，标注竞品和语流位置

**第 21 页 - 总图二：产品蓝图**
标题：产品蓝图与路线图
要点：
1. MVP：核心层+逻辑层+画布+平台托管号码+文字模拟+基础看板
2. V1.0：+AI增强层3节点+集成层+自带号码+真实通话模拟+版本管理+节点热力图
3. V2.0：+WebRTC+情感检测+智能路由+多租户RBAC+API开放平台
视觉：用横向时间轴展示三个版本阶段，纵轴8个功能域，标注各功能域在各版本的落地范围（热力图色块）

**第 22 页 - 总图三：用户旅程**
标题：用户操作全旅程
要点：
1. 注册→创建→配置→测试→发布→运营→迭代
2. 关键情绪转折：空白画布(intimidating)→模板选择(释然)
3. 模拟测试消除"不知对不对"焦虑
4. 版本管理消除"改了变差"恐惧
视觉：用横向旅程地图展示，上方情绪曲线，下方操作步骤+系统反馈

**第 23 页 - 总图四：技术架构**
标题：技术架构全景
要点：
1. 前端：React Flow画布 + Zustand状态管理 + WebRTC(V2.0)
2. 引擎：Node.js自研流程解释器 + Redis缓存+锁
3. 通信：Twilio/SIP网关/WebRTC网关三种接入
4. AI：LLM网关(多模型) + Deepgram ASR + ElevenLabs TTS + Pinecone RAG
5. 数据：PostgreSQL(JSONB) + Redis + S3录音 + Pinecone向量
视觉：用分层架构图展示六层技术栈，每层标注关键选型和选型理由

**第 24 页 - 总图五：优先级矩阵**
标题：功能优先级矩阵
要点：
1. Q1高价值低复杂度(P0)：核心层8节点+逻辑层4节点+画布+文字模拟+基础看板
2. Q2高价值高复杂度(P1)：AI3节点+集成4节点+真实通话模拟+版本管理+热力图
3. Q3低价值低复杂度(P2)：并行分支+自定义看板
4. Q4低价值高复杂度(P2)：情感检测+智能路由+多Agent
视觉：用2×2矩阵图展示，横轴"实现复杂度低→高"，纵轴"用户价值低→高"，标注功能分布

**第 25 页 - 原型展示**
标题：可交互原型预览
要点：
1. 工作流画布页：拖拽连线+节点配置+实时校验
2. 模拟测试页：文字对话模拟+节点路径高亮
3. 运营看板页：KPI卡片+趋势图+热力图+漏斗
4. 通信接入页：三种模式切换+成本对比
视觉：2×2网格展示4个核心页面截图占位

**第 26 页 - 竞品对比**
标题：竞品功能矩阵
要点：
1. 5款竞品(Bland/Vapi/Synthflow/Retell/Voiceflow) vs 语流
2. 唯一同时提供三模通信接入和双模模拟测试
3. 唯一提供节点级运营洞察(热力图+漏斗)
4. 唯一原生WebRTC浏览器通话
视觉：用对比表格展示功能矩阵，语流优势列高亮

**第 27 页 - 商业模式**
标题：混合计费模型
要点：
1. 基础套餐$29/月(含100min+1号码) + 超出按量 + AI按量
2. Starter $49/月(200min) / Pro $149/月(1000min) / Enterprise 定制
3. 收入构成：套餐费(60%) + 通话量超额(25%) + AI调用(15%)
视觉：用阶梯定价图展示4个套餐层级

**第 28 页 - 核心收获**
标题：核心收获
要点：
1. AI不是越多越好——三个质变点就够了，规则优先AI增强是正确策略
2. 文字模拟测试是被低估的杀手功能，秒级迭代解决"10分钟可用"命题
3. 节点级运营洞察比AI更有商业价值——从工具到平台的关键升级
4. WebRTC开辟"无电话号码"新市场
5. 版本管理不是工程功能而是业务保障——消除迭代恐惧

**第 29 页 - 下一步行动**
标题：下一步行动
要点：
1. MVP开发启动：核心层+逻辑层+画布+平台托管号码+文字模拟
2. 种子用户招募：50家中小企业内测
3. AI节点V1.0验证：意图检测+知识库问答+通话摘要
4. 通信接入扩展：自带号码(SIP)+真实通话模拟

---

# 交付物二B轨：豆包 PPT 生成指令（English Version）

**Overall Style**: Dark tech theme, background dark blue #1e293b, white text, accent #4f46e5. Title 28pt bold, body 16pt, max 5 bullet points per page. Charts over text, avoid pure text pages.

---

**Page 1 - Cover**
Title: VoiceFlow Builder — Build a Professional Voice Receptionist in 10 Minutes
Points:
1. Subtitle: Visual Workflow Builder for SMBs
2. Product logo placeholder
3. May 2026
Visual: Centered title + subtitle + product icon placeholder, dark blue gradient background

**Page 2 - Product Understanding: The Problem**
Title: The Voice Reception Dilemma for SMBs
Points:
1. 78% of SMBs still use manual call answering
2. Existing solutions: either too expensive (call centers) or too basic (voicemail)
3. Non-technical users can't use developer tools (Bland AI/Vapi require API skills)
4. Core need: usable in 10 min + scalable for complex business
Visual: Left pain points list + right comparison chart (traditional vs VoiceFlow)

**Page 3 - Product Understanding: Core Capabilities**
Title: Three Core Capabilities of VoiceFlow
Points:
1. Visual workflow builder: drag-and-drop nodes + connections, zero code
2. Rules-first, AI-enhanced: core flow at zero latency/cost, AI at 3 inflection points
3. Node-level operational insights: heatmap + funnel for churn attribution
Visual: Left 3 capability icons + right product interface screenshot placeholder

**Page 4 - Product Understanding: Target Users**
Title: Who Needs VoiceFlow?
Points:
1. Small business owners (1-20 people): no tech team, need quick setup
2. Mid-size team managers (20-200): need call routing and automation
3. Online business operators: need website-embedded voice calls, no phone number needed
Visual: Three-column user persona cards with role icon + traits + needs

**Page 5 - Workflow Builder Architecture: How It Works**
Title: How Does the Workflow Run?
Points:
1. Call trigger → Node execution → Conditional routing → Action execution → Call end
2. Each node: Input → Processing logic → Output, deterministic execution
3. AI nodes have fallback: auto-revert to rules when AI unavailable
Visual: Horizontal flowchart showing call→node chain→end, with node type color coding

**Page 6 - Workflow Builder Architecture: How Users Build**
Title: Build a Voice Receptionist in 3 Steps
Points:
1. Drag nodes: 19 node types from the palette, covering all scenarios
2. Connect & configure: connections express data flow, double-click to configure
3. Simulate & publish: text simulation validation → one-click publish
Visual: Three-step horizontal flowchart with product screenshot placeholders

**Page 7 - Workflow Builder Architecture: Canvas Interaction**
Title: Canvas Interaction Design
Points:
1. Drag to add nodes + connections for data flow + double-click to configure
2. Real-time validation: loops/disconnects/required fields, instant error feedback
3. Config preview: modify script and TTS preview
4. Zoom/pan/minimap for large workflows
Visual: Product screenshot placeholder with key interaction areas annotated

**Page 8 - Core Node Library: Four-Layer System**
Title: 19 Nodes, Four Progressive Layers
Points:
1. Core (8): Call trigger/Greeting/Ask/Collect/Transfer/SMS/Log/End
2. Logic (4): Conditional/If-Else/Business Hours/Call Type Detection
3. Integration (4): CRM Lookup/Calendar Booking/Send Notification/Webhook
4. AI Enhanced (3): Intent Detection/Knowledge Q&A/Call Summary
Visual: 2×2 matrix chart showing four layers, each with distinct color

**Page 9 - Core Node Library: Core Layer**
Title: Core Layer — The Call Flow Backbone
Points:
1. Call Trigger: single entry point, auto-extract caller info
2. Greeting: time-based script selection, variable substitution
3. Ask Question: dual input (speech + DTMF), configurable timeout/retry
4. Transfer Call: warm/cold transfer, auto-degrade on failure
5. Every node has explicit config items — users "know what to configure"
Visual: Node card list, each showing name + icon + key config items

**Page 10 - Core Node Library: Logic Layer**
Title: Logic Layer — Flow Control Hub
Points:
1. Conditional Branch: multi-condition routing (≤4 branches), regex support
2. If/Else: simple binary judgment, reduced config complexity
3. Business Hours: timezone + holiday calendar + special date override
4. Call Type Detection: returning/VIP/blacklist auto-identification
Visual: Decision tree diagram with branch conditions annotated

**Page 11 - Advanced Nodes & AI: Why Less AI Is More**
Title: Rules-First, AI-Enhanced Strategy
Points:
1. 17 rule nodes cover 80% of scenarios at zero latency/cost
2. AI only at 3 inflection points: intent detection (call time -35%), knowledge Q&A (human transfer -68%), call summary (100% manual time saved)
3. Emotion detection & smart routing in P2: rule approximation cost is manageable (~15pp accuracy loss), saving $0.05/min and 500ms latency
4. AI nodes must have fallback: unrecognized intent → DTMF menu
Visual: Two-column comparison chart: "Full AI" vs "Rules-First, AI-Enhanced" cost/latency/coverage

**Page 12 - Advanced Nodes & AI: AI Node Details**
Title: Three AI Inflection Points
Points:
1. AI Intent Detection: replace DTMF navigation with NLU, 1 step vs 4.2 steps, 6% vs 28% abandonment
2. Knowledge Q&A (RAG): one knowledge base covers hundreds of FAQs, blocks 68% of human transfers
3. Call Summary: offline generation, zero real-time latency, 3 min manual → 30 sec AI
Visual: 3-column cards, each showing input→processing→output

**Page 13 - Advanced Nodes & AI: Cost-Latency Tradeoff**
Title: Precise Boundaries of Cost and Latency
Points:
1. Pure rules engine: $0 incremental cost, <10ms latency
2. +AI Intent Detection: +$0.02/min, +300ms, return: call time -35%
3. +Knowledge Q&A: +$0.03/min, +600ms, return: human transfer -68%
4. Full AI Agent: +$0.08-0.12/min, +800ms, only for high-complexity scenarios
Visual: Line chart showing 4 strategies: cost (x-axis) vs latency (y-axis) vs return (bubble size)

**Page 14 - Telephony & Simulation: Three Access Modes**
Title: Triple-Mode Telephony Access
Points:
1. Platform Managed: out-of-box, purchase→bind→launch, $1-3/mo + $0.01/min
2. Bring Your Own (SIP/Port): keep existing number, SIP Forwarding or LNP
3. WebRTC Browser Call: no phone number needed, embed in website, $0.003-0.008/min
4. Only platform offering all three modes simultaneously
Visual: 3-column card comparison showing steps/cost/target audience per mode

**Page 15 - Telephony & Simulation: Dual-Mode Testing**
Title: Two Simulation Modes
Points:
1. Text Simulation: instant validation in canvas, second-level iteration, highlight current node
2. Live Call Test: temp number voice test, real TTS+ASR validation
3. Underestimated killer feature: text simulation reduces "design-test" loop from minutes to seconds
Visual: Split-screen showing both mode interface screenshots

**Page 16 - Version Mgmt & Dashboard: Version Management**
Title: Safe Iteration, Zero Fear
Points:
1. Auto-snapshot on every save, keep latest 50 versions
2. Version Diff: added green/deleted red/modified yellow highlighting
3. One-click rollback: recover in 30 seconds if changes go wrong
4. Draft/Published separation: published versions cannot be directly modified
Visual: Version timeline + Diff comparison screenshot placeholder

**Page 17 - Version Mgmt & Dashboard: Operations Dashboard**
Title: Node-Level Insights, Precise Attribution
Points:
1. Basic metrics: call volume/answer rate/avg duration/satisfaction
2. Node heatmap: green>90%/yellow 70-90%/red<70%, locate churn nodes
3. Conversion funnel: inbound→intent→collection→transfer→end
4. Exception alerts: consecutive failures/timeout/routing failure real-time notifications
Visual: Dashboard screenshot placeholder with heatmap and funnel areas annotated

**Page 18 - Example Workflow A**
Title: Example: Standard Customer Service Routing
Points:
1. Call→Business Hours→(Open) AI Intent Detection→Consult/Book/Complain branches
2. Non-business→Knowledge FAQ or Voicemail
3. Booking→Calendar Booking→SMS Confirmation→End
4. Key config: 3 intents + 0.7 threshold + DTMF fallback
Visual: Vertical flowchart with node types and key configs annotated

**Page 19 - Example Workflow B**
Title: Example: Medical Clinic Advanced Automation
Points:
1. Call→Call Type→(Returning) CRM Lookup→AI Intent→Booking/Consult/Emergency branches
2. Emergency→warm transfer to ER, skip all flow
3. Booking→match doctor's calendar→conflict suggest nearest slot
4. Knowledge base covers FAQ (hours/insurance/parking/departments)
Visual: Vertical flowchart showing multi-level branching + integration + AI nodes

**Page 20 - Summary Chart 1: Competitive Landscape**
Title: Product Positioning & Competitiveness
Points:
1. Differentiator 1: Triple-mode telephony + dual-mode simulation (market-unique)
2. Differentiator 2: Rules-first AI-enhanced layered node system (every node has config items)
3. Differentiator 3: Node-level operational insights (heatmap + funnel attribution)
4. vs Bland/Vapi/Retell: non-technical users productive in 10 minutes
5. vs Synthflow: transparent node system + triple-mode access + node-level insights
Visual: 2×2 matrix chart, x-axis "Technical Barrier Low→High", y-axis "Feature Completeness Low→High", mark competitors and VoiceFlow positions

**Page 21 - Summary Chart 2: Product Blueprint**
Title: Product Blueprint & Roadmap
Points:
1. MVP: Core+Logic layers + Canvas + Platform numbers + Text sim + Basic dashboard
2. V1.0: +AI 3 nodes + Integration 4 nodes + BYO numbers + Live test + Version mgmt + Heatmap
3. V2.0: +WebRTC + Emotion detection + Smart routing + Multi-tenant RBAC + API platform
Visual: Horizontal timeline showing 3 version stages, y-axis 8 feature domains, heat-map colored blocks per version

**Page 22 - Summary Chart 3: User Journey**
Title: End-to-End User Journey
Points:
1. Signup→Create→Configure→Test→Publish→Operate→Iterate
2. Key emotion shift: blank canvas (intimidating) → template selection (relief)
3. Simulation eliminates "not sure if it works" anxiety
4. Version management eliminates "changes made it worse" fear
Visual: Horizontal journey map, emotion curve above, action steps + system feedback below

**Page 23 - Summary Chart 4: Tech Architecture**
Title: Technology Architecture Overview
Points:
1. Frontend: React Flow canvas + Zustand state + WebRTC (V2.0)
2. Engine: Node.js custom flow interpreter + Redis cache/lock
3. Telephony: Twilio / SIP gateway / WebRTC gateway three access modes
4. AI: LLM gateway (multi-model) + Deepgram ASR + ElevenLabs TTS + Pinecone RAG
5. Data: PostgreSQL (JSONB) + Redis + S3 recordings + Pinecone vectors
Visual: Layered architecture diagram showing 6 layers, key tech choices and reasons annotated

**Page 24 - Summary Chart 5: Priority Matrix**
Title: Feature Priority Matrix
Points:
1. Q1 High value Low complexity (P0): Core 8 + Logic 4 + Canvas + Text sim + Basic dashboard
2. Q2 High value High complexity (P1): AI 3 + Integration 4 + Live test + Version mgmt + Heatmap
3. Q3 Low value Low complexity (P2): Parallel branch + Custom dashboard
4. Q4 Low value High complexity (P2): Emotion detection + Smart routing + Multi-agent
Visual: 2×2 matrix chart, x-axis "Implementation Complexity Low→High", y-axis "User Value Low→High", feature distribution marked

**Page 25 - Prototype Preview**
Title: Interactive Prototype Preview
Points:
1. Workflow Canvas: drag-connect + node config + real-time validation
2. Simulation: text chat simulation + node path highlighting
3. Dashboard: KPI cards + trend chart + heatmap + funnel
4. Telephony: three mode switching + cost comparison
Visual: 2×2 grid showing 4 core page screenshot placeholders

**Page 26 - Competitive Comparison**
Title: Competitor Feature Matrix
Points:
1. 5 competitors (Bland/Vapi/Synthflow/Retell/Voiceflow) vs VoiceFlow
2. Only platform with triple-mode telephony + dual-mode simulation
3. Only platform with node-level operational insights (heatmap + funnel)
4. Only platform with native WebRTC browser calling
Visual: Comparison table showing feature matrix, VoiceFlow advantage column highlighted

**Page 27 - Business Model**
Title: Hybrid Pricing Model
Points:
1. Base plan $29/mo (100min + 1 number) + overage pay-as-you-go + AI pay-as-you-go
2. Starter $49/mo (200min) / Pro $149/mo (1000min) / Enterprise custom
3. Revenue mix: subscription (60%) + call overage (25%) + AI usage (15%)
Visual: Tiered pricing chart showing 4 plan levels

**Page 28 - Key Takeaways**
Title: Key Takeaways
Points:
1. Less AI is more — 3 inflection points suffice, rules-first AI-enhanced is the right strategy
2. Text simulation is an underestimated killer feature, second-level iteration solves the "10-min usable" proposition
3. Node-level operational insights are more commercially valuable than AI — the key upgrade from tool to platform
4. WebRTC opens up the "no phone number needed" new market
5. Version management is a business safeguard, not an engineering feature — it eliminates iteration fear

**Page 29 - Next Steps**
Title: Next Steps
Points:
1. MVP development kickoff: Core+Logic layers + Canvas + Platform numbers + Text simulation
2. Seed user recruitment: 50 SMBs for closed beta
3. AI node V1.0 validation: Intent detection + Knowledge Q&A + Call summary
4. Telephony expansion: BYO numbers (SIP) + Live call simulation
