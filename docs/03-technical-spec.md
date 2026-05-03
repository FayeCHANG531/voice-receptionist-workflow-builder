# 语流(VoiceFlow Builder) — 产品技术对接规格

> 版本：v1.0 | 日期：2026-05-03
> 定位：PM 定义要什么，技术决定怎么实现。开发或 AI 编程工具拿到后可直接开始编码。

---

## 1. 数据实体定义

### 1.1 Receptionist（接待员）

| 字段名 | 类型 | 约束 | 默认值 | 关联关系 | 说明 |
|--------|------|------|--------|---------|------|
| id | UUID | PK, NOT NULL | auto-gen | - | 接待员唯一ID |
| tenant_id | UUID | FK→Tenant.id, NOT NULL | - | Tenant | 所属租户 |
| name | VARCHAR(100) | NOT NULL | - | - | 接待员名称 |
| description | TEXT | - | NULL | - | 接待员描述 |
| status | ENUM('draft','active','paused','archived') | NOT NULL | 'draft' | - | 运行状态 |
| active_flow_id | UUID | FK→Flow.id, NULL | NULL | Flow | 当前生效的流程版本ID |
| created_by | UUID | FK→User.id, NOT NULL | - | User | 创建人 |
| created_at | TIMESTAMP | NOT NULL | NOW() | - | 创建时间 |
| updated_at | TIMESTAMP | NOT NULL | NOW() | - | 最后更新时间 |

### 1.2 Flow（流程/工作流）

| 字段名 | 类型 | 约束 | 默认值 | 关联关系 | 说明 |
|--------|------|------|--------|---------|------|
| id | UUID | PK, NOT NULL | auto-gen | - | 流程唯一ID |
| receptionist_id | UUID | FK→Receptionist.id, NOT NULL | - | Receptionist | 所属接待员 |
| version | INTEGER | NOT NULL | 1 | - | 版本号，从1递增 |
| version_label | VARCHAR(100) | - | NULL | - | 版本描述 |
| status | ENUM('draft','published','archived') | NOT NULL | 'draft' | - | 版本状态 |
| canvas_data | JSONB | NOT NULL | '{}' | - | 画布数据（节点+连线+位置） |
| published_at | TIMESTAMP | - | NULL | - | 发布时间 |
| published_by | UUID | FK→User.id, NULL | NULL | User | 发布人 |
| created_at | TIMESTAMP | NOT NULL | NOW() | - | 创建时间 |

### 1.3 Node（节点）

| 字段名 | 类型 | 约束 | 默认值 | 关联关系 | 说明 |
|--------|------|------|--------|---------|------|
| id | UUID | PK, NOT NULL | auto-gen | - | 节点唯一ID |
| flow_id | UUID | FK→Flow.id, NOT NULL | - | Flow | 所属流程 |
| type | ENUM('trigger','action','logic','data','integration','ai') | NOT NULL | - | - | 节点类型 |
| subtype | VARCHAR(50) | NOT NULL | - | - | 节点子类型（如greeting/ask_question/conditional_branch等） |
| label | VARCHAR(100) | NOT NULL | - | - | 节点显示名称 |
| config | JSONB | NOT NULL | '{}' | - | 节点配置（结构由subtype决定） |
| position_x | FLOAT | NOT NULL | 0 | - | 画布X坐标 |
| position_y | FLOAT | NOT NULL | 0 | - | 画布Y坐标 |
| order_index | INTEGER | NOT NULL | 0 | - | 节点在流程中的序号 |

### 1.4 Connection（连线）

| 字段名 | 类型 | 约束 | 默认值 | 关联关系 | 说明 |
|--------|------|------|--------|---------|------|
| id | UUID | PK, NOT NULL | auto-gen | - | 连线唯一ID |
| flow_id | UUID | FK→Flow.id, NOT NULL | - | Flow | 所属流程 |
| source_node_id | UUID | FK→Node.id, NOT NULL | - | Node | 起始节点 |
| source_port | VARCHAR(20) | NOT NULL | 'default' | - | 起始端口（default/success/failure/branch_1等） |
| target_node_id | UUID | FK→Node.id, NOT NULL | - | Node | 目标节点 |
| target_port | VARCHAR(20) | NOT NULL | 'default' | - | 目标端口（default/input） |
| condition | JSONB | - | NULL | - | 连线条件（如条件分支的具体条件表达式） |

### 1.5 Version（版本快照）

| 字段名 | 类型 | 约束 | 默认值 | 关联关系 | 说明 |
|--------|------|------|--------|---------|------|
| id | UUID | PK, NOT NULL | auto-gen | - | 版本快照ID |
| flow_id | UUID | FK→Flow.id, NOT NULL | - | Flow | 关联流程 |
| snapshot_data | JSONB | NOT NULL | - | - | 完整流程快照（含所有节点和连线） |
| description | TEXT | - | NULL | - | 版本描述 |
| created_at | TIMESTAMP | NOT NULL | NOW() | - | 快照时间 |
| created_by | UUID | FK→User.id, NOT NULL | - | User | 创建人 |

### 1.6 PhoneNumber（号码）

| 字段名 | 类型 | 约束 | 默认值 | 关联关系 | 说明 |
|--------|------|------|--------|---------|------|
| id | UUID | PK, NOT NULL | auto-gen | - | 号码唯一ID |
| tenant_id | UUID | FK→Tenant.id, NOT NULL | - | Tenant | 所属租户 |
| number | VARCHAR(20) | UNIQUE, NOT NULL | - | - | 电话号码（E.164格式） |
| type | ENUM('platform_managed','sip_forward','ported','webrtc') | NOT NULL | - | - | 接入类型 |
| provider | VARCHAR(50) | - | NULL | - | 供应商（twilio/telnyx/custom） |
| provider_sid | VARCHAR(100) | - | NULL | - | 供应商侧ID |
| receptionist_id | UUID | FK→Receptionist.id, NULL | NULL | Receptionist | 绑定的接待员 |
| status | ENUM('active','released','porting','cooling') | NOT NULL | 'active' | - | 号码状态 |
| country_code | VARCHAR(3) | NOT NULL | 'CN' | - | 国家代码 |
| sip_uri | VARCHAR(200) | - | NULL | - | SIP URI（自带号码模式） |
| purchased_at | TIMESTAMP | - | NULL | - | 购买时间 |
| released_at | TIMESTAMP | - | NULL | - | 释放时间 |

### 1.7 CallSession（通话会话）

| 字段名 | 类型 | 约束 | 默认值 | 关联关系 | 说明 |
|--------|------|------|--------|---------|------|
| id | UUID | PK, NOT NULL | auto-gen | - | 会话唯一ID |
| tenant_id | UUID | FK→Tenant.id, NOT NULL | - | Tenant | 所属租户 |
| receptionist_id | UUID | FK→Receptionist.id, NOT NULL | - | Receptionist | 接待员 |
| flow_id | UUID | FK→Flow.id, NOT NULL | - | Flow | 执行的流程版本 |
| phone_number_id | UUID | FK→PhoneNumber.id, NULL | NULL | PhoneNumber | 接听号码 |
| call_direction | ENUM('inbound','outbound','webrtc') | NOT NULL | - | - | 呼叫方向 |
| caller_number | VARCHAR(20) | - | NULL | - | 来电号码 |
| status | ENUM('ringing','in_progress','completed','failed','no_answer','busy') | NOT NULL | 'ringing' | - | 通话状态 |
| duration_seconds | INTEGER | - | 0 | - | 通话时长（秒） |
| is_test | BOOLEAN | NOT NULL | FALSE | - | 是否测试通话 |
| recording_url | VARCHAR(500) | - | NULL | - | 录音URL |
| transcript | TEXT | - | NULL | - | 通话转写文本 |
| summary | JSONB | - | NULL | - | 通话摘要（AI生成） |
| started_at | TIMESTAMP | - | NULL | - | 通话开始时间 |
| ended_at | TIMESTAMP | - | NULL | - | 通话结束时间 |

### 1.8 CallNodeExecution（节点执行记录）

| 字段名 | 类型 | 约束 | 默认值 | 关联关系 | 说明 |
|--------|------|------|--------|---------|------|
| id | UUID | PK, NOT NULL | auto-gen | - | 执行记录ID |
| call_session_id | UUID | FK→CallSession.id, NOT NULL | - | CallSession | 所属通话 |
| node_id | UUID | FK→Node.id, NOT NULL | - | Node | 执行的节点 |
| status | ENUM('executing','success','failed','timeout','skipped') | NOT NULL | 'executing' | - | 执行状态 |
| input_data | JSONB | - | NULL | - | 节点输入数据 |
| output_data | JSONB | - | NULL | - | 节点输出数据 |
| error_message | TEXT | - | NULL | - | 错误信息 |
| duration_ms | INTEGER | - | 0 | - | 执行时长（毫秒） |
| started_at | TIMESTAMP | NOT NULL | NOW() | - | 开始执行时间 |
| completed_at | TIMESTAMP | - | NULL | - | 完成时间 |

### 1.9 Tenant（租户）

| 字段名 | 类型 | 约束 | 默认值 | 关联关系 | 说明 |
|--------|------|------|--------|---------|------|
| id | UUID | PK, NOT NULL | auto-gen | - | 租户ID |
| name | VARCHAR(100) | NOT NULL | - | - | 组织名称 |
| plan | ENUM('free','starter','pro','enterprise') | NOT NULL | 'free' | - | 套餐 |
| language | ENUM('zh','en') | NOT NULL | 'zh' | - | 界面语言 |
| timezone | VARCHAR(50) | NOT NULL | 'Asia/Shanghai' | - | 时区 |
| created_at | TIMESTAMP | NOT NULL | NOW() | - | 创建时间 |

### 1.10 User（用户）

| 字段名 | 类型 | 约束 | 默认值 | 关联关系 | 说明 |
|--------|------|------|--------|---------|------|
| id | UUID | PK, NOT NULL | auto-gen | - | 用户ID |
| tenant_id | UUID | FK→Tenant.id, NOT NULL | - | Tenant | 所属租户 |
| email | VARCHAR(200) | UNIQUE, NOT NULL | - | - | 邮箱 |
| name | VARCHAR(100) | NOT NULL | - | - | 姓名 |
| role | ENUM('owner','admin','editor','viewer') | NOT NULL | 'editor' | - | 角色 |
| created_at | TIMESTAMP | NOT NULL | NOW() | - | 创建时间 |

---

## 2. 流程引擎规格

### 2.1 节点执行生命周期

```
idle ──→ executing ──→ success
   │         │
   │         ├──→ failed
   │         │
   │         ├──→ timeout
   │         │
   │         └──→ skipped
   │
   └── 触发条件: 上游节点success + 连线到达此节点
```

| 状态转换 | 触发条件 | 说明 |
|---------|---------|------|
| idle → executing | 上游节点success且连线到达 | 节点开始执行 |
| executing → success | 节点处理逻辑完成且结果有效 | 正常完成 |
| executing → failed | 节点处理逻辑抛出异常 | 处理失败 |
| executing → timeout | 超过节点配置的超时时间 | 超时（各节点超时默认值不同） |
| executing → skipped | 前置条件不满足（如CRM查询节点无数据源） | 跳过执行 |

### 2.2 各节点类型输入/输出数据结构

#### 来电触发器

```json
// 输入（系统注入）
{
  "caller_number": "+8613812345678",
  "callee_number": "+861012345678",
  "call_time": "2026-05-03T09:15:00+08:00",
  "call_direction": "inbound",
  "call_session_id": "uuid-xxx"
}
// 输出
{
  "caller_number": "+8613812345678",
  "callee_number": "+861012345678",
  "call_time": "2026-05-03T09:15:00+08:00"
}
```

#### 问候/开场白

```json
// 输入
{ "flow_context": { "caller_number": "...", "call_time": "..." } }
// 输出
{ "greeting_played": true, "greeting_text": "您好，欢迎致电XX公司" }
```

#### 提问

```json
// 输入
{ "flow_context": {} }
// 输出
{
  "answer": "我想预约",
  "answer_type": "speech",       // speech | dtmf | timeout
  "confidence": 0.92,            // ASR置信度
  "raw_dtmf": null               // DTMF原始值
}
```

#### 条件分支

```json
// 输入
{ "variable_value": "预约", "conditions": [...] }
// 输出
{ "matched_branch": "branch_booking", "matched_condition_index": 2 }
```

#### AI意图检测

```json
// 输入
{ "user_input": "我想下周三来咨询一下", "intents": [...] }
// 输出
{
  "detected_intent": "booking",
  "confidence": 0.88,
  "intent_scores": [
    { "intent": "consultation", "score": 0.15 },
    { "intent": "booking", "score": 0.88 },
    { "intent": "complaint", "score": 0.02 }
  ],
  "fallback_triggered": false    // 置信度<阈值时为true
}
```

#### 知识库问答

```json
// 输入
{ "question": "你们的营业时间是什么", "knowledge_base_id": "kb-xxx" }
// 输出
{
  "answer": "我们的营业时间是周一至周五9:00-18:00",
  "confidence": 0.91,
  "sources": [{ "document": "FAQ.md", "chunk": "营业时间...", "score": 0.89 }],
  "needs_human": false
}
```

### 2.3 节点间数据传递映射规则

| 规则 | 说明 |
|------|------|
| 上游输出自动注入 | 上游节点的output_data自动合并到下游节点的flow_context |
| 变量引用语法 | 配置项中使用 `{{variable_name}}` 引用flow_context中的变量 |
| 变量作用域 | 全局变量（caller_number等）+ 节点局部变量（本节点output） |
| 冲突处理 | 后执行的节点输出覆盖同名字段 |
| AI节点变量 | AI节点输出自动提取key-value到flow_context（如intent=booking） |

---

## 3. API 契约

### 3.1 流程 CRUD

#### POST /api/v1/receptionists/{receptionist_id}/flows

创建新流程（草稿）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| version_label | string | 否 | 版本描述 |

响应 201:
```json
{
  "id": "uuid-flow-xxx",
  "receptionist_id": "uuid-rec-xxx",
  "version": 1,
  "status": "draft",
  "canvas_data": { "nodes": [], "connections": [] },
  "created_at": "2026-05-03T10:00:00Z"
}
```

#### GET /api/v1/receptionists/{receptionist_id}/flows/{flow_id}

获取流程详情

响应 200: 同创建响应结构

#### PUT /api/v1/receptionists/{receptionist_id}/flows/{flow_id}

更新流程（保存画布）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| canvas_data | object | 是 | 画布数据（节点+连线） |
| version_label | string | 否 | 版本描述 |

响应 200: 更新后的流程对象

#### DELETE /api/v1/receptionists/{receptionist_id}/flows/{flow_id}

删除流程（仅草稿可删除）

响应 204 无内容

错误码：
- 40003: 已发布流程不可删除
- 40401: 流程不存在

### 3.2 节点 CRUD

#### POST /api/v1/flows/{flow_id}/nodes

添加节点

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | string | 是 | 节点类型(trigger/action/logic/data/integration/ai) |
| subtype | string | 是 | 节点子类型(greeting/ask_question等) |
| label | string | 是 | 显示名称 |
| config | object | 否 | 节点配置 |
| position_x | number | 是 | X坐标 |
| position_y | number | 是 | Y坐标 |

响应 201: 节点对象

#### PUT /api/v1/flows/{flow_id}/nodes/{node_id}

更新节点配置

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| label | string | 否 | 显示名称 |
| config | object | 否 | 节点配置 |
| position_x | number | 否 | X坐标 |
| position_y | number | 否 | Y坐标 |

响应 200: 更新后的节点对象

#### DELETE /api/v1/flows/{flow_id}/nodes/{node_id}

删除节点（级联删除关联连线）

响应 204

错误码：
- 40004: 触发器节点不可删除（需先添加新触发器）
- 40402: 节点不存在

### 3.3 版本管理

#### POST /api/v1/flows/{flow_id}/versions

创建版本快照

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| description | string | 否 | 版本描述 |

响应 201: 版本快照对象

#### GET /api/v1/flows/{flow_id}/versions

获取版本列表

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| limit | integer | 否 | 每页数量(默认20) |
| offset | integer | 否 | 偏移量(默认0) |

响应 200:
```json
{
  "items": [{ "id": "...", "version": 1, "description": "...", "created_at": "..." }],
  "total": 5
}
```

#### GET /api/v1/flows/{flow_id}/versions/{version_id}/diff?compare_to={other_version_id}

版本Diff对比

响应 200:
```json
{
  "added_nodes": [{ "id": "...", "type": "action", "subtype": "send_sms" }],
  "deleted_nodes": [{ "id": "...", "type": "logic", "subtype": "if_else" }],
  "modified_nodes": [{
    "id": "...",
    "changes": [{
      "field": "config.question_text",
      "old_value": "请问您要咨询什么",
      "new_value": "请问有什么可以帮您"
    }]
  }],
  "added_connections": [],
  "deleted_connections": []
}
```

#### POST /api/v1/flows/{flow_id}/versions/{version_id}/rollback

回滚到指定版本

响应 200: 回滚后的流程对象

### 3.4 模拟测试

#### POST /api/v1/flows/{flow_id}/simulate/text

启动文字模拟

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| starting_node_id | string | 否 | 起始节点ID（默认为触发器） |

响应 201:
```json
{
  "simulation_id": "uuid-sim-xxx",
  "current_node": { "id": "...", "subtype": "greeting", "output": "您好，欢迎致电XX公司" },
  "waiting_for_input": true,
  "input_type": "speech_or_dtmf"
}
```

#### POST /api/v1/flows/{flow_id}/simulate/text/{simulation_id}/respond

文字模拟-用户回复

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| response | string | 是 | 用户输入文本或DTMF值 |

响应 200: 同启动响应结构（current_node更新为下一节点）

#### POST /api/v1/flows/{flow_id}/simulate/call

启动真实通话模拟（分配临时号码）

响应 201:
```json
{
  "test_phone_number": "+861012345000",
  "expires_at": "2026-05-03T10:30:00Z",
  "test_call_id": "uuid-test-call-xxx"
}
```

#### GET /api/v1/flows/{flow_id}/simulate/call/{test_call_id}/result

获取真实通话模拟结果

响应 200:
```json
{
  "status": "completed",
  "duration_seconds": 120,
  "recording_url": "https://storage.example.com/recordings/xxx.wav",
  "transcript": "您好...我想预约...",
  "node_executions": [
    { "node_id": "...", "subtype": "greeting", "status": "success", "duration_ms": 3200 },
    { "node_id": "...", "subtype": "ai_intent", "status": "success", "duration_ms": 780 }
  ],
  "latency_stats": { "asr_avg_ms": 280, "tts_avg_ms": 450, "llm_avg_ms": 650 }
}
```

### 3.5 发布/下线

#### POST /api/v1/flows/{flow_id}/publish

发布流程

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| version_label | string | 是 | 版本描述（最少10字） |

响应 200:
```json
{
  "flow_id": "...",
  "version": 3,
  "status": "published",
  "published_at": "2026-05-03T10:00:00Z"
}
```

错误码：
- 40001: 流程校验失败（返回具体校验错误列表）
- 40002: 流程非草稿状态，不可发布

#### POST /api/v1/receptionists/{receptionist_id}/pause

暂停接待员

响应 200: `{ "status": "paused" }`

#### POST /api/v1/receptionists/{receptionist_id}/resume

恢复接待员

响应 200: `{ "status": "active" }`

### 3.6 通话状态查询

#### GET /api/v1/receptionists/{receptionist_id}/calls/active

查询实时通话

响应 200:
```json
{
  "active_count": 3,
  "queue_count": 1,
  "calls": [
    {
      "id": "...",
      "caller_number": "+86138xxx",
      "current_node": "ai_intent_detection",
      "duration_seconds": 45,
      "status": "in_progress"
    }
  ]
}
```

#### GET /api/v1/receptionists/{receptionist_id}/calls/{call_id}

查询通话详情

响应 200: CallSession对象 + node_executions列表

### 3.7 运营数据查询

#### GET /api/v1/receptionists/{receptionist_id}/analytics/dashboard

运营看板数据

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| start_date | string | 是 | 开始日期(yyyy-MM-dd) |
| end_date | string | 是 | 结束日期(yyyy-MM-dd) |
| granularity | string | 否 | day/week/month(默认day) |

响应 200:
```json
{
  "total_calls": 1234,
  "answered_calls": 1100,
  "answer_rate": 0.891,
  "avg_duration_seconds": 145,
  "call_trend": [{ "date": "2026-05-01", "calls": 180 }, ...],
  "node_heatmap": [
    { "node_id": "...", "subtype": "greeting", "pass_rate": 0.98 },
    { "node_id": "...", "subtype": "ask_question", "pass_rate": 0.72 }
  ],
  "funnel": [
    { "stage": "来电触发", "count": 1234 },
    { "stage": "意图检测", "count": 1100 },
    { "stage": "信息收集", "count": 935 },
    { "stage": "转接/执行", "count": 780 },
    { "stage": "通话结束", "count": 760 }
  ],
  "exception_rate": 0.043,
  "satisfaction_score": 4.2
}
```

---

## 4. 通信接入技术规格

### 4.1 模式A：平台托管号码

| 维度 | 规格 |
|------|------|
| **对接协议** | Twilio Voice API（REST + WebSocket） |
| **事件回调机制** | Twilio Webhook回调到 `/api/v1/telephony/twilio/webhook` |
| **通话生命周期** | 来电 → Twilio触发webhook(status=ringing) → 平台创建CallSession → 返回TwiML指令(Flow执行) → 通话中节点切换通过`<Gather>`/`<Say>`/`<Dial>` → 挂断触发webhook(status=completed) |
| **号码管理** | 购买：POST /api/v1/phone-numbers/purchase (传入country_code+area_code) → 调用Twilio Available Numbers API → 分配；释放：POST /api/v1/phone-numbers/{id}/release → 调用Twilio释放API → 7天冷却期 |
| **录音** | 通过TwiML `<Record>` 指令启用；录音完成后Twilio回调录音URL → 平台存储到S3 |

### 4.2 模式B：用户自带号码

#### SIP Forwarding

| 维度 | 规格 |
|------|------|
| **对接协议** | SIP over TLS + RTP over SRTP |
| **SIP端点** | `sip:in@voiceflowbuilder.com:5061` |
| **认证** | SIP Digest认证（每租户独立用户名/密码） |
| **事件回调** | SIP INVITE → 平台SIP网关 → 创建CallSession → 后续同模式A |
| **通话生命周期** | 用户PBX设置呼叫前转到平台SIP端点 → 来电到达 → 同模式A流程 |

#### 号码移植

| 维度 | 规格 |
|------|------|
| **对接协议** | Twilio LNP API |
| **移植流程** | 用户提交移植申请 → 平台调用Twilio Porting API → 提交LOA(授权书) → 5-10工作日完成 → 号码在平台激活 |
| **状态跟踪** | GET /api/v1/phone-numbers/{id}/porting-status → 返回移植进度 |

### 4.3 模式C：WebRTC浏览器通话

| 维度 | 规格 |
|------|------|
| **信令协议** | WebSocket (Socket.IO) |
| **媒体协议** | WebRTC (SDP Offer/Answer + ICE) |
| **STUN/TURN** | 使用Twilio Network Traversal (STUN+TURN) |
| **嵌入组件** | JS SDK: `@voiceflowbuilder/webrtc-sdk`（~50KB gzip） |
| **通话生命周期** | 网页加载SDK → 用户点击通话 → SDK请求麦克风权限 → WebSocket信令交换SDP → ICE连接建立 → 音频流通过WebRTC传输 → 平台WebRTC网关转为SIP/RTP → 后续同模式A |
| **事件回调** | WebSocket事件：`call.started` / `call.ended` / `node.changed` / `call.error` |

---

## 5. 集成节点适配器接口

### 5.1 通用适配器接口定义

```typescript
interface IntegrationAdapter {
  // 适配器标识
  type: string;                    // 如 "crm_hubspot", "calendar_google"
  // 执行方法
  execute(input: AdapterInput): Promise<AdapterOutput>;
  // 健康检查
  healthCheck(): Promise<{ healthy: boolean; latency_ms: number }>;
}

interface AdapterInput {
  // 通用字段
  action: string;                  // 操作类型(如 "lookup", "create", "update")
  params: Record<string, any>;     // 操作参数
  // 连接配置（由节点配置提供）
  connection_config: {
    api_key?: string;
    base_url?: string;
    auth_type: "api_key" | "oauth2" | "basic";
    auth_data: Record<string, string>;
  };
  // 流程上下文
  flow_context: Record<string, any>;
}

interface AdapterOutput {
  success: boolean;
  data?: Record<string, any>;      // 成功时返回的数据
  error?: {
    code: string;                  // 如 "TIMEOUT", "AUTH_FAILED", "NOT_FOUND"
    message: string;
    retryable: boolean;            // 是否可重试
  };
  latency_ms: number;
}
```

### 5.2 CRM适配器

| 操作 | 入参Schema | 出参Schema |
|------|-----------|-----------|
| lookup | `{ "query_field": "phone", "query_value": "+86138xxx" }` | `{ "found": true, "record": { "name": "张三", "tier": "vip", "last_order": "..." } }` |
| create | `{ "fields": { "name": "张三", "phone": "+86138xxx" } }` | `{ "id": "crm-xxx", "created": true }` |

### 5.3 日历适配器

| 操作 | 入参Schema | 出参Schema |
|------|-----------|-----------|
| check_availability | `{ "date": "2026-05-10", "duration_minutes": 30 }` | `{ "available_slots": [{ "start": "10:00", "end": "10:30" }, ...] }` |
| create_booking | `{ "date": "2026-05-10", "start_time": "10:00", "duration_minutes": 30, "attendee": "user@example.com" }` | `{ "booking_id": "cal-xxx", "status": "confirmed" }` |

### 5.4 Webhook适配器

| 操作 | 入参Schema | 出参Schema |
|------|-----------|-----------|
| call | `{ "url": "https://api.example.com/webhook", "method": "POST", "headers": {}, "body": {} }` | `{ "status_code": 200, "response_body": {} }` |

### 5.5 超时/重试/错误处理策略

| 策略 | 默认值 | 可配置 | 说明 |
|------|--------|--------|------|
| 超时时间 | 5000ms (CRM/日历), 10000ms (Webhook) | 是（节点配置） | 超时后走失败分支 |
| 重试次数 | 1次 | 是（0-3次） | 仅对retryable=true的错误重试 |
| 重试间隔 | 1000ms | 否 | 固定间隔，不使用指数退避（避免通话中过长等待） |
| 错误分类 | TIMEOUT / AUTH_FAILED / NOT_FOUND / RATE_LIMIT / SERVER_ERROR / NETWORK_ERROR | - | NOT_FOUND不算错误（返回found=false）；RATE_LIMIT和SERVER_ERROR可重试 |
| 降级路径 | 超时/重试失败后走节点配置的失败分支 | 是 | 失败分支选项：继续(无数据)/转人工/播放错误提示+挂断 |

---

## 6. 权限与多租户模型

### 6.1 角色权限矩阵

| 资源/操作 | Owner | Admin | Editor | Viewer |
|----------|-------|-------|--------|--------|
| 创建/删除接待员 | ✅ | ✅ | ✅ | ❌ |
| 编辑流程画布 | ✅ | ✅ | ✅ | ❌ |
| 发布/下线流程 | ✅ | ✅ | ❌ | ❌ |
| 版本管理(回滚) | ✅ | ✅ | ❌ | ❌ |
| 模拟测试 | ✅ | ✅ | ✅ | ✅(只读) |
| 查看运营看板 | ✅ | ✅ | ✅ | ✅ |
| 号码管理(购买/释放) | ✅ | ✅ | ❌ | ❌ |
| 团队成员管理 | ✅ | ✅ | ❌ | ❌ |
| 套餐/计费 | ✅ | ❌ | ❌ | ❌ |
| 删除组织 | ✅ | ❌ | ❌ | ❌ |

### 6.2 资源隔离策略

| 隔离维度 | 策略 | 说明 |
|---------|------|------|
| 数据隔离 | 共享数据库+tenant_id行级隔离 | 所有查询强制加tenant_id过滤；通过应用层中间件注入 |
| 流程数据 | tenant_id隔离 | 每个租户的流程、节点、连线数据通过tenant_id→receptionist_id级联隔离 |
| 通话数据 | tenant_id隔离 | 通话记录、录音、摘要按tenant_id隔离 |
| 号码资源 | tenant_id隔离 | 每个号码只属于一个租户 |
| AI资源 | 知识库按tenant_id隔离 | 每个租户的知识库和向量索引独立；共享LLM推理服务 |
| API访问 | JWT Token + tenant_id | API请求携带JWT，中间件校验tenant_id匹配 |
| 并发限制 | 租户级限流 | 按套餐限制并发通话数（free:5, starter:50, pro:500, enterprise:5000） |
