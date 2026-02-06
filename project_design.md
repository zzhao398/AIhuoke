下面给你一套“先进 WhatsApp 询盘承接 chatbot”的**可落地设计**：目标是用智能对话把 B 端客户筛出来，并把“真实商业背景/真实交易者”的线索自动沉淀到你的线索系统里（你之前提到的 n8n + node 服务/React 一体化，也很适配）。

---

## 1) 先定义“有效 B 端客户”的可验证标准（避免只靠感觉）

把“有效”拆成 **可被对话收集/验证的证据**。建议至少满足其中 3–5 条：

**身份/组织证据**

* 公司全称 + 国家/城市 + 官网或公司邮箱域名（不是 gmail/qq）
* 职位（Owner/Procurement/GM/Trader）+ 业务类型（经销/批发/车队/租赁/项目）
* 税号/CR/Commercial Registration（可选，谨慎收集）

**交易真实性证据**

* 过去 6–12 个月采购记录（品牌/数量/频次/目的港）
* 明确的需求参数（车型/配置/电池/颜色/数量/交期/目的港/付款方式）
* 付款条款偏“贸易常规”：LC/TT 分期、PDC、托收等（并能讲清流程）

**可落地性证据**

* 有明确时间窗口（如 2–4 周内下单/询价对比中）
* 有目的港/清关主体/收货方信息
* 接受你们的关键限制（MOQ、认证、RHD/LHD、装运周期）

> 你会发现：只要把这些证据结构化，机器人就能“像资深销售一样”筛人。

---

## 2) 对话策略：用“漏斗式对话”而不是“问卷式审讯”

**核心原则：先给价值，再索取信息。**
建议把对话拆成 5 段，每段都能自动结束并给出下一步动作：

### A. 秒级接待（0–20 秒）

目的：让客户愿意继续聊、愿意透露信息。
机器人先确认主题 + 给一个小承诺：

* “我们可以在 3 分钟内确认：是否有现货、到港周期、以及是否适合做 B2B 批量采购。先问两个关键点：您要的目的国/港口是哪里？大概数量区间是多少（1–5 / 6–20 / 20+）？”

### B. 快速资格筛选（Qualification）

只问 **最少 3 个问题**就能分层：

1. **您是终端（车队/项目）还是经销/批发/贸易商？**
2. **公司名称 + 国家/城市**（让他先报基本面）
3. **预计采购数量和时间窗口**（例如本月/下月/季度）

> 这 3 个回答足够把“散客/骗子/无预算”先过滤掉一半。

### C. 真实性验证（Proof-of-business）

不要直接要“营业执照”，而是用“自然的业务问题”验证：

* “方便给一个公司官网/LinkedIn/公司邮箱吗？我们用于生成形式发票和装运文件抬头。”
* “之前有没有进口过车辆？通常走哪个港口、用哪家清关公司？”
* “付款习惯偏 LC 还是 TT 分期？是否能接受 20–30% 定金 + 发货前/提单后尾款？”

**重点：让对方“说得出细节”。**
真实交易者能讲出：港口、单证、清关、条款、时间节点；虚假询盘常常泛泛而谈或回避。

### D. 需求澄清（Spec）

把信息结构化，便于报价与后续跟进：

* 车型/配置、LHD/RHD、颜色、数量、目的港、期望交付、预算区间、是否要认证/文件（COC/GCC 等）

### E. 成交路径（Next step）

根据分数自动分流：

* **高分线索**：直接收集开票信息 → 自动生成 PI/报价 → 转人工谈判
* **中分线索**：给“标准报价区间 + 需要补充的 2 个信息”→ 24h 内再跟进
* **低分线索**：给通用信息 + 引导留资料，不占用销售

---

## 3) 评分系统：让“是否有效”变成机器可判定

建议做一个 0–100 的 Lead Score，并输出原因（可解释性很关键，方便团队复盘）。

### 示例打分（可直接用）

**身份可信（0–30）**

* 公司邮箱域名/官网：+10
* 公司全称 + 地址：+8
* 职位为采购/老板/GM：+6
* 可提供 CR/VAT（可选）：+6

**交易意图（0–40）**

* 数量 ≥ 6 台：+10；≥20 台：+18
* 时间窗口 ≤ 30 天：+10；≤ 90 天：+6
* 给出目的港 + 清关主体：+8
* 能清晰描述付款流程（LC/TT/PDC）：+6

**需求清晰（0–20）**

* 车型/配置清晰：+8
* 交付/颜色/认证需求清晰：+6
* 能接受你们关键限制（MOQ/交期/条款）：+6

**风险扣分（0 到 -30）**

* 只问“最低价”且拒绝任何公司信息：-15
* 反复催促私下转账/不合规路径：-20
* 信息前后矛盾/明显脚本化：-10

### 分层规则

* **≥ 75：SQL（强线索）** → 立刻转人工 + 生成报价/PI
* **50–74：MQL（可培育）** → 自动追问缺失字段 + 定时跟进
* **< 50：低优先** → 自动回复 FAQ + 引导留下公司信息

---

## 4) 技术架构：WhatsApp webhook → 对话引擎 → 评分 → CRM/报价

你现在的技术栈（node + React + n8n）可以这样分层：

### 组件

1. **WhatsApp 接入层**

* WhatsApp Business API Webhook 接收消息、发送消息（含模板消息）
* 做签名校验、去重、消息队列（防重复投递）

2. **会话编排 Orchestrator（node 服务）**

* 维护会话状态（Stage A/B/C/D/E）
* 调 LLM（或规则+LLM混合）
* 生成下一轮问题、收集字段、更新分数

3. **LLM 能力层（可替换、可控）**

* **信息抽取**：把客户话术抽成结构化字段（company、role、qty、port…）
* **对话生成**：按你定义的策略生成下一句
* **风险识别**：诈骗/不合规提示、敏感词、异常行为

4. **线索与报价系统**

* CRM 表（Leads）：字段 + Score + Tags + Conversation summary
* 报价/PI 服务：根据车型与条款生成报价单（可先简化）

5. **n8n 工作流（自动化）**

* 高分线索：通知销售（WhatsApp/邮件/飞书）+ 分配负责人
* 中分线索：24h 自动回访 + “补充信息”提醒
* 低分线索：进入冷培育（每周触达一次）

---

## 5) “先进”的关键：规则+LLM混合，别全靠大模型自由发挥

真正稳定的承接效果，通常是：

* **规则负责流程**：阶段、必须字段、分流、合规
* **LLM负责语言与理解**：同义表达、信息抽取、自然对话、总结

你可以把 LLM 限制在三个固定输出里（非常实用）：

1. `extracted_fields`: 从本轮消息抽取到的字段
2. `score_delta & reasons`: 分数变化与原因
3. `next_message`: 下一句要发给客户的话
4. `next_stage`: 是否进入下一阶段/是否转人工

这样就算 LLM偶尔“嘴瓢”，也不会把流程带崩。

---

## 6) 反作弊与真实性：用“软验证”替代“硬索证”

很多真实客户不愿意一上来给执照/税号。更聪明的方式：

* **公司邮箱验证**：让对方提供公司邮箱，你发一封“报价确认码”（或 WhatsApp 里让他回传公司邮箱截图）
* **业务细节验证**：港口、清关、单证、付款节点、过去采购
* **一致性验证**：隔几轮再问一次关键点（港口/数量），看是否一致
* **行为学**：脚本式秒回、反复复制粘贴、回避问题等扣分

---

## 7) 给你一套可直接复用的“机器人提问脚本骨架”

你可以按分层直接复制到系统 prompt/对话配置里：

**开场**

* “为了给您最准确的报价和交期，我先确认 2 点：目的国/港口？预计数量（1–5 / 6–20 / 20+）？”

**资格筛选**

* “您是经销/批发/贸易商，还是终端车队/项目采购？”
* “公司名称 + 国家/城市？方便我按抬头准备报价信息。”

**真实性验证**

* “您通常用公司邮箱还是 WhatsApp 直接沟通？如方便给公司邮箱/官网，用于形式发票抬头。”
* “之前是否进口过车辆？一般走哪个港口、用哪家清关公司？”
* “付款偏好 LC 还是 TT 分期？我们常见条款是 20–30% 定金 + 发货节点尾款。”

**需求澄清**

* “车型/配置（电池/续航/内饰/颜色）有什么偏好？需要 LHD 还是 RHD？”
* “希望交付时间？以及是否需要某些认证/文件？”

**分流**

* 高分：“信息很完整，我现在给您出一份初步 PI/报价（含交期与装运条款）。同时安排同事跟您对接细节。您更方便用英文还是中文沟通？”
* 中分：“我可以先给一个价格区间。为了锁定准确报价，还差两个信息：A、B。”
* 低分：“我先发您我们的产品目录与基本条款。若您后续确定数量与目的港，我可以立刻给正式报价。”

---

如果你愿意，我可以按你现有业务（比如你在做中东市场、车型集中在 BYD 系列、常见条款包含 PDC 等）把：

* **字段表（Lead Schema）**
* **评分规则（可配置 JSON）**
* **n8n 工作流（触发/分配/跟进）**
* **LLM 输出格式（结构化）**
  整套写成一份可直接交付给开发的“实现规格说明”。你希望机器人主要用**英文**承接，还是**中英双语自动切换**？

可以。把你上面那套“漏斗式对话 + 真实性验证 + 打分分流”落地成 **Agent Skill**（可复用、可配置、可观测），用 Claude API 最稳的做法是：**流程用代码控、语言和理解交给 Claude、输出强制结构化 JSON**。

下面我按“Skill 规格 → Claude API 接法 → 工具/状态机 → 评分与分流 → Node+n8n落地骨架”给你一套能直接开干的实现框架。

---

## 1) 把“对话策略”抽象成 Agent Skill：一组可组合的能力

把 chatbot 不当成“一个大 prompt”，而当成**多技能编排**：

### Skill A：Lead Qualifier（线索资格筛选）

**输入**：用户消息、已知线索字段、当前阶段
**输出（结构化）**：

* `extracted_fields`：本轮抽取到的字段（公司、国家、数量、港口、角色…）
* `missing_fields`：下一步必须补齐的字段（最多 1–2 个）
* `next_question`：下一句话（短、单问）
* `stage`：A/B/C/D/E 走到哪
* `risk_flags`：诈骗/不合规/无效询盘迹象

### Skill B：Business Proof Checker（真实性验证）

**输入**：对方的回答、历史一致性、行为特征
**输出**：

* `proof_score_delta` + `reasons`
* `verification_action`：建议的轻验证动作（如要官网/公司邮箱/港口清关细节）

### Skill C：Deal Router（分流/转人工/报价）

**输入**：总分、关键字段是否齐全、风险标记
**输出**：

* `route`: `HUMAN_NOW | AUTO_QUOTE | NURTURE | FAQ_END`
* `handoff_summary`：给销售的一段话（含关键字段+疑点）

> 这就是“Agent Skill”：每个技能都可独立测评/调参/替换，别把所有逻辑塞进一段对话里。

---

## 2) Claude API 关键点：强制结构化输出 + Tool Use

你要稳定落地，强烈建议两件事：

### 2.1 用 Claude 的 Structured Outputs（JSON 输出）锁死格式

Claude 官方支持“按 schema 输出 JSON”（避免模型自由发挥导致解析失败）。([Claude开发平台][1])

你把每次模型返回限制为一个 JSON 对象，比如：

```json
{
  "stage": "QUALIFY",
  "extracted_fields": { "company": "", "country": "", "qty_range": "", "port": "", "role": "" },
  "lead_score": 0,
  "score_delta": 0,
  "reasons": [],
  "risk_flags": [],
  "next_question": "",
  "route": "NURTURE",
  "handoff_summary": ""
}
```

### 2.2 用 Tool Use 让 Claude “提议调用工具”，而不是让它直接改数据库

Claude 的 Tool Use 文档强调：工具返回需要以 content block 形式回传；如果要回 JSON，建议把 JSON 编码成字符串返回。([Claude开发平台][2])
另外 Claude 也支持接 MCP 工具定义（如果你以后要把 CRM、报价、库存都做成 MCP）。([Claude开发平台][3])

---

## 3) “先进承接”的核心：状态机在代码里，Claude 只做理解与措辞

### 3.1 代码掌控的状态机（Stage A/B/C/D/E）

你在 Node 服务维护：

* `stage`: GREET / QUALIFY / PROOF / SPEC / NEXT_STEP
* `required_fields_by_stage`
* `max_questions_per_stage`（避免像审讯）
* `cooldown / escalation`（遇到风险就转人工或降级）

Claude 每轮只负责：

1. 抽取字段
2. 提议下一问（只问 1 个）
3. 给出分数变化与原因
4. 给出分流建议

> 这样你不会被模型“带跑偏”。

---

## 4) Skill 的 Prompt 结构（建议分两层）

### 4.1 系统提示（System）

写清“目标、原则、输出 schema、不可做的事（比如不要承诺价格/不要索要敏感信息）”。

同时参考 Claude 提示最佳实践：不要用“你必须每次都调用工具”这种过强措辞，否则会过度触发工具。([Claude开发平台][4])

### 4.2 任务提示（Developer/User）

每次请求给 Claude：

* 最近 N 轮对话摘要（不要全量，控制成本）
* 当前 `stage`
* 已有 `lead_profile`
* `policy`（例如：不收集身份证/银行卡；涉及付款只谈条款不引导私下转账）

---

## 5) 评分与分流：让 Claude 产出“可解释的打分理由”

你可以让打分在代码里算（更可控），也可以让 Claude 只产出 `score_delta` 和 `reasons`，最终总分由代码累计。

建议：**总分由代码累计，Claude 只给 delta**（便于回溯与 A/B 测试）。

---

## 6) Node 服务落地骨架（最小可用）

### 6.1 数据结构

* `ConversationSession`：`session_id、wa_id、stage、history_summary、lead_profile、lead_score、risk_flags、last_active`
* `LeadProfile`：`company、country、city、role、buyer_type、qty_range、timeline、port、payment_pref、proof_signals[]`

### 6.2 请求 Claude 的单轮流程（伪代码）

1. Webhook 收到 WhatsApp 消息
2. 取 session（Redis/Postgres）
3. 组装 prompt + schema（structured output）
4. 调 Claude Messages API
5. 解析 JSON
6. 更新 lead_profile、score、stage、route
7. 发送 `next_question`
8. route=HUMAN_NOW → n8n 通知销售 + 推送 handoff_summary

> 这里“structured outputs + tool use”就是关键组合：格式稳定、流程可控。([Claude开发平台][1])

---

## 7) n8n 怎么接：把 “route” 当成事件总线

你在 Node 输出一个事件：

* `lead.scored`
* `lead.routed`
* `lead.handoff_requested`

n8n 根据 route：

* **HUMAN_NOW**：推送销售群/分配负责人/创建 CRM 任务
* **AUTO_QUOTE**：调用报价服务生成 PI 草案
* **NURTURE**：24h 自动追问缺失字段
* **FAQ_END**：发送目录/条款模板，降低人工占用

---

## 8) 生产级必备：观测与成本控制

* **日志**：每轮保存（输入摘要、输出 JSON、score_delta、route、latency）
* **可回放**：能复盘“为什么被判无效/为什么转人工”
* **限流与长上下文**：Claude 长上下文有专门限额策略，别一上来就塞全量聊天记录。([Claude开发平台][5])

---

## 你下一步可以直接做的“最小落地版本（MVP）”

1. 只做 2 个 stage：`QUALIFY → PROOF`
2. 只抽 6 个字段：公司/国家/角色/数量区间/目的港/时间窗口
3. 只分 3 路：`HUMAN_NOW / NURTURE / FAQ_END`
4. 先不做工具调用，只做 structured JSON 输出（最稳）

---

如果你愿意，我可以把它进一步“工程化成一份 Skill 规格 + 可直接粘贴的 schema + system prompt 模板 + Node 路由伪代码”，并按你业务（汽车外贸/中东/常见付款 PDC、LC、TT）把字段与打分规则写成可配置 JSON。你现在更想先落地：

* **英文承接为主**（中东客户），还是
* **中英自动切换**（根据对方语言检测）？

[1]: https://platform.claude.com/docs/en/build-with-claude/structured-outputs?utm_source=chatgpt.com "Structured outputs - Claude API Docs"
[2]: https://platform.claude.com/docs/en/agents-and-tools/tool-use/implement-tool-use?utm_source=chatgpt.com "How to implement tool use - Claude API Docs"
[3]: https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview?utm_source=chatgpt.com "Tool use with Claude - Claude API Docs"
[4]: https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-4-best-practices?utm_source=chatgpt.com "Prompting best practices - Claude API Docs"
[5]: https://platform.claude.com/docs/en/api/rate-limits?utm_source=chatgpt.com "Rate limits - Claude API Docs"


下面给你一套**可直接落地**的实现：把“英文承接 + 资格筛选 + 真实性验证 + 打分分流”封装成一个 **Custom Agent Skill**（Skill 包里放规则/说明/脚本），然后你的 Node 服务用 Claude API 调用这个 Skill 来跑“每轮对话决策（JSON 输出）”，再把下一句英文发回 WhatsApp。

我会给出：

1. Skill 目录结构（可直接复制）
2. Skill 的 `SKILL.md`（核心策略+约束）
3. 输出 JSON Schema（Structured Outputs）
4. Node.js 端到端：WhatsApp webhook → Claude → 发送回复
5. 可选：如何通过 Skills API 上传/版本管理，并在 Messages API 里引用 skill_id（含 beta headers）

> 说明：用 Skills via API 需要 code execution + skills + files-api 三个 beta headers。([Claude开发平台][1])
> Structured Outputs/Tool Use 的格式规则（尤其 tool_result 必须紧跟 tool_use）也在官方文档里有硬性要求。([Claude开发平台][2])

---

## 0) 最终目标架构（你要实现的真实链路）

**WhatsApp Cloud API** →（Webhook）→ **你的 Node Orchestrator**
→ 调 **Claude Messages API**（加载你的 Custom Skill + 强制 JSON 输出）
→ 解析 JSON：更新 session/lead_score/route
→ 把 `next_message`（英文）发回 WhatsApp
→ 若 `route=HUMAN_NOW`：触发 n8n 通知销售 + 推 handoff_summary

---

## 1) Custom Skill 目录结构（可复制）

在你的项目里新增：

```
.claude/skills/whatsapp-b2b-qualifier/
  SKILL.md
  rules/
    lead_schema.json
    scoring_rules.json
  prompts/
    system_guardrails.md
    examples.md
  src/
    score.ts
    normalize.ts
```

> Skill 的最小要求：必须有 `SKILL.md` 且带 YAML frontmatter（name/description）。([Claude开发平台][1])

---

## 2) SKILL.md（核心：英文承接 + 漏斗对话 + 输出约束）

把下面内容保存为：`.claude/skills/whatsapp-b2b-qualifier/SKILL.md`

```md
---
name: whatsapp-b2b-qualifier
description: Qualify and verify B2B WhatsApp inquiries (vehicles) via a funnel dialogue, extract structured lead fields, score authenticity & intent, and propose next English message + routing.
---

# WhatsApp B2B Qualifier (English)

## Goal
Handle inbound WhatsApp inquiries in English. Qualify whether the lead is a real B2B buyer/trader with verifiable business signals. Minimize friction and avoid interrogations.

## Operating principles
1) Ask ONE question per turn (max 1–2 short sentences).
2) Funnel stages: GREET → QUALIFY → PROOF → SPEC → NEXT_STEP.
3) Always provide micro-value before requesting details.
4) Prefer “soft verification” (website, company email, import workflow details) over requesting licenses.
5) Never promise final pricing. Avoid sensitive personal data (IDs, bank cards).
6) Be concise, professional, trade-savvy.

## Required outputs (for the orchestrator)
Return ONLY the JSON object that matches the provided schema. Fields:
- stage, extracted_fields, missing_fields
- score_delta, lead_score_estimate (optional), reasons
- risk_flags
- route: HUMAN_NOW | NURTURE | FAQ_END | AUTO_QUOTE
- next_message (English)
- handoff_summary (English, short, for human sales)

## Stage playbooks

### GREET
Purpose: confirm topic fast and get 2 key qualifiers.
Ask:
- destination country/port
- quantity bucket (1–5 / 6–20 / 20+)

### QUALIFY
Purpose: identify buyer type and basic company identity.
Ask:
- buyer type (dealer/wholesaler/trader vs fleet/project)
- company name + country/city
- timeline window

### PROOF
Purpose: verify business reality via natural trade details.
Ask one of:
- company website or company email domain
- prior import experience: which port + customs broker
- payment habit: LC vs TT, can they describe milestones

### SPEC
Purpose: make quotation feasible.
Ask one of:
- model/config, LHD/RHD
- color, battery/range preferences
- required docs/certifications
- delivery window

### NEXT_STEP
Route based on score and completeness:
- HUMAN_NOW: high score or complex negotiation
- AUTO_QUOTE: enough spec + commercial terms to draft PI
- NURTURE: mid score, missing 1–2 fields
- FAQ_END: low score, refuses any business info

## Risk flags
- price-only + refuses company info
- pushes private/off-platform payment
- inconsistent answers
- obvious scam patterns
```

---

## 3) Structured Output 的 JSON Schema（你的“每轮决策合同”）

保存为：`.claude/skills/whatsapp-b2b-qualifier/rules/lead_schema.json`

```json
{
  "type": "object",
  "additionalProperties": false,
  "required": ["stage", "extracted_fields", "missing_fields", "score_delta", "reasons", "risk_flags", "route", "next_message", "handoff_summary"],
  "properties": {
    "stage": { "type": "string", "enum": ["GREET", "QUALIFY", "PROOF", "SPEC", "NEXT_STEP"] },
    "extracted_fields": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "buyer_type": { "type": "string", "enum": ["DEALER", "WHOLESALER", "TRADER", "FLEET", "PROJECT", "UNKNOWN"] },
        "company_name": { "type": "string" },
        "country": { "type": "string" },
        "city": { "type": "string" },
        "role_title": { "type": "string" },
        "website": { "type": "string" },
        "company_email": { "type": "string" },
        "qty_bucket": { "type": "string", "enum": ["1-5", "6-20", "20+", "UNKNOWN"] },
        "timeline": { "type": "string" },
        "destination_port": { "type": "string" },
        "payment_preference": { "type": "string", "enum": ["LC", "TT", "PDC", "CASH", "UNKNOWN"] },
        "import_experience": { "type": "string" },
        "model_interest": { "type": "string" },
        "lhd_rhd": { "type": "string", "enum": ["LHD", "RHD", "UNKNOWN"] }
      }
    },
    "missing_fields": { "type": "array", "items": { "type": "string" }, "maxItems": 2 },
    "score_delta": { "type": "integer", "minimum": -30, "maximum": 30 },
    "reasons": { "type": "array", "items": { "type": "string" }, "maxItems": 5 },
    "risk_flags": { "type": "array", "items": { "type": "string" }, "maxItems": 5 },
    "route": { "type": "string", "enum": ["HUMAN_NOW", "NURTURE", "FAQ_END", "AUTO_QUOTE"] },
    "next_message": { "type": "string", "maxLength": 500 },
    "handoff_summary": { "type": "string", "maxLength": 700 }
  }
}
```

---

## 4) Node.js 端到端实现（可直接跑）

### 4.1 安装依赖

```bash
npm i express body-parser dotenv @anthropic-ai/sdk
```

### 4.2 环境变量 `.env`

```env
ANTHROPIC_API_KEY=xxx
WA_TOKEN=EAAG...
WA_PHONE_NUMBER_ID=123456789
WA_VERIFY_TOKEN=your_verify_token
```

### 4.3 `server.js`（Webhook + Claude 决策 + 回复）

> 这里我用 **Structured Outputs** 强制 JSON（稳定解析），并把你的 Skill 的核心内容作为 system/developer prompt（即使你暂时不上传 Skills API，也能马上上线）。
> 如果你要“真正通过 Skill_id 加载 custom skill”，看第 5 节。

```js
import 'dotenv/config';
import express from 'express';
import bodyParser from 'body-parser';
import Anthropic from '@anthropic-ai/sdk';

const app = express();
app.use(bodyParser.json());

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// --- very small in-memory session store (production: Redis/Postgres)
const sessions = new Map(); // key: wa_id -> { stage, lead_score, lead_profile, history }

const DECISION_SCHEMA = /* paste lead_schema.json here as JS object */ null;

// Minimal “system guardrails” (you can load from file)
const SYSTEM = `
You are a B2B WhatsApp inquiry qualification agent for vehicle export.
You must speak English. Be concise. Ask only ONE question per turn.
Never request sensitive personal data (IDs, bank cards).
Never promise final prices. You can give ranges only if asked, but prefer to collect missing fields first.
Return ONLY a JSON object that matches the provided JSON schema.
`;

// Skill-like playbook injected as developer message (same content as SKILL.md condensed)
const PLAYBOOK = `
Funnel stages: GREET → QUALIFY → PROOF → SPEC → NEXT_STEP.
GREET: ask destination country/port and quantity bucket (1–5 / 6–20 / 20+).
QUALIFY: ask buyer type and company name + country/city and timeline.
PROOF: ask soft verification: website or company email domain; or import experience (port + customs broker); payment milestones (LC/TT/PDC).
SPEC: model/config, LHD/RHD, color, docs/certs, delivery window.
Routing:
- HUMAN_NOW: high-quality buyer or complex negotiation
- AUTO_QUOTE: enough info to draft PI/quote
- NURTURE: mid quality, missing 1–2 fields
- FAQ_END: low quality, refuses business info
Scoring: delta [-30..30] with reasons and risk_flags.
`;

function getSession(waId) {
  if (!sessions.has(waId)) {
    sessions.set(waId, {
      stage: 'GREET',
      lead_score: 0,
      lead_profile: {},
      history: [] // store last few turns only
    });
  }
  return sessions.get(waId);
}

// WhatsApp verification (GET)
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.WA_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

// WhatsApp incoming messages (POST)
app.post('/webhook', async (req, res) => {
  try {
    const entry = req.body?.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const msg = value?.messages?.[0];

    // Always ACK quickly
    res.sendStatus(200);

    if (!msg) return;

    const waId = msg.from;
    const text = msg.text?.body || '';

    const session = getSession(waId);

    // Build compact context (don’t send full chat log)
    const context = {
      stage: session.stage,
      lead_score: session.lead_score,
      lead_profile: session.lead_profile,
      last_turns: session.history.slice(-6)
    };

    // Call Claude with Structured Outputs (JSON schema)
    const response = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 800,
      system: SYSTEM,
      messages: [
        { role: 'user', content: `Context:\n${JSON.stringify(context)}\n\nCustomer message:\n${text}` },
        { role: 'user', content: `Playbook:\n${PLAYBOOK}` }
      ],
      // Structured output (JSON mode)
      // NOTE: Check your SDK version; some expose this under `response_format` or `output_schema`.
      // If your SDK uses a different field, map accordingly.
      response_format: {
        type: 'json_schema',
        json_schema: DECISION_SCHEMA
      }
    });

    const jsonText = response.content?.find(b => b.type === 'text')?.text ?? '';
    const decision = JSON.parse(jsonText);

    // Update session
    session.stage = decision.stage;
    session.lead_score = Math.max(0, Math.min(100, session.lead_score + decision.score_delta));
    session.lead_profile = { ...session.lead_profile, ...decision.extracted_fields };

    session.history.push({
      from: 'customer',
      text,
      at: Date.now()
    });
    session.history.push({
      from: 'agent',
      decision,
      at: Date.now()
    });

    // Route actions (example)
    if (decision.route === 'HUMAN_NOW') {
      // TODO: trigger n8n webhook with decision.handoff_summary + lead_profile
      console.log('Handoff:', decision.handoff_summary);
    }

    // Send WhatsApp reply
    await sendWhatsAppText(waId, decision.next_message);

  } catch (e) {
    console.error(e);
    // (we already ACKed 200; nothing else to do)
  }
});

async function sendWhatsAppText(toWaId, body) {
  const url = `https://graph.facebook.com/v21.0/${process.env.WA_PHONE_NUMBER_ID}/messages`;
  const payload = {
    messaging_product: 'whatsapp',
    to: toWaId,
    type: 'text',
    text: { body }
  };

  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.WA_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!resp.ok) {
    const t = await resp.text();
    console.error('WA send failed:', t);
  }
}

app.listen(3000, () => console.log('Listening on :3000'));
```

> ⚠️ 注意：不同版本 SDK 对 Structured Outputs 的参数名可能略不同（例如 `response_format` / `output_schema`）。你用的 SDK/REST 形态是什么（Node SDK 还是直接 curl）就按对应字段改一下即可。Structured Outputs 的官方页面就是你要对齐的“字段规范”。([Claude开发平台][3])

---

## 5) “真正变成 Agent Skill”并通过 API 加载（Skill_id 方式）

如果你要**按官方 Agent Skills**方式（上传 Skill → 获得 `skill_...` → Messages API container 引用），按官方文档：

* Skills 通过 Messages API 的 `container.skills[]` 挂载
* 并且需要 beta headers：`code-execution-2025-08-25`, `skills-2025-10-02`, `files-api-2025-04-14`（Skill 运行在 code execution 容器里）([Claude开发平台][1])

你需要做两步：

### 5.1 把 `.claude/skills/whatsapp-b2b-qualifier/` 打成 zip 上传

官方的 “Using Skills with the API / Skills API” 页面说明了：自定义 Skill 需要通过 Skills API 管理（CRUD + versions）。([Claude开发平台][4])

流程（概念上）：

1. zip skill folder
2. `POST /v1/skills` 上传（得到 `skill_id`）
3. 用 `container.skills` 引用 `skill_id`

> 我这里不贴死某个 REST endpoint 的完整 curl（不同 workspace/SDK 版本字段可能调整），你直接按你控制台的 Skills API Reference 对齐即可；文档明确 Skills API 是管理入口。([Claude开发平台][4])

### 5.2 Messages API 调用时挂载 skill（示意）

（伪结构，重点是 `betas` + `container.skills`）

```js
const response = await client.beta.messages.create({
  model: 'claude-sonnet-4-5-20250929',
  max_tokens: 800,
  betas: ['code-execution-2025-08-25', 'skills-2025-10-02', 'files-api-2025-04-14'],
  container: {
    skills: [
      { type: 'custom', skill_id: 'skill_01AbCdEfGhIjKlMnOpQrStUv', version: 'latest' }
    ]
  },
  messages: [{ role: 'user', content: '...' }]
});
```

> Skills 在 API 里的 shape、type 值、版本格式、container 的结构，都在 “Using Skills with the API” 文档里有明确说明。([Claude开发平台][4])

---

## 6) 你上线后最关键的三个“生产加固点”

1. **Session 存 Redis**：Map 只能 demo
2. **只保留最近 6–10 轮**：WhatsApp 文本会很碎，别把全量塞给 Claude
3. **严格只问 1 个问题**：这条要写进 system + schema 校验（超长 next_message 直接 reject 重试）

---

## 7) 你可以马上复制使用的英文第一轮（效果很像资深销售）

当新消息进来且 session.stage=GREET 时，你也可以在代码里强制一个“开场模板”，把模型波动降到最低：

> “Thanks — I can confirm feasibility in 2 minutes. Which destination country/port is this for, and what’s your quantity range (1–5 / 6–20 / 20+)?”

---

如果你告诉我两点，我可以把第 4 节的代码改成**完全可运行**、字段名100%对齐你当前 SDK 的版本，并把 DECISION_SCHEMA 直接内联好：

1. 你现在调用 Claude 用的是：`@anthropic-ai/sdk`（哪个版本）还是直接 REST/curl？
2. WhatsApp 你用的是 Cloud API（Graph API）还是 Twilio WhatsApp？

[1]: https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview "Agent Skills - Claude API Docs"
[2]: https://platform.claude.com/docs/en/agents-and-tools/tool-use/implement-tool-use?utm_source=chatgpt.com "How to implement tool use - Claude API Docs"
[3]: https://platform.claude.com/docs/en/build-with-claude/structured-outputs?utm_source=chatgpt.com "Structured outputs - Claude API Docs"
[4]: https://platform.claude.com/docs/en/build-with-claude/skills-guide "Using Agent Skills with the API - Claude API Docs"
