# Voice Receptionist SaaS Workflow Builder — Product Requirements Document (PRD)

> **Delivery Date**: May 2026

| Attribute | Content |
|-----------|---------|
| **Version** | v1.0 |
| **Prerequisites** | Product Strategy Document (`product-strategy.md`) |
| **Scope** | MVP (0→1) to V1.0 (1→10) |

---

## Table of Contents

1. [Product Overview](#i-product-overview)
2. [Feature Requirement List](#ii-feature-requirement-list)
3. [Business Rule Library](#iii-business-rule-library)
4. [Non-Functional Requirements](#iv-non-functional-requirements)
5. [Open Questions List](#v-open-questions-list)

---

## I. Product Overview

### 1.1 Product Positioning

A **Voice Receptionist SaaS Workflow Builder** for SMBs and team managers. Its core value is "build a usable voice receptionist in 10 minutes". The product adopts a "Rules First, AI Enhanced" dual-mode engine strategy — the process skeleton is driven by a rule engine, with AI capabilities precisely introduced at 3 demonstrated AI qualitative change points (AI Intent Recognition, RAG Knowledge Base Q&A, Neural TTS Voice Synthesis). The product positioning is a "Receptionist Full-Lifecycle Management Platform", covering an end-to-end closed loop of Template Creation → Canvas Building → Dual-Mode Testing → Version Management → One-Click Publish → Real-Time Monitoring → Data-Driven Iteration.

### 1.2 Target User Personas

| Persona | Characteristics | Core Needs | Typical Scenario | Technical Ability | Willingness to Pay |
|---------|-----------------|------------|------------------|-------------------|--------------------|
| **Li Ming** — Individual Merchant / Micro-Business Owner | 1-10 person team, no IT staff, 50-300 calls/month; front desk monthly salary $3,500 | Build a usable phone receptionist within 15 minutes, replace front desk to handle appointments / inquiry triage | Customer calls → Greeting → Business hours check → Select service → Transfer to corresponding store | Very low, cannot code, needs visual configuration | Monthly fee $49-99 (saves $42,000+/year, ROI = 420×) |
| **Zhang Wei** — SMB Operations Lead | 10-50 person team, 1 part-time tech, 500-2,000 calls/month | AI understands customer intent, self-service answers to common questions, CRM/Calendar integration, reduce human transfer rate | Customer calls → AI intent detection → Order inquiry / return self-service → Complaint transfer to supervisor | Medium, understands configuration logic, cannot write API integration code | Monthly fee $149-299 (human transfer rate 60%→30%, efficiency up 50%) |
| **Wang Qiang** — Mid-to-Large Team IT Admin | 50+ person team, dedicated tech team, 5,000+ calls/month | Multi-receptionist collaboration, website-embedded voice entry, advanced data analytics, open API for own systems | Website visitor clicks "Voice Consultation" → WebRTC connects → AI product intro → Calendar booking | High, can write code, needs platform to reduce 80% baseline development workload | Monthly fee $500+ (lead conversion rate up 25%) |

### 1.3 Core Value Proposition

> **JTBD**: When I have a customer calling, I need a smart receptionist to answer, triage, and solve problems for me, rather than hiring a full-time front desk.
>
> **Build a usable voice receptionist in 10 minutes, flexibly scaling as the business grows.**

| Value Dimension | Quantified Description |
|-----------------|------------------------|
| Build Speed | From template creation to first publish < 15 minutes |
| Intent Recognition Accuracy | 91% (vs pure keyword matching 72%) |
| Self-Service Resolution Rate | 90% (vs no knowledge base 70%) |
| Call Completion Rate Lift | +18% (Neural TTS vs Traditional TTS) |
| Labor Cost Savings | Replace 1-1.5 full-time CSRs / front desk |

### 1.4 Success Metrics (North Star Metric + Key Results)

| Metric Type | Metric Name | MVP Target | V1.0 Target | Measurement Method | Timeline |
|-------------|-------------|------------|-------------|-------------------|----------|
| **North Star Metric** | Monthly Active Receptionists (MAReceptionist) | ≥ 100 | ≥ 1,000 | DB statistics `published=true AND last_call_date >= 30d` | MVP +30d / V1.0 +90d |
| Key Result 1 | Average Configuration Time | < 15 min | < 10 min | Frontend tracking `time_to_first_publish` median | MVP +30d |
| Key Result 2 | Template Usage Rate | > 60% | > 50% | Proportion of new receptionists where `template_id IS NOT NULL` | MVP +30d |
| Key Result 3 | Self-Service Resolution Rate | > 40% | > 60% | `Non-transferred normally-ended calls / Total calls` | V1.0 +90d |
| Key Result 4 | First-Month MRR | ≥ $1,500 | ≥ $15,000 | Billing system aggregation | MVP +30d / V1.0 +90d |
| Key Result 5 | Monthly Call Minutes | > 50,000 min | > 500,000 min | Call records `SUM(duration_seconds)/60` | V1.0 +90d |
| Key Result 6 | NPS (Net Promoter Score) | ≥ 30 | ≥ 45 | Quarterly email survey | V1.0 +90d |

---

## II. Feature Requirement List

### 2.1 Process Orchestration Module

| ID · Feature | Priority | User Story | Acceptance Criteria | Associated Nodes |
|--------------|----------|------------|---------------------|------------------|
| FR-FL-001 · Canvas Editor — Node Drag & Drop | P0 | As a clinic owner (no technical background), I want to drag nodes from the left node library to the canvas, so that I can build the reception flow like stacking blocks. | **AC1** Drag Node: Given user holds `greeting` node from left node library, When dragging into blank canvas area and releasing, Then a node card is generated at the corresponding position, default name "Greeting/Opening", position within mouse release coordinates ± 10px, input port displayed on left side of node, output port on right side.<br>**AC2** Node Connection: Given nodes A (with output port) and B (with input port) already exist on canvas, When user drags connection from A's output port to B's input port and releases within 20px, Then auto-snap creates a Bézier curve connection, solid line display, condition label at midpoint (e.g., "Next Step").<br>**AC3** Delete Connection: Given user clicks an existing connection, When pressing keyboard Delete key, Then connection disappears, both end nodes remain, validation panel updates synchronously. | All 20 nodes |
| FR-FL-002 · Canvas Editor — Node Config Panel | P0 | As an operations lead, I want to double-click a node to expand a configuration form in the right panel, so that I can modify the node's script, voice, transfer number, and other business parameters. | **AC1** Panel Expand: Given user double-clicks `greeting` node on canvas, When node is selected, Then right-side 360px config panel slides in, displaying four config items: `greeting_text` (textarea), `voice` (select), `speed` (slider), `enable_bargein` (select); `greeting_text` default value is "Hello, welcome to our service. How may I help you?".<br>**AC2** Auto-Save: Given user modifies `greeting_text` to "Hello, this is Kangmei Dental" in config panel, When clicking blank canvas area, Then config panel collapses, node internal text updates synchronously, canvas bottom preview area displays new text synchronously.<br>**AC3** Format Validation: Given user is editing `transfer_call` node's `target` field and enters "abc", When input loses focus, Then input box turns red, tooltip below shows "Please enter correct format: +86xxxxxxxxxxx", yellow vertical warning bar appears on left side of node. | All 20 nodes |
| FR-FL-003 · Canvas Validation — Real-Time Error Detection | P0 | As a clinic owner, I want the canvas to detect errors in real time while I connect nodes (e.g., loops, open circuits), so that I don't build a broken flow. | **AC1** Loop Detection: Given a closed loop A→B→C→A exists on canvas, When user clicks top "Validate" button, Then all nodes in loop turn red border + red dashed animation, connections turn red; validation panel shows "Loop detected: A→B→C→A", publish button grayed out and unclickable.<br>**AC2** Open-Circuit Detection: Given `conditional_branch` node has 3 conditional branches but only 2 outgoing connections, When user clicks "Validate" button, Then unconnected branch turns yellow, validation panel shows "Port 'Branch 3' of node 'Conditional Branch' is unconnected", publish button grayed out and unclickable.<br>**AC3** Validation Pass: Given all paths on canvas can reach `end_call` node with no loops / open circuits / missing required fields, When user clicks "Validate" button, Then green banner appears at top of canvas "All checks passed, total N items", publish button becomes clickable. | `conditional_branch`, `if_else`, `business_hours`, `call_type_detection`, `end_call` |
| FR-FL-004 · Industry Template One-Click Generation | P0 | As a clinic owner Li Ming, I want to select an industry template to auto-generate a complete flow, so that I don't need to build from scratch, only modifying business-related content. | **AC1** Template Load: Given user clicks "Dental Clinic" template card on "Select Template" page, When clicking "Use This Template", Then canvas loads a complete pre-filled flow: `incoming_call_trigger` → `greeting` → `business_hours` → `ask_question` → `conditional_branch` → `collect_info` → `transfer_call` → `end_call`, all node config items pre-filled with defaults.<br>**AC2** Pre-fill Consistency: Given user creates receptionist from template, When entering canvas editor, Then left node library expands "Core Layer" category, node names, pre-filled scripts, and business hours fully match Section 4.7 "Example A" of the 1A document. | `incoming_call_trigger` → `end_call` core chain |
| FR-FL-005 · Node Search & Quick Add | P1 | As an operations lead familiar with the product, I want to quickly search and add nodes via keyboard shortcut, so that I don't need to rummage through the sidebar. | **AC1** Search Overlay: Given user double-clicks blank canvas area, When search overlay pops up, Then entering "transfer" displays "Transfer Call" node within 200ms, click adds node to double-click position.<br>**AC2** Quick Menu: Given user drags connection from node output port and releases on blank area, When "What to add next?" quick menu pops up, Then displays top 5 most-used nodes (Greeting / Ask Question / Conditional Branch / Transfer / End), click directly creates and auto-connects. | All 20 nodes |
| FR-FL-006 · Canvas Alignment & Multi-Select | P1 | As an operations lead, I want to multi-select nodes and batch-align them, so that my flow chart looks professional and tidy. | **AC1** Horizontal Align: Given user Shift-clicks 3 nodes, When clicking top toolbar "Horizontal Align" button, Then 3 nodes' Y coordinates unify to median Y of selected nodes, X coordinates remain unchanged.<br>**AC2** Box Select Move: Given user holds left mouse button and drags to form a selection box covering 4 nodes, When releasing, Then 4 nodes are selected, displaying blue selection border, can be batch dragged and moved. | All 20 nodes |

### 2.2 AI Capability Module

| ID · Feature | Priority | User Story | Acceptance Criteria | Associated Nodes |
|--------------|----------|------------|---------------------|------------------|
| FR-AI-001 · AI Intent Detection Node Configuration | P1 | As an e-commerce CS supervisor Zhang Wei, I want to configure AI to understand customer natural-language intent (not limited to keywords), so that when a customer says "I want to return this" and "I don't want this thing anymore", both are correctly recognized as return intent. | **AC1** Intent Match: Given user configures `ai_intent_detection` node intents as "return:returns&exchanges:I want to return/refund/exchange/wrong size", `confidence_threshold`=0.7, When simulation test input is "This thing is the wrong size, I want to return it", Then system outputs `detected_intent`="return", `confidence` ≥ 0.7, node highlights "return" branch, `fallback_used`=false.<br>**AC2** Fuzzy Fallback: Given above configuration is complete, When simulation test input is fuzzy statement "That thing isn't very good to use", Then system outputs `detected_intent`="other" (i.e., `default_intent`), `confidence` < 0.7, flow takes default branch, `fallback_used`=false.<br>**AC3** Service Degradation: Given AI model service is unavailable (simulated network disconnect or returns 5xx), When executing AI intent detection, Then system automatically degrades to keyword matching, `fallback_used`=true, `detected_intent` output by keyword rule, flow does not interrupt. | `ai_intent_detection` |
| FR-AI-002 · Knowledge Base Q&A Node Configuration | P1 | As a law firm admin lead, I want AI to automatically answer customer inquiries after uploading FAQ documents, so that 80% of common legal questions don't need to transfer to a lawyer. | **AC1** Document Q&A: Given user uploads PDF document (containing Q&A "What materials are needed for divorce litigation") to knowledge base and binds to `knowledge_qa` node's `kb_id`, When simulation test input is "What do I need to prepare for a divorce", Then system returns answer containing key info such as "ID card, marriage certificate, property proof", `sources` array length ≥ 1, `confidence` ≥ 0.8.<br>**AC2** No-Match Fallback: Given user inputs a question not in knowledge base "Who is your boss", When system processes, Then output `answer` = node's `not_found_msg` value (default "Sorry, I can't answer this right now, transferring you to a human agent"), `confidence` < 0.5, flow takes default branch.<br>**AC3** Retrieval Degradation: Given vector retrieval service is unavailable, When user asks question, Then system automatically degrades to FAQ keyword matching; if keyword matching fails, returns `not_found_msg`, flow does not interrupt. | `knowledge_qa` |
| FR-AI-003 · Neural TTS Voice Selection & Preview | P1 | As a clinic owner, I want to select a natural human-like voice and preview the effect, so that my AI receptionist doesn't sound like a robot. | **AC1** Voice Preview: Given user selects `voice`="Female - Gentle (Nova)" in `greeting` node, When clicking config panel "Preview" button, Then greeting voice of that tone plays within 3 seconds, audio latency < 3s, audio duration matches text length (approx. 3-5s).<br>**AC2** Speed Adjustment: Given user adjusts `speed` from 1.0x to 1.3x, When clicking preview again, Then playback speed noticeably increases, but audio quality has no distortion or breakage, voice and intonation match configured values. | `greeting`, `ask_question` |

### 2.3 Telephony Access Module

| ID · Feature | Priority | User Story | Acceptance Criteria | Associated Nodes |
|--------------|----------|------------|---------------------|------------------|
| FR-CM-001 · Platform-Managed Number Application & Binding | P0 | As a startup founder (no own number), I want to directly apply for a phone number on the platform and bind it to a receptionist, so that I can go live with zero configuration. | **AC1** Number Allocation: Given user clicks "Apply Managed Number" on telephony access settings page, When selecting location "Shanghai" and number type "Local Landline", Then system allocates number within 5 seconds (e.g., +86 21-XXXX-XXXX), displays monthly rent $1-5/month, after clicking "Bind" the number is associated with current receptionist, operations dashboard "Current Active Calls" count takes effect.<br>**AC2** Number Selection: Given user already has 2 managed numbers, When selecting `phone_number` in `incoming_call_trigger` node, Then dropdown displays all applied numbers, supports multi-select ("All Numbers" or specific numbers). | `incoming_call_trigger` |
| FR-CM-002 · BYO Number SIP Configuration | P1 | As a mature enterprise IT lead, I want to forward my own number to the platform via SIP, so that I can use AI reception without changing numbers. | **AC1** SIP Parameter Generation: Given user selects "BYO Number (SIP Forwarding)" on telephony access settings page, When clicking "Get SIP Config", Then system displays four parameters: SIP URI (format `sip:receptionist-{id}@sip.voiceflow.cn`), Domain, Username, Password, which user can copy to their own PBX / carrier backend configuration.<br>**AC2** Inbound Routing: Given user completes SIP configuration and dials own number, When call arrives at platform, Then system correctly routes to bound receptionist flow, call record displays original called number. | `incoming_call_trigger` |
| FR-CM-003 · WebRTC Browser Call Embedding | P1 | As a SaaS product manager, I want to embed a "Voice Call" button on my website so customers can directly call the AI receptionist from their browser, so that visitors get voice service without dialing a phone. | **AC1** Embed Code: Given user selects "WebRTC Browser Call" on telephony access settings page, When clicking "Generate Embed Code", Then system outputs a `<script>` tag code containing a unique Client Token; after user copies it to website HTML, a "Voice Call" floating button appears on the page.<br>**AC2** Browser Call: Given website visitor clicks "Voice Call" button, When browser requests microphone permission and grants it, Then WebRTC call with AI receptionist is established within 3 seconds, visitor hears greeting. | `incoming_call_trigger` |

### 2.4 Simulation Test Module

| ID · Feature | Priority | User Story | Acceptance Criteria | Associated Nodes |
|--------------|----------|------------|---------------------|------------------|
| FR-TS-001 · In-Canvas Text Simulation Test | P0 | As a clinic owner, I want to verify flow logic is correct without making a phone call, so that I can iterate quickly without consuming call fees. | **AC1** Simulation Start: Given user clicks "Text Simulation" button at top of canvas, When simulation panel slides out from bottom, Then system executes from `incoming_call_trigger`, displays first message "Hello, this is Kangmei Dental. How may I help you?", `greeting` node highlighted in blue on canvas + 0.3s pulse animation.<br>**AC2** Branch Interaction: Given system displays greeting, When user inputs in simulation panel "I want to book a teeth cleaning for next Wednesday", Then system returns next message per node logic, current execution node highlighted in blue + 0.3s pulse animation, branch node displays selectable branch buttons (e.g., "Book/Consult/Complaint").<br>**AC3** Dead-End Detection: Given text simulation runs to `conditional_branch` node with condition intent="book", When user clicks "Book", Then downstream node of "Book" branch is activated and highlighted in blue; if reaching a node with no subsequent connection (dead end), simulation panel displays red warning "Current path has reached the end, not connected to Call End node", that node turns red. | All 20 nodes (external integration nodes return mock data) |
| FR-TS-002 · Real Call Simulation Test | P1 | As an operations lead, I want to dial a temporary test number from my mobile phone to verify real voice effects, so that I confirm ASR/TTS and voice interaction experience meet standards before official release. | **AC1** Get Test Number: Given user clicks "Real Call Simulation" button, When clicking "Get Test Number", Then system allocates temporary test number (e.g., +86 400-XXX-XXXX), status shows "Valid for 10 minutes", countdown timer starts.<br>**AC2** Test Report: Given user dials test number from mobile phone and completes a full call, When call ends, Then test panel auto-generates test report: call duration, node execution path (highlighted), ASR transcription text, TTS broadcast content list; test calls are not counted in operations statistics.<br>**AC3** Frequency Limit: Given same user has used 10 real call simulations within 24 hours (free plan), When clicking "Get Test Number" again, Then system prompts "Today's test limit reached (10/10). Please try again tomorrow or upgrade your plan"; test number is auto-released 10 minutes after call ends and cannot be dialed again. | All 20 nodes (no external notifications triggered during test) |

### 2.5 Version Management Module

| ID · Feature | Priority | User Story | Acceptance Criteria | Associated Nodes |
|--------------|----------|------------|---------------------|------------------|
| FR-VM-001 · Auto Version Snapshot & History List | P1 | As an operations lead, I want every draft save to auto-generate a version snapshot, so that I can roll back to previous versions anytime. | **AC1** Snapshot Generation: Given user modifies node config on canvas and clicks "Save Draft", When save succeeds, Then system auto-generates version snapshot, naming format `v{major}.{minor}-{timestamp}` (e.g., v1.3-20260504T143000), version list adds a record displaying version number, save time, saver, change summary ("Modified greeting text").<br>**AC2** Auto Cleanup: Given a receptionist has saved 50 drafts, When 51st save occurs, Then system auto-deletes earliest draft version, retaining most recent 50 drafts + all published versions. | All 20 nodes |
| FR-VM-002 · Version Comparison & One-Click Rollback | P1 | As an operations lead, I want to compare differences between two versions and one-click rollback, so that I can quickly recover from mistakes without affecting live business. | **AC1** Version Comparison: Given user selects v1.0 and v1.3 on version management page and clicks "Compare", When entering comparison mode, Then canvas split-screens both versions, added nodes green border + "+" badge, modified nodes yellow border + "~" badge, deleted nodes red semi-transparent, bottom change list displays specific difference items.<br>**AC2** One-Click Rollback: Given user clicks "Rollback" button for v1.0 on version management page, When modal displays "Rolling back to v1.0 will replace current live version (v1.3). Confirm?" and inputs "Confirm Rollback", Then system immediately makes v1.0 the live version, original v1.3 retained in history list, published receptionist switches to v1.0 flow within 30 seconds; during rollback if new call comes in, it executes per pre-rollback flow, not interrupting ongoing calls. | All 20 nodes |

### 2.6 Runtime Management Module

| ID · Feature | Priority | User Story | Acceptance Criteria | Associated Nodes |
|--------------|----------|------------|---------------------|------------------|
| FR-RT-001 · Receptionist Start/Stop Control | P0 | As a clinic owner, I want to pause or resume receptionist call answering at any time, so that I can stop service when temporarily unavailable. | **AC1** Stop Service: Given user clicks "Running" status switch on runtime management page, When modal confirms "After stopping, all incoming calls will hear a busy tone. Confirm stop?", Then status switches to "Stopped", receptionist no longer answers calls, subsequent callers hear default prompt "Service is temporarily unavailable. Please call again later.".<br>**AC2** Resume Service: Given receptionist is in "Stopped" status, When user clicks status switch, Then status switches to "Running", resumes answering calls within 30 seconds, no reconfiguration needed. | `incoming_call_trigger`, `end_call` |
| FR-RT-002 · Real-Time Call Monitoring | P1 | As a CS supervisor, I want to see on the dashboard how many calls are currently being handled, so that I can judge whether to dispatch more staff. | **AC1** Active Calls: Given 3 calls are currently being handled, When user enters operations dashboard, Then top of dashboard displays large number "3 Active Calls", next to it shows "+1 vs last hour", number auto-refreshes every 5 seconds.<br>**AC2** Abnormal Mark: Given a call has lasted 8 minutes (3× average duration), When system detects, Then that call is marked orange warning in dashboard list, hover displays "Call duration abnormal, possible infinite loop or no human transfer"; clicking that call card expands to show current execution node, call duration, caller number (masked as 138****8888), current branch path. | All 20 nodes |

### 2.7 Operations Dashboard Module

| ID · Feature | Priority | User Story | Acceptance Criteria | Associated Nodes |
|--------------|----------|------------|---------------------|------------------|
| FR-DB-001 · Core Metrics Dashboard | P1 | As an operations lead, I want to see yesterday's reception data summary every day upon login, so that I quickly understand business operating status. | **AC1** Yesterday Summary: Given user enters operations dashboard homepage, When page loading completes, Then yesterday's data is displayed by default: total calls, answer rate, average call duration, self-service resolution rate, human transfer rate, each metric showing MoM change (↑↓+percentage).<br>**AC2** Trend Chart: Given user clicks time range switch to "7 Days", When chart refreshes, Then line chart displays daily call volume trend for last 7 days, data point hover shows specific value. | All 20 nodes (data aggregation) |
| FR-DB-002 · Node Pass-Rate Heatmap | P1 | As an operations lead, I want to see which node in the flow has the lowest pass rate, so that I prioritize optimizing bottleneck links. | **AC1** Heatmap: Given user enters Operations Dashboard → Node Heatmap page, When page loads, Then matrix heatmap is displayed: horizontal axis = node names, vertical axis = time (last 24 hours), cell color gradient from green (pass rate >90%) to red (pass rate <50%).<br>**AC2** Drill-Down Analysis: Given a node has pass rate < 50% for 1 consecutive hour, When user clicks that red cell, Then expands to show failure reason distribution pie chart: "Caller hung up 60%" / "ASR recognition failure 25%" / "Transfer timeout 15%". | All 20 nodes |
| FR-DB-003 · Conversion Funnel Analysis | P1 | As a SaaS startup CEO Wang Qiang, I want to see stage-by-stage conversion data from customer answer to end, so that I can judge which link has the worst churn and prioritize optimization. | **AC1** Funnel Display: Given 100 calls yesterday, of which 100 answered, 87 completed intent recognition, 65 self-served, 13 transferred to human, 5 unresolved, When user views conversion funnel, Then funnel displays 5-level data: Answer 100% → Intent Recognition 87% → Self-Service 65% → Human Transfer 13% → Unresolved 5%, each level showing absolute count and conversion rate.<br>**AC2** Conversion Rate Anomaly: Given funnel "Intent Recognition → Self-Service" conversion rate dropped from 78% last week to 52% this week, When user clicks that level, Then expands detail panel showing possible reason distribution: "Caller hung up 60%, ASR recognition failure 25%, Transfer timeout 15%". | All 20 nodes |

### 2.8 Integration Module

| ID · Feature | Priority | User Story | Acceptance Criteria | Associated Nodes |
|--------------|----------|------------|---------------------|------------------|
| FR-IG-001 · CRM Lookup Node Configuration | P1 | As an insurance sales lead, I want to auto-query CRM for customer info when a call comes in, so that the AI receptionist can say "Hello Mr. Wang, I see you have three policies under your name." | **AC1** Customer Lookup: Given user configures `crm_lookup` node with `crm_type`="HubSpot", `query_field`="caller number", API Key filled, When real call from customer 13800000001 comes in, Then system returns customer record within 3 seconds: `found`=true, `customer.name`="Zhang San", `customer.level`="VIP", downstream node can use `{{customer.name}}` template variable.<br>**AC2** Lookup Failure: Given HubSpot API timeout (>5s) or returns 5xx, When executing CRM lookup, Then returns `found`=false, executes per `fallback_on_error` config (default "Treat as new customer"), flow continues without interruption, logs lookup failure. | `crm_lookup` |
| FR-IG-002 · Calendar Booking Integration | P1 | As a clinic owner Li Ming, I want the AI receptionist to directly help customers book a time slot, so that customers don't need to transfer to human to complete registration. | **AC1** Slot Query: Given user has configured `calendar_booking` node with `calendar_type`="Google Calendar", `duration`="30 minutes", and calendar has two free slots on May 15 at 10:00 and 14:30, When customer expresses "I want to book next Wednesday", Then system returns `booking_result`="success", `available_slots` contains both slots, downstream node broadcasts "Next Wednesday 10:00 and 14:30 are available.".<br>**AC2** Slot Conflict: Given customer's selected slot is already occupied by another appointment, When system attempts booking, Then returns `booking_result`="no_slots", broadcasts "That slot is already booked. Please select another time.", flow continues execution. | `calendar_booking` |
| FR-IG-003 · Webhook Node Configuration | P1 | As a tech lead, I want to push call info in real time to my own system, so that my ticket system can auto-create service tickets. | **AC1** Normal Push: Given user configures `webhook` node with `url`="https://api.mycompany.com/voice-event", `method`="POST", `body_template` containing `{{caller_number}}` and `{{intent}}` variables, When executing this node, Then system sends HTTP POST request within 3 seconds, request body `caller` and `intent` fields have actual values.<br>**AC2** Failure Retry: Given Webhook returns non-2xx status code or timeout (>5s), When execution fails, Then system auto-retries 1 time (interval 2s), retry still fails then logs error, decides per config whether to block flow (default no block). | `webhook` |
| FR-IG-004 · Send SMS Node Configuration | P1 | As a clinic owner Li Ming, I want to auto-send an appointment confirmation SMS to the customer after the call ends, so that the customer doesn't forget the appointment time. | **AC1** SMS Send: Given user configures `send_sms` node with `recipient`="caller number", `template`="Thank you for your call. Appointment confirmed: {{appointment_date}}", and upstream node has output `appointment_date`="Wed May 15 10:00", When call executes to this node, Then customer receives SMS within 10 seconds with content "Thank you for your call. Appointment confirmed: Wed May 15 10:00".<br>**AC2** Send Failure: Given SMS send fails (Twilio returns error code 21614 invalid number), When system processes, Then logs failure reason to call log, node outputs `sms_sent`=false, flow continues executing downstream nodes. | `send_sms` |

### 2.9 Security & Permission Module

| ID · Feature | Priority | User Story | Acceptance Criteria | Associated Nodes |
|--------------|----------|------------|---------------------|------------------|
| FR-SE-001 · Basic RBAC Permission Control | P0 | As a team manager, I want to assign different permissions to different members (Admin/Editor/Viewer), so that CS agents can only view data and cannot modify flows. | **AC1** Role Permissions: Given admin adds member email on team settings page and selects role "Editor", When that member logs in, Then they can only access canvas editing and simulation test, cannot see "Delete Receptionist" and "Modify Billing" buttons.<br>**AC2** URL Unauthorized Access Block: Given Viewer-role user attempts to access canvas edit page (direct URL input), When page loads, Then system returns 403 error page, prompt "You do not have permission to access this page"; all sensitive operations (publish/rollback/delete/stop receptionist/modify telephony config) require secondary confirmation. | All 20 nodes (permission control) |

---

## III. Business Rule Library

### 3.1 Process Validation Rules

| ID | Rule | Trigger Condition | Decision Logic | Execution Action | Exception |
|----|------|-------------------|----------------|------------------|-----------|
| BR-VA-001 | Loop Detection | Creating connection or validating/publishing | `dfs_detect_cycle`: DFS traversal, encountering a status-1 node means a loop | Loop nodes border `2px dashed #ff4d4f`, connections turn red; validation panel appends error; publish button disabled | — |
| BR-VA-002 | Open-Circuit Detection | Creating connection or validating/publishing | Traverse logic node output ports, check `edges.filter(...).length > 0`, any port without connection is open circuit | Open-circuit port node border `2px dashed #faad14`; validation panel appends warning; publish button disabled | — |
| BR-VA-003 | Required Field Validation | Node loses focus or validating/publishing | Traverse node schema config items where `required === true`, check for null/undefined/empty string | Node left side `4px solid #faad14` yellow bar; config panel field turns red; validation panel aggregates; publish button disabled | — |
| BR-VA-004 | Start Node Uniqueness | Adding node or validating/publishing | `count = nodes.filter(n => n.type === 'incoming_call_trigger').length`, `count !== 1` triggers | `count === 0` banner "Missing incoming call trigger"; `count > 1` all triggers turn red; publish button disabled | — |
| BR-VA-005 | End Node Reachability | Validating/publishing | `reverse_dfs(end_nodes)` reverse traversal marks reachable; BFS from trigger checks all paths reach `end_call` | Unreachable nodes `40% opacity` gray mask, connections turn dashed; validation panel shows unreachable count; publish button disabled | — |

### 3.2 Version Management Rules

| ID | Rule | Trigger Condition | Decision Logic | Execution Action | Exception |
|----|------|-------------------|----------------|------------------|-----------|
| BR-VM-001 | State Transition | Save / Publish / Create Draft / Deactivate / Activate / Delete | `state_machine(current_status, action)`: Draft+save→Draft; Draft+publish→Published; Published+create_draft→Draft; Published+rollback→Published; Archived+restore→Published; Archived+delete→Deleted (physically deleted after 30 days) | DB update, `updated_at = NOW()`, snapshot written to `version_history`; publish takes effect immediately; creating draft keeps live running old version | Validation not passed blocks publish, modal displays error list; illegal operation backend returns 400 |
| BR-VM-002 | Concurrent Edit Conflict | Clicking "Save Draft" | `if server_version > client_version then reject()` | Returns HTTP 409, prompt "This flow has been modified by another user. Please refresh and continue"; client modal provides "Refresh Page" button | User can force override (admin permission, V1.0 temporarily no merge, V2.0 introduces) |
| BR-VM-003 | Auto-Save | Stopping editing for >30s or closing page/switching route | `debounce_save(interval=30000)`, resets 30s timer after each modification; `beforeunload` immediately executes `save_draft()` | Generates minor version snapshot `v{major}.{minor}-{timestamp}`; silent save, no modal | Save failure displays yellow banner at top of canvas "Auto-save failed. Please save manually." |
| BR-VM-004 | Version Cleanup | Daily at 02:00 | `if draft_count > 50 → DELETE ... ORDER BY created_at ASC LIMIT (draft_count - 50)` | Auto-cleans earliest drafts, retains most recent 50 drafts + all published versions | Write to audit log before cleanup |

### 3.3 Telephony Rules

| ID | Rule | Trigger Condition | Decision Logic | Execution Action | Exception |
|----|------|-------------------|----------------|------------------|-----------|
| BR-CM-001 | Call Timeout | No valid input after call establishment | `no_input_duration >= ask_question.max_wait * (retries + 1)` | Broadcast `timeout_msg`, still no input then execute per `fallback_path`: if fallback branch exists take it, else `end_call`, `end_reason`="Timeout" | Record to CallSession, operations dashboard abnormal call ratio +1 |
| BR-CM-002 | Transfer Failure Fallback | `transfer_call` node executes transfer | `transfer_result in ['no_answer','busy','failed'] OR transfer_duration_ms >= timeout*1000` | Execute per `fallback_action`: fallback to previous node / transfer to voicemail / end directly, `end_reason`="Transfer Failed" | Operations dashboard "Transfer Failure Rate" updates, consecutive failures ≥3 trigger BR-OP-001 |
| BR-CM-003 | Concurrent Call Limit | New call enters system | `active_calls_count >= tenant_max_concurrent_calls` (Free 5 / Basic 10 / Pro 50) | Excess callers hear "All lines are busy" or hold music queued; record "Concurrency Exceeded" | Send upgrade plan reminder email to admin |
| BR-CM-004 | Call Establishment Latency Monitoring | Every call establishment | `connect_latency_ms > 10000` (dial to hearing greeting >10s) | Record slow connection log, dashboard marks call as "Slow Establishment" | Consecutive 5 slow connections trigger telephony quality alert |

### 3.4 Operations Rules

| ID | Rule | Trigger Condition | Decision Logic | Execution Action | Exception |
|----|------|-------------------|----------------|------------------|-----------|
| BR-OP-001 | Consecutive Transfer Failure Alert | Every transfer failure | `consecutive_transfer_failures >= 3 AND time_window <= 300s` | Send alert via WeCom/DingTalk/Email: "[Alert Type] Receptionist '{name}' triggered alert at '{time}', current value: {value}, threshold: {threshold}" | Same alert type not resent within 15 minutes |
| BR-OP-002 | Metric Anomaly Detection | Daily 00:05 day settlement | Today's value vs past 7-day average, `abs(today - 7d_avg) / 7d_avg > 20%` is abnormal; node pass rate `< 0.5 AND entered >= 10` (past 1h) is real-time abnormal | Operations dashboard metric shows "Abnormal" red label; heatmap corresponding cell turns red; daily email prioritizes abnormal metrics | Same metric abnormal for 3 consecutive days escalates alert level to "High" |
| BR-OP-003 | Data Retention Policy | Daily at 03:00 | Non-test calls >90 days archived; test calls >7 days deleted; free plan metadata 90 days archived, paid 365 days | Non-test calls transferred to cold storage (S3 Glacier / Alibaba Cloud Infrequent Access), metadata retained in PostgreSQL; test call recordings physically deleted, metadata retained 30 days then deleted; version snapshots retain most recent 50 drafts, published versions retained permanently | Send reminder email 7 days before archive/deletion; write to audit log before deletion |
| BR-OP-004 | Auto Daily Report Generation | Daily at 09:00 | `user.notification_settings.daily_report == true` | Generate and send yesterday data summary email: total calls, answer rate, self-service resolution rate, TOP3 abnormal nodes | Email send failure retries 1 time, still fails then logs |

### 3.5 Security Rules

| ID | Rule | Trigger Condition | Decision Logic | Execution Action | Exception |
|----|------|-------------------|----------------|------------------|-----------|
| BR-SE-001 | Permission Validation | Every API request | `rbac_check(user_id, resource_id, action)`: admin full permissions; editor read-write own team receptionists; viewer read-only; sensitive config admin-only | Validation passes continue execution; failure returns HTTP 403 "You do not have permission to perform this operation" | Record failed permission attempt to `security_audit_log` |
| BR-SE-002 | Sensitive Operation Secondary Confirmation | Publish / Rollback / Delete / Stop / Modify telephony config | `sensitive_actions` list contains current action then triggers | Modal displays operation summary and confirmation text, rollback requires inputting "Confirm Rollback" four characters; executes only after confirmation | User cancellation has no side effects |
| BR-SE-003 | Data Access Audit | Call records / customer data / flow config query/modify/export | `audit_log.insert({user_id, action, resource_type, resource_id, ip, ua, timestamp})` | Audit log written to independent `security_audit_log` table, retained 365 days, cannot be modified or deleted via regular APIs | Write failure triggers system-level alert, does not block original operation |
| BR-SE-004 | API Key Validity | Daily check at midnight | `api_key.created_at < NOW() - INTERVAL '90 days'` | Mark "Expiring Soon" (email reminder 7 days ahead), reject calls using expired key after expiration | User can manually renew, validity extended 90 days |

---

## IV. Non-Functional Requirements

### 4.1 Performance Requirements

| ID | Requirement | Metric | Measurement Method | Priority |
|----|-------------|--------|-------------------|----------|
| NFR-P-001 | Flow Loading Speed | First screen load < 2s (100-node flow) | Lighthouse ≥ 90 + Chrome DevTools Network TTFB + first paint | P0 |
| NFR-P-002 | Canvas Drag Smoothness | Drag latency < 50ms (50-node scenario) | Chrome DevTools Performance panel records `pointerdown`→`transform` interval | P0 |
| NFR-P-003 | Flow Engine Node Execution Latency | Single node execution < 10ms (pure rule node) | Backend APM tracking `node_execution_duration_ms` P99 | P0 |
| NFR-P-004 | AI Node Response Latency | Intent recognition < 500ms (incl. network round-trip); Knowledge base Q&A < 800ms | Backend APM tracking `ai_latency_ms` P95 | P1 |
| NFR-P-005 | Concurrent Call Support | Single instance ≥ 500 (V1.0), MVP ≥ 5; max concurrent per tenant ≥ 50 (V1.0) | Load test k6/Artillery simulates 500 concurrent, error rate < 0.1% | P1 |
| NFR-P-006 | API Response Time | REST API P95 < 200ms (excl. AI calls); canvas save/validate/config 95% < 200ms | APM monitoring + alerting | P0 |
| NFR-P-007 | Call Establishment Latency | End-to-end latency from dial to hearing greeting < 3s | Real dial test, Twilio records `initiated_at` and `greeting_played_at` difference | P0 |

### 4.2 Security Requirements

| ID | Requirement | Metric | Measurement Method | Priority |
|----|-------------|--------|-------------------|----------|
| NFR-S-001 | Communication Encryption | Signaling layer TLS 1.3; Media layer SRTP AES-256-GCM; API layer HTTPS + JWT | SSL Labs A+ + Twilio SRTP verification + packet capture shows no plaintext media stream | P0 |
| NFR-S-002 | Multi-Tenant Data Isolation | Tenant A cannot read any data from Tenant B | Automated penetration test: cross-tenant access 100% blocked | P0 |
| NFR-S-003 | Permission Control | RBAC: admin/editor/viewer 3 roles, 15+ feature-point permission matrix 100% coverage | Automated permission test: roles × feature points = 45 cases all pass | P0 |
| NFR-S-004 | Sensitive Data Masking | Number masking rate 100% (`138****5678`), name masking rate 100%; API Key displays `sk-****abcd`; recording URL has 15-minute expiry signature | Frontend UI automation verifies masking format; backend unit test verifies URL signature expiry returns 403 | P1 |

### 4.3 Availability Requirements

| ID | Requirement | Metric | Measurement Method | Priority |
|----|-------------|--------|-------------------|----------|
| NFR-A-001 | System SLA | Monthly availability ≥ 99.9% (monthly downtime < 43 min) | UptimeRobot/Pingdom 5-minute interval health checks | P0 |
| NFR-A-002 | Disaster Recovery Strategy | Primary DB failure read switch to read replica RTO < 30s; write degradation cache queue; overall RTO < 15 min, RPO < 5 min | Quarterly DR drill + chaos engineering: terminate primary PG instance, measure recovery time and data consistency | P1 |
| NFR-A-003 | Failure Recovery Time | Flow engine single-node failure: auto-restart + state recovery < 60s; call not interrupted (Twilio state machine independent) | Simulate kill -9 flow engine process, measure health check failure to ready interval | P1 |
| NFR-A-004 | Data Backup Strategy | PostgreSQL daily full backup + every 15 min WAL incremental backup; retain 30 days; RPO < 15 min | Randomly extract backup files monthly to verify recoverability | P1 |
| NFR-A-005 | Degradation Strategy | When AI service is unavailable, AI nodes 100% auto-degrade to rule engine, flow not interrupted | Chaos test: cut LLM API, verify degradation trigger time and flow continuity | P1 |

### 4.4 Compliance Requirements

| ID | Requirement | Metric | Measurement Method | Priority |
|----|-------------|--------|-------------------|----------|
| NFR-C-001 | Call Recording Regulations | Recording notice played at call start ≥ 3s; recording file SHA-256 digital signature tamper-proof; customer can request recording deletion, completed within 72 hours | Compliance audit: sample 100 recordings, 100% contain recording notice | P0 |
| NFR-C-002 | Data Retention Requirements | Call metadata 90 days (free) / 365 days (paid); recordings transferred to cold storage after 90 days retained 1 year; account deletion physically clears all data within 30 days | Automated cleanup task logs + periodic sampling verifies expired data cleared | P1 |
| NFR-C-003 | Privacy Policy | At registration, inform data collection scope, usage purpose, third-party sharing (Twilio/OpenAI), require user checkbox consent | Legal review: privacy policy text passes compliance lawyer review | P0 |

---

## V. Open Questions List

| ID | Question | Recommended Direction |
|----|----------|----------------------|
| OQ-001 | AI model supplier failure-switch granularity: per-node / per-session / per-tenant? | **Option B (per-session switch) as V1.0 implementation**. MVP stage AI node usage is low, full-degradation risk is controllable; code complexity 60% lower than A. V2.0 considers per-node switching. |
| OQ-002 | Cross-border storage compliance for call recordings: target customers include mainland China, data storage region involves PIPL | **Option A as mainland China region default**: recordings written to Alibaba Cloud OSS Beijing region; non-China regions use AWS S3. Architecturally shield underlying differences through abstract storage layer (MinIO compatible API). |
| OQ-003 | Multi-user real-time collaborative editing architecture selection: optimistic locking vs OT/CRDT | **V1.0 maintains optimistic locking**, V2.0 early stage adopts Yjs + custom graph structure validation layer, executing BR-VA series validation after CRDT sync to filter invalid states. |
| OQ-004 | Pricing model revenue structure trade-off: pure subscription vs pure usage-based vs hybrid | **Option B (Subscription + AI Minute Pack) as V1.0 pricing model**: base monthly fee $99 (includes managed number + traditional ASR/TTS + 500 AI minutes), excess $0.04/AI minute. Base features all-inclusive, AI enhancements pay-per-use. |
| OQ-005 | Does it support multilingual voice synthesis (non-Chinese/English)? | Choose A, V1.0 only supports Chinese + English. MVP target market is primarily Chinese users; V1.0 decides whether to expand to 10 languages based on user feedback data. |
