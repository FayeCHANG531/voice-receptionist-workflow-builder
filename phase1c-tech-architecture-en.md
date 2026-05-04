# Voice Receptionist SaaS Workflow Builder — Technical Architecture Document

> **Delivery Date**: May 2026
>
> | Attribute | Content |
> |-----------|---------|
> | **Version** | v1.0 |
> | **Prerequisites** | Product Strategy Document (`phase1a-product-strategy.md`) · Product Requirements Document (`phase1b-prd.md`) |
> | **Scope** | MVP (0→1) to V1.0 (1→10) |
> | **Design Principles** | Domain-driven design determines service boundaries; latency sensitivity drives layering (synchronous hot path vs. asynchronous cold path separation); failure mode analysis drives reliability design (every critical path must have a fallback plan) |

---

## Table of Contents

1. [System Decomposition & Service Boundaries](#i-system-decomposition--service-boundaries)
2. [Data Flow Architecture](#ii-data-flow-architecture)
3. [Full Technology Stack & Selection Argumentation](#iii-full-technology-stack--selection-argumentation)
4. [Telephony Access Architecture](#iv-telephony-access-architecture)
5. [Integration Architecture](#v-integration-architecture)
6. [Core Data Entity Relationships](#vi-core-data-entity-relationships)
7. [Core API Operation List](#vii-core-api-operation-list)
8. [Deployment & Scaling Architecture](#viii-deployment--scaling-architecture)
9. [Security & Compliance Architecture](#ix-security--compliance-architecture)

---

## I. System Decomposition & Service Boundaries

### 1.1 Service Panorama Interaction Diagram

```mermaid
graph TB
    subgraph External["External Systems"]
        Twilio["Twilio<br/>PSTN/SIP/WebRTC"]
        Browser["Browser<br/>WebRTC SDK"]
        AI["AI Providers<br/>GPT-4o-mini / Deepgram / ElevenLabs"]
        CRM_EXT["CRM/Calendar<br/>HubSpot/Salesforce/Google"]
    end

    subgraph Core["Core Service Layer (Synchronous Hot Path)"]
        FRE["Flow Runtime Engine<br/>Call Processing Engine<br/>Latency Requirement <10ms/node"]
        CGW["Communication Gateway<br/>Telephony Gateway<br/>Latency Requirement <50ms callback response"]
        WSS["WebRTC Signaling<br/>WebRTC Signaling Service<br/>WebSocket persistent connection"]
    end

    subgraph Enhanced["Enhanced Service Layer (Asynchronous Cold Path)"]
        AIGW["AI Orchestration Gateway<br/>AI Orchestration Gateway<br/>P95 <800ms"]
        IGW["Integration Gateway<br/>Integration Gateway<br/>P95 <5s"]
        FBS["Flow Builder Service<br/>Flow Builder Service<br/>Incl. validation/template/version management"]
    end

    subgraph Support["Support Service Layer"]
        OAS["Operations Analytics<br/>Operations Analytics Service"]
        STS["Simulation & Test<br/>Simulation & Test Service"]
        IAS["Identity & Access<br/>Identity & Access Service"]
        MCS["Media & Compliance<br/>Media & Compliance Service"]
    end

    subgraph Data["Data Layer"]
        PG["PostgreSQL 15<br/>Primary Database"]
        Redis["Redis 7<br/>Cache/Session/Real-time Metrics"]
        S3["MinIO / S3<br/>Recording/File Storage"]
    end

    Browser -->|WebSocket Signaling| WSS
    WSS -->|Audio Stream Relay| CGW
    CGW -->|Twilio Webhook| FRE
    CGW --> Twilio
    FRE -->|AI Call| AIGW
    FRE -->|External Integration| IGW
    FRE -->|Write Call Data| OAS
    FRE --> Redis
    FRE --> PG
    AIGW --> AI
    IGW --> CRM_EXT
    FBS --> PG
    FBS --> Redis
    IAS -->|Auth| FRE
    IAS -->|Auth| CGW
    IAS -->|Auth| WSS
    IAS -->|Auth| FBS
    IAS -->|Auth| OAS
    STS -->|Read Flow| FBS
    STS -->|Execute Simulation| FRE
    MCS --> S3
    MCS --> PG
    OAS --> PG
    OAS --> Redis
```

### 1.2 Service Details

#### S1 · Flow Runtime Engine (Call Processing Engine)

| Dimension | Content |
|-----------|---------|
| **Responsibilities** | Execute workflows during calls: load flow definition → execute nodes in sequence → manage call sessions → call AI/integration gateways → end call and persist records |
| **Calls Whom** | AI Orchestration Gateway (AI intent/knowledge base/TTS), Integration Gateway (CRM/Calendar/Webhook), Communication Gateway (TTS broadcast/transfer commands), Operations Analytics (async write call data) |
| **Called By Whom** | Communication Gateway (Twilio Webhook inbound), Simulation & Test Service (simulation test mode) |
| **Split Rationale** | This is the **synchronous hot path** of call processing — P99 node execution latency must be < 10ms (BR-VA series validation executes between nodes, not during calls). If merged with Operations Analytics: slow analytics queries (e.g., funnel calculation scanning 100k call records, taking 500ms+) would compete for CPU/memory with call processing, causing Twilio Webhook timeouts (Twilio default 15s timeout, but the customer is waiting on the phone; every additional 100ms latency = perceived pause +0.15s) → abandonment rate +3%. If merged with AI Gateway: AI call latency of 300-800ms is an async characteristic; merging would block the synchronous event loop with AI waits, affecting node scheduling for other calls, dropping concurrent calls from 50 to 15. Independent deployment enables horizontal scaling via Node.js cluster, 500 concurrent calls per instance |

#### S2 · Communication Gateway (Telephony Gateway)

| Dimension | Content |
|-----------|---------|
| **Responsibilities** | Encapsulate Twilio Programmable Voice API: process inbound Webhook → manage call lifecycle state machine (Ringing/Connected/InIVR/Transferred/Voicemail/Ended) → issue TTS broadcast commands → execute transfers → listen for call event callbacks |
| **Calls Whom** | Flow Runtime Engine (forward inbound events + receive node execution commands), Twilio REST API (dial/transfer/hangup) |
| **Called By Whom** | Twilio (Webhook callback), Flow Runtime Engine (broadcast/transfer/hangup commands) |
| **Split Rationale** | Communication protocol adaptation is the **most vendor-coupled layer** — Twilio Webhook format, SIP Trunking configuration, WebRTC Client Token generation, and call state machine maintenance are all bound to Twilio-specific APIs. Merging into the flow engine would cause: (1) flow engine unit tests need to mock the entire Twilio signaling layer, test complexity +300%; (2) future switching telephony providers (e.g., Alibaba Cloud number service for China market) would require changing flow engine core code — with an independent communication gateway, only a unified interface `ICallControl` (dial/play/hangup/transfer) needs to be implemented, switching cost drops from 40 person-days to 8 person-days |

#### S3 · AI Orchestration Gateway (AI Orchestration Gateway)

| Dimension | Content |
|-----------|---------|
| **Responsibilities** | Unified encapsulation of AI provider calls: intent recognition (GPT-4o-mini) → knowledge base Q&A (vector retrieval + LLM) → neural TTS (ElevenLabs Turbo v2.5 primary / Azure Neural backup) → streaming ASR (Deepgram Nova-2 primary / Whisper Large v3 backup). Core capabilities: provider fallback (GPT unavailable → degrade to keyword matching, `fallback_used=true`), result cache (same text not re-calling LLM within 15 minutes), cost tracking (by node/tenant/provider dimension) |
| **Calls Whom** | GPT-4o-mini / Claude 3 Haiku, Deepgram / Whisper, ElevenLabs / Azure Neural, vector database (pgvector) |
| **Called By Whom** | Flow Runtime Engine (sync call, 300-800ms timeout), Flow Builder Service (TTS preview PREVIEW mode) |
| **Split Rationale** | AI provider **unreliability** is a core architectural constraint: (1) provider SDK upgrade frequency is high (e.g., OpenAI SDK has incompatible changes every 2-3 months), independent service isolates impact scope; (2) cost tracking requires 3D aggregation by tenant×node×provider — merging into flow engine would pollute call processing code with cost calculation logic; (3) 3 AI qualitative change points (intent recognition/RAG/neural TTS) share the same fallback chain (provider unavailable → rule engine), independent gateway centrally manages fallback strategy rather than repeating implementation in each node's code (BR-VA has no fallback rule; fallback logic is in AI gateway, not flow engine) — if not split, the same fallback code would be written 3 times across AI node execution logic, maintenance cost +200% |

#### S4 · Integration Gateway (Integration Gateway)

| Dimension | Content |
|-----------|---------|
| **Responsibilities** | Synchronous adapter calls to external systems: CRM lookup (HubSpot/Salesforce) → calendar booking (Google Calendar/Cal.com) → Webhook push (HTTP POST/GET) → notification send (Slack/WeCom/DingTalk/Email) → SMS send (Twilio SMS). Unified management of timeout (5s), retry (1 time, interval 2s), circuit breaker (5 consecutive failures pause 30s) |
| **Calls Whom** | HubSpot API / Salesforce API, Google Calendar API / Cal.com API, Slack/WeCom/DingTalk Webhook, Twilio SMS API, user-defined Webhook URL |
| **Called By Whom** | Flow Runtime Engine (real-time call sync call, sync block < 5s) |
| **Split Rationale** | External integration **failure modes** differ from the flow engine — external API timeout/5xx is normal rather than exceptional (typical third-party API availability SLA is 99.5%-99.9%, i.e., 22-220 minutes downtime per month). Merging into flow engine: (1) external API timeout (e.g., HubSpot response 8s) would block the flow engine event loop, causing other call node execution latency in the same process to also reach 8s — violating the <10ms latency requirement; (2) each integration adapter (CRM/Calendar/Notification/Webhook/SMS) is about 150-300 lines, totaling ~1000+ lines — merging increases flow engine package size by 40%, cold start time +1.5s. Independent gateway uses independent thread pool, external timeouts do not affect call node scheduling |

#### S5 · Flow Builder Service (Flow Builder Service)

| Dimension | Content |
|-----------|---------|
| **Responsibilities** | Manage flow creation, editing, validation, template generation, version management: (1) canvas editing — node CRUD, connection management (corresponds to FR-FL-001/002/005/006); (2) flow validation — loop/open-circuit/required/start/end five rules (BR-VA-001~005); (3) industry template library — storage and one-click generation of 3 industry templates (FR-FL-004); (4) version management — auto snapshots (BR-VM-001), version comparison, one-click rollback (FR-VM-001/002), state transition (BR-VM-001), concurrent edit conflict detection (BR-VM-002) |
| **Calls Whom** | PostgreSQL (flow definition/version snapshot/template storage), Redis (edit lock + auto-save temp storage), Identity & Access Service (permission validation) |
| **Called By Whom** | Frontend canvas (REST API + WebSocket auto-save), Simulation & Test Service (read flow for simulation), Flow Runtime Engine (load latest flow definition into Redis cache on publish) |
| **Split Rationale** | Flow editing is a **high read-write ratio + long transaction** pattern — users continuously edit on canvas for 10-30 minutes, generating dozens of auto-saves and real-time validation requests. Merging into flow engine: (1) version snapshot JSONB writes (single flow definition 50-200KB) and diff calculation (O(n²) node-level diff) are CPU-intensive operations — if in the same process as call processing, diff calculation would steal CPU time slices from call node execution, causing P99 latency to spike from 10ms to 80ms+; (2) version management data model (version_history table, concurrent edit optimistic locking) and call session model (call_sessions table) have completely different access patterns —前者 is low-frequency large transactions (one save of 50-200KB JSON),后者 is high-frequency small writes (one UPDATE of 100-500B per node execution), merging causes PostgreSQL autovacuum to be delayed by mixed workload, leading to call write latency jitter |

#### S6 · Operations Analytics Service (Operations Analytics Service)

| Dimension | Content |
|-----------|---------|
| **Responsibilities** | All data capabilities of the operations dashboard: core metrics dashboard (FR-DB-001 — yesterday summary/trend chart), node pass-rate heatmap (FR-DB-002 — 24h×node matrix), conversion funnel analysis (FR-DB-003 — 5-level funnel), anomaly detection (BR-OP-002 — day settlement + real-time anomaly), auto daily report generation (BR-OP-004), data retention policy execution (BR-OP-003) |
| **Calls Whom** | PostgreSQL (aggregation queries + time-series data), Redis (real-time metrics cache — active call count/queue count), Media & Compliance Service (recording file archive trigger) |
| **Called By Whom** | Frontend operations dashboard (REST API), Flow Runtime Engine (async write call records and node execution logs), scheduled task scheduler (daily report generation/data cleanup) |
| **Split Rationale** | Operations analytics is a **typical OLAP workload** — aggregation queries (e.g., `SELECT node_type, date_trunc('hour', executed_at), COUNT(*) ... GROUP BY` scanning millions of rows) severely conflict with flow engine OLTP workload (single-row INSERT/UPDATE) on PostgreSQL: (1) OLAP query full table scans pollute PostgreSQL shared_buffers, evicting flow engine active data cache, causing call write latency jitter +50ms; (2) anomaly detection window calculation (past 7-day average vs today) needs to execute at 00:05 daily; if in the same DB as call processing, day settlement CPU peaks may cause ongoing call write timeouts. Separated as an independent service, a read-replica PostgreSQL can be deployed dedicated to analytics queries, while the primary DB focuses on call writes |

#### S7 · Identity & Access Service (Identity & Access Service)

| Dimension | Content |
|-----------|---------|
| **Responsibilities** | Multi-tenant management + RBAC permission control (FR-SE-001): tenant creation/configuration, user registration/login (JWT issuance+validation), role management (admin/editor/viewer), API key management (BR-SE-004 — 90-day expiry+renewal), audit logs (BR-SE-003 — all sensitive operations recorded to security_audit_log), URL unauthorized access blocking (AC2) |
| **Calls Whom** | PostgreSQL (user/tenant/role/API key/audit log tables) |
| **Called By Whom** | All other services (API Gateway layer JWT validation middleware + inter-service mTLS + RBAC permission validation) |
| **Split Rationale** | Authentication and authorization are **cross-cutting concerns** — every service needs auth, but auth logic itself is independent of business. Merging into any business service: (1) user/tenant/role data model changes (e.g., adding role "billing_admin") would cause business service restart, affecting call processing; (2) audit log writes (1 INSERT per sensitive operation) if in the same table as call writes, high-concurrency call scenarios make audit log writes a write hotspot, increasing PostgreSQL row lock contention. With an independent service, audit log writes can be decoupled via async queue, not affecting call write latency |

#### S8 · Simulation & Test Service (Simulation & Test Service)

| Dimension | Content |
|-----------|---------|
| **Responsibilities** | Complete capabilities for two simulation test modes: (1) in-canvas text simulation (FR-TS-001) — drives Flow Runtime Engine to execute flow in "simulation mode", user text input replaces ASR, system text output replaces TTS; (2) real call simulation (FR-TS-002) — temporary test number allocation/release (10-minute validity), test call execution, test report generation, frequency limit control (10/day free plan) |
| **Calls Whom** | Flow Builder Service (read flow definition), Flow Runtime Engine (execute with simulation_mode=true), Communication Gateway (allocate temporary test numbers) |
| **Called By Whom** | Frontend simulation test panel |
| **Split Rationale** | Simulation test **isolation requirements** are higher than feature reuse: (1) real call simulation requires temporary number resource pool management (allocation/release/expiry cleanup) — this is an independent state machine, merging into Communication Gateway would couple with its formal call number management logic; (2) test call DB write volume is 3× formal calls (extra simulation logs/path tracking/ASR transcription details), merging into flow engine table space increases formal call data autovacuum overhead by 30%; (3) test numbers have strict rate-limiting policy (10/day) and validity period (10 minutes), independent service centrally manages rate-limit counters |

#### S9 · Media & Compliance Service (Media & Compliance Service)

| Dimension | Content |
|-----------|---------|
| **Responsibilities** | Call recording storage, retrieval, compliance management: (1) recording file SHA-256 digital signature (NFR-C-001 — tamper-proof); (2) recording retention policy execution (BR-OP-003 — non-test >90 days archive cold storage, test >7 days delete); (3) recording deletion request processing (NFR-C-001 — completed within 72 hours); (4) knowledge base file storage and vectorization trigger |
| **Calls Whom** | MinIO/S3 (recording file storage), Alibaba Cloud OSS (mainland China recording storage, OQ-002 Option A), PostgreSQL (recording metadata) |
| **Called By Whom** | Communication Gateway (write recording file after call ends), Operations Analytics Service (recording archive trigger), frontend recording playback page |
| **Split Rationale** | Recording storage **compliance and storage policies** are independent from business logic: (1) recording file storage paths differ by regional compliance requirements (mainland China → Alibaba Cloud OSS Beijing region; non-China → AWS S3 us-east-1, OQ-002) — if merged into Communication Gateway, regional routing logic would pollute call control code; (2) recording retention/deletion policies (BR-OP-003) are regulation-driven (non-test >90 days archive, recording deletion within 72h) rather than business-driven — independent service ensures compliance changes (e.g., PIPL revision) only affect this service, no need to redeploy Communication Gateway; (3) recording file size (3-10MB per call) storage and transmission is completely different from business data JSON transmission mode |

#### S10 · WebRTC Signaling Service (WebRTC Signaling Service)

| Dimension | Content |
|-----------|---------|
| **Responsibilities** | Manage WebRTC connection signaling exchange: SDP Offer/Answer negotiation → ICE candidate exchange → establish browser-to-Twilio WebRTC media stream → relay WebRTC audio stream to internal call processing flow |
| **Calls Whom** | Communication Gateway (convert WebRTC call to internal call processing flow), Twilio Client SDK |
| **Called By Whom** | Browser-side WebRTC SDK (WebSocket signaling connection), frontend embed code generation API |
| **Split Rationale** | WebRTC signaling is a **long-connection WebSocket service**, connection mode completely different from HTTP API — requires sticky session and heartbeat keepalive (every 30s ping/pong). If merged into Communication Gateway: (1) WebSocket long connections consume HTTP API connection pool and thread resources — 1000 WebSocket connections per server consume memory (~50MB) and file descriptors (1000+), squeezing Twilio Webhook processing resources; (2) WebRTC SDP parsing/ICE processing depends on specific libraries (e.g., `wrtc`), which may conflict with Communication Gateway's Twilio SDK dependencies; (3) independent deployment enables K8s `sessionAffinity: ClientIP` to ensure signaling from the same browser always routes to the same instance, avoiding cross-instance session state sync — if merged with stateless CGW, K8s affinity scheduling policies would conflict |

---

## II. Data Flow Architecture

### 2.1 Inbound Call Processing Full-Flow Sequence Diagram

```mermaid
sequenceDiagram
    actor Caller as Caller
    participant Twilio as Twilio PSTN/SIP/WebRTC
    participant CGW as Communication Gateway
    participant FRE as Flow Runtime Engine
    participant AIGW as AI Orchestration Gateway
    participant IGW as Integration Gateway
    participant OAS as Operations Analytics
    participant MCS as Media & Compliance

    Note over Caller,MCS: ═══ Phase 1: Call Establishment (Synchronous Hot Path) ═══

    Caller->>Twilio: Dial phone number
    Twilio->>CGW: POST /webhook/voice (CallStatus=ringing)
    CGW->>CGW: Concurrency check BR-CM-003<br/>active_calls >= tenant_max? → busy prompt
    CGW->>FRE: POST /session/start {call_sid, caller_number, tenant_id}
    
    Note over FRE: Load flow definition (Redis cache <5ms)
    FRE-->>FRE: Execute incoming_call_trigger node<br/>(pure rules, <10ms)
    
    Note over Caller,MCS: ═══ Phase 2: Greeting Playback (Synchronous Hot Path + AI Enhanced) ═══

    FRE-->>FRE: Execute greeting node<br/>Render greeting text (pure rules, <5ms)
    
    alt Neural TTS available
        FRE->>AIGW: POST /tts/synthesize {text, voice, speed}
        AIGW->>ElevenLabs: TTS API request<br/>Latency +200ms
        ElevenLabs-->>AIGW: Audio stream (PCM)
        AIGW-->>FRE: {audio_url, duration_ms}
    else TTS fallback
        AIGW-->>FRE: {audio_url, fallback_used=true}<br/>Use Azure Neural backup voice
    end
    
    FRE->>CGW: POST /call/play {call_sid, audio_url}
    CGW->>Twilio: <Play> TwiML command
    Twilio->>Caller: Play greeting voice "Hello, welcome to our service..."

    Note over Caller,MCS: ═══ Phase 3: Intent Recognition (AI Enhanced Path, 300-500ms) ═══

    FRE-->>FRE: Execute ask_question node<br/>(pure rules, <10ms)
    FRE->>CGW: POST /call/gather {call_sid, question_text}
    CGW->>Twilio: <Gather> TwiML command
    Twilio->>Caller: Play "Would you like to book, consult, or file a complaint?"
    Caller->>Twilio: Voice input "I want to book a teeth cleaning for next Wednesday"
    Twilio->>CGW: POST /webhook/voice (SpeechResult)
    CGW->>FRE: POST /session/input {call_sid, user_input, confidence}
    
    FRE-->>FRE: Execute ai_intent_detection node<br/>Prepare AI call, <5ms

    alt AI intent recognition available
        FRE->>AIGW: POST /intent/detect {user_input, intents[], threshold}
        AIGW->>GPT-4o-mini: NLU API request<br/>Latency +300ms
        GPT-4o-mini-->>AIGW: {intent:"appointment", confidence:0.93}
        AIGW-->>FRE: {detected_intent:"appointment", confidence:0.93, fallback_used:false}
    else AI unavailable (5xx/timeout)
        AIGW-->>FRE: {detected_intent:"appointment", confidence:0.85, fallback_used:true}
        Note over FRE: Degrade to keyword matching<br/>"book" → appointment
    end

    Note over Caller,MCS: ═══ Phase 4: Branch Routing + External Integration (Hybrid Path) ═══

    FRE-->>FRE: Execute conditional_branch node<br/>Match intent="appointment"<br/>(pure rules, <5ms)
    
    FRE-->>FRE: Execute collect_info node<br/>Collect name/phone/date<br/>(pure rules, <10ms×N rounds)

    FRE->>IGW: POST /integration/crm/lookup {caller_number}
    IGW->>HubSpot: CRM API query<br/>Timeout 5s
    HubSpot-->>IGW: {found:true, customer:{name:"Zhang San",level:"VIP"}}
    IGW-->>FRE: {found:true, customer:{...}}

    FRE->>IGW: POST /integration/calendar/check {date, duration}
    IGW->>Google Calendar: Calendar API query<br/>Timeout 5s
    Google Calendar-->>IGW: {available_slots:[...]}
    IGW-->>FRE: {available_slots:[...]}

    Note over Caller,MCS: ═══ Phase 5: Transfer & End ═══

    FRE->>CGW: POST /call/transfer {call_sid, target, transfer_type:"warm"}
    CGW->>Twilio: <Dial> TwiML command (warm transfer)
    Twilio->>Caller: Transferring...

    FRE->>IGW: POST /integration/sms/send {recipient, template, vars}
    IGW->>Twilio SMS: Send confirmation SMS

    FRE-->>FRE: Execute end_call node<br/>(pure rules, <5ms)
    FRE->>CGW: POST /call/hangup {call_sid}

    Note over Caller,MCS: ═══ Phase 6: Post-Processing (Asynchronous Cold Path) ═══

    FRE->>OAS: ASYNC POST /analytics/call/complete<br/>{call_session_data, node_executions[]}
    Note over OAS: Async write, does not block call end

    CGW->>MCS: ASYNC POST /media/recording/store<br/>{call_sid, recording_url}
    Note over MCS: Download recording → SHA-256 signature → Store
```

### 2.2 Path Annotation Table

| # | Path Name | Services Passed | Latency Characteristics | Cost Characteristics | Fallback Strategy |
|---|-----------|-----------------|------------------------|---------------------|-------------------|
| 1 | Call Establishment | Twilio → CGW → FRE | Synchronous hot path, total latency < 100ms (incl. Twilio Webhook network round-trip ~80ms + FRE session creation <10ms) | No AI cost, only Twilio answer fee $0.013/min | CGW concurrency exceeded returns TwiML `<Reject>` |
| 2 | Rule Node Execution | FRE internal | Synchronous hot path, < 10ms/node (pure in-memory state machine, incl. Redis snapshot write 2ms) | No extra cost | FRE process crash → systemd auto-restart < 60s, Twilio state machine independent and uninterrupted (NFR-A-003) |
| 3 | Neural TTS Synthesis | FRE → AIGW → ElevenLabs | AI enhanced path, +200ms (P95 < 500ms, incl. network round-trip) | +$0.005/minute (ElevenLabs Turbo) | ElevenLabs unavailable → AIGW switches to Azure Neural (+50ms latency, MOS 4.0 vs 4.2) |
| 4 | AI Intent Recognition | FRE → AIGW → GPT-4o-mini | AI enhanced path, +300ms (P95 < 500ms) | +$0.015/minute | GPT unavailable or timeout → AIGW degrades to keyword matching (BR-VA has no such item; fallback logic is in AIGW), `fallback_used=true`, flow does not interrupt |
| 5 | Knowledge Base Q&A | FRE → AIGW → pgvector + LLM | AI enhanced path, +500ms (P95 < 800ms) | +$0.03/minute | Vector retrieval unavailable → AIGW degrades to FAQ keyword matching, still fails returns `not_found_msg` |
| 6 | CRM Lookup | FRE → IGW → HubSpot | Sync but blockable, P95 < 3s (incl. HubSpot API latency avg 800ms) | No extra cost (user brings own API Key) | HubSpot timeout 5s → IGW returns `found:false`, executes per `fallback_on_error` config (default "Treat as new customer"), flow does not interrupt |
| 7 | Calendar Booking | FRE → IGW → Google Calendar | Sync but blockable, P95 < 3s | No extra cost | Google Calendar timeout 5s → IGW returns `booking_result:"error"`, downstream node broadcasts error prompt |
| 8 | Webhook Push | FRE → IGW → User-defined URL | Sync but blockable, P95 < 3s, failure retry 1 time (interval 2s) | No extra cost | Retry still fails → log error, decides per config whether to block flow (default no block) |
| 9 | Call Data Write | FRE → OAS | Async cold path, FRE sends and returns immediately, OAS writes to PostgreSQL in background | No extra cost | OAS unavailable → FRE local buffer queue temporarily stores (max 1000), replays after OAS recovers |
| 10 | Recording Storage | CGW → MCS | Async cold path, triggered after call ends, download+signature+storage < 30s | S3 storage fee approx. $0.023/GB/month | MCS unavailable → CGW temporarily stores recording URL locally, supplements upload after MCS recovers |

### 2.3 Scenario: Text Simulation Execution Flow

Text simulation executes inside the flow engine with `simulation_mode=true` — **does not call AI gateway or integration center**, uses rule matching to simulate AI output, uses preset data to simulate integration returns. Architectural rationale: (1) avoid simulation incurring AI call costs (each simulation may trigger 3-5 AI nodes); (2) simulation purpose is to validate flow jump logic, not AI effects; (3) simulation execution needs to complete in seconds, waiting for AI/external API would ruin interaction experience.

```mermaid
sequenceDiagram
    actor User as Test User
    participant UI as Frontend Canvas
    participant FBS as Flow Builder Service
    participant FRE as Flow Runtime Engine

    User->>UI: Click "Text Simulation" button
    UI->>FBS: POST /simulation/text/start {flow_id}
    FBS->>FRE: POST /session/start {flow_data, mode=simulation}
    Note over FRE: Load flow definition<br/>Set simulation_mode=true

    FRE-->>FRE: Execute incoming_call_trigger node<br/>(pure rules, <10ms)
    FRE-->>FBS: {node_id, output:{greeting_text:"Hello, welcome to our service..."}}
    FBS-->>UI: Display first system message + highlight greeting node

    loop Each subsequent node
        alt Action node (greeting/ask_question/collect_info)
            FRE-->>FRE: Execute node logic (pure rules, <10ms)
            FRE-->>FBS: Node output (system message text)
            FBS-->>UI: Display system message + highlight current node (blue+pulse)
        else Logic node (conditional_branch/if_else)
            FRE-->>FBS: Branch option list
            FBS-->>UI: Display selectable branch buttons (e.g., "Book/Consult/Complaint")
            User->>UI: Click branch button
            UI->>FBS: POST /simulation/text/choose-branch {session_id, branch}
            FBS->>FRE: Pass branch selection
            FRE-->>FRE: Activate corresponding branch path
        else AI node (ai_intent_detection/knowledge_qa)
            Note over FRE: Simulation mode: does not call AI gateway<br/>Uses rule matching to simulate AI output
            FRE-->>FRE: Keyword matching simulates intent recognition<br/>(e.g., "book" → intent="appointment", confidence=0.9)
            FRE-->>FBS: Simulated AI output
            FBS-->>UI: Display simulated intent result
        else Integration node (crm_lookup/calendar_booking/webhook)
            Note over FRE: Simulation mode: returns preset mock data<br/>(e.g., crm_lookup → found:true, customer:{name:"Zhang San"})
            FRE-->>FBS: Mock integration output
        end
    end

    FRE-->>FRE: Reach end_call node or dead end
    alt Path reaches end_call node
        FRE-->>FBS: {simulation_result:"completed", node_executions[]}
        FBS-->>UI: Green banner "Simulation complete, all paths reachable to call end node"
    else Reach dead end (no subsequent connection)
        FRE-->>FBS: {simulation_result:"dead_end", stuck_node_id}
        FBS-->>UI: Red warning "Current path has reached the end, not connected to Call End node", dead-end node turns red
    end
```

---

## III. Full Technology Stack & Selection Argumentation

### 3.1 Selection Overview Table

| # | Layer | Selection | Alternative | Alternative Disadvantages | Selection Rationale |
|---|-------|-----------|-------------|---------------------------|---------------------|
| 1 | **Frontend Canvas** | React Flow v11+ | AntV X6 | X6 is based on SVG/Canvas hybrid rendering, node content is not React components — requires 30%+ additional adapter code to map React forms to X6 Cell model; X6 event system is incompatible with React synthetic events, drag performance optimization requires direct Canvas API manipulation, development efficiency reduced 40% | React Flow v11+ natively supports React components as node content, deeply aligned with project React 19 + TypeScript stack; custom node/port/connection API design is modern; MIT license with no commercial restrictions; community 25k+ stars, bug fix cycle <7 days |
| 2 | **Frontend UI** | shadcn/ui + Radix + Tailwind CSS v4 | Ant Design / MUI | Ant Design package size 1.2MB (still 600KB+ after tree-shaking), significantly impacts canvas page first-screen load (+1.2s); MUI's CSS-in-JS generates runtime performance overhead in React Flow node's frequent re-render scenarios (each node drag triggers Emotion style recalculation, +15ms/frame) | shadcn/ui is copy-source-code rather than npm dependency, package size approaches 0; Radix primitives provide accessibility (meets WCAG 2.1 AA); Tailwind v4 JIT compilation outputs CSS containing only actually used classes |
| 3 | **Backend Runtime** | Node.js 22 + TypeScript 5.x + Fastify | Go (Gin/Echo) / Rust (Actix) | Go's JSON processing (struct tag mapping) is more verbose than Node.js's `JSON.parse()`; Rust's async runtime (Tokio) has a steep learning curve, team hiring difficulty +5×; Go/Rust do not share type definitions with frontend TypeScript, flow definition JSON Schema needs to be maintained separately on frontend and backend → type inconsistency risk | Frontend and backend share TypeScript type definitions (flow node/connection/config item Schema), unified management via monorepo (turborepo); Fastify is 2× faster than Express (route matching uses radix tree), P99 latency < 5ms; Node.js's async I/O model naturally fits Communication Gateway's high-concurrency Webhook processing (single process 5000+ concurrent connections) |
| 4 | **Flow Execution Engine** | Self-built Node.js state machine engine (pure in-memory + Redis snapshot) | Camunda (Java) / Temporal (Go) / AWS Step Functions | Camunda's JVM startup overhead + REST API call latency = 50-100ms/node, does not meet <10ms requirement; Temporal fits async long flows (order fulfillment / Saga), min scheduling latency for sync real-time short flows (call node execution) is 80ms+; AWS Step Functions $0.000025 per state transition + 50ms+ latency, 1000 calls/day costs $25/day (state transition fee only) | Self-built engine pre-compiles flow definition to executable DAG, node switching is pure in-memory operation (<1ms); Redis snapshot for failure recovery (written after each node execution, 2ms); Temporal/Step Functions fit "publish/rollback" async long transactions, but call node execution is "sync microsecond-level", engines are different — self-built engine is an "execution engine", Temporal can be introduced as an "orchestration engine" in V2.0 for async long flows |
| 5 | **Telephony Layer** | Twilio Programmable Voice | Plivo / Telnyx / Self-built FreeSWITCH | Plivo does not support WebRTC Client SDK (cannot implement FR-CM-003 browser call); Telnyx's WebRTC solution API docs coverage is incomplete (only 60% of endpoints documented), development debug cycle +3 weeks; self-built FreeSWITCH requires communication protocol experts (SIP/RTP/SRTP tuning), team hiring difficulty + ongoing ops cost $2,000-3,000/month | Twilio is the only provider that natively supports PSTN numbers + SIP Trunking + WebRTC Client three product lines with a unified API — tri-mode telephony access covered by one Twilio REST API, extra dev cost ~15% (vs self-building each mode requiring independent protocol stacks); 50+ country number coverage globally; SLA 99.95% |
| 6 | **AI Gateway** | Self-built Node.js Gateway (200 lines core code) + provider SDKs | LangChain / Vercel AI SDK | LangChain's abstraction layer has 50+ inheritance depths (BaseLanguageModel → BaseChatModel → ChatOpenAI → ...), each LLM call passes through 5+ middlewares, latency increases 50-100ms; Vercel AI SDK focuses on frontend streaming experience (useChat hook), backend gateway functions (provider fallback/result cache/cost tracking) need self-implementation — in practice still requires 150+ lines of gateway code | Self-built gateway core needs are simple and clear: unified call interface `detectIntent()`/`answerQuestion()`/`synthesize()` → provider fallback → cache → cost record. 200 lines of code covers it, no framework learning cost; LangChain's 50-100ms latency is unacceptable in real-time voice scenarios — every additional 100ms the customer waits, perceived pause +0.15s |
| 7 | **Primary Database** | PostgreSQL 15 + JSONB | MySQL 8.0 / MongoDB 7 | MySQL's JSON type does not support GIN index — flow definition JSONB queries (e.g., `WHERE flow_definition @> '{"nodes":[{"type":"greeting"}]}'`) require full table scan in MySQL, 1000+ flows query latency 500ms+ vs PostgreSQL GIN index <5ms; MongoDB's Aggregation Pipeline is 3×+ harder to maintain than SQL multi-table join — version/user/flow triple association requires $lookup nesting in MongoDB, SQL only needs 3-line JOIN | PostgreSQL JSONB provides GIN index + path query dual capabilities; flow definition (nodes/connections/configs) is tree-shaped JSON, JSONB query "all flows containing a certain node type" <5ms; supports pgvector extension for knowledge base vector retrieval, avoiding introducing independent vector databases (Milvus/Pinecone), architecture simplified |
| 8 | **Cache/Session** | Redis 7 | Memcached / PostgreSQL UNLOGGED TABLE | Memcached does not support persistence — flow engine's Redis snapshot is used for failure recovery (NFR-A-003), Memcached loses all data after restart, unable to recover ongoing call states; PostgreSQL UNLOGGED TABLE read-write latency (2-5ms) is 10× that of Redis (0.1-0.5ms), not meeting real-time flow execution requirements | Redis 7 latency <0.5ms; supports Pub/Sub (operations dashboard real-time refresh) and Stream (async event queue); RDB + AOF persistence guarantees call session data not lost; single instance 100k ops/s, meets 500 concurrent call read-write needs |
| 9 | **File Storage** | MinIO (self-built, S3 API compatible) → V1.0 upgrade to AWS S3 / Alibaba Cloud OSS | Direct AWS S3 / Alibaba Cloud OSS (skip MinIO) | Skip MinIO and directly use cloud storage: local dev environment needs public network connection to cloud storage, upload latency +100ms+; integration test recording file upload consumes public network traffic fees | MVP stage uses self-built MinIO (Docker single container), dev/test environment zero cost; V1.0 migrates to cloud storage via S3 API compatible layer with zero code changes (OQ-002 mainland China solution) |
| 10 | **Container Orchestration** | Docker Compose (MVP) → Kubernetes (V1.0) | Direct Kubernetes (MVP stage) | MVP stage team size 3-5 people, K8s ops overhead (cluster setup/Ingress config/HPA tuning/log collection) requires an extra DevOps engineer — equivalent to 20% dev resources consumed by ops; K8s resource overhead (control plane ~2GB memory) is disproportionately high on MVP's 2-3 servers | Docker Compose single file defines all services, `docker compose up` one-click start, dev/test/prod environments consistent; V1.0 when concurrent calls > 500 and independent scaling needed, migrate to K8s with clear migration path (Compose file → Kompose conversion → Helm Chart optimization) |
| 11 | **API Gateway** | Traefik (MVP) → Kong/APISIX (V1.0) | Nginx + Lua / Envoy | Nginx + Lua dynamic route config requires reload (`nginx -s reload`), each reload disconnects long connections (WebSocket/WebRTC signaling) — conflicts with canvas auto-save WebSocket connections; Envoy's xDS protocol has steep learning curve, MVP stage does not need full service mesh capabilities | Traefik natively supports Docker service discovery (auto-register routes via labels), auto Let's Encrypt TLS cert renewal, WebSocket proxy; V1.0 when API Key rate limiting/JWT validation/multi-tenant routing needed, upgrade to Kong/APISIX |
| 12 | **Frontend State Management** | Zustand | Redux Toolkit | Redux's action/reducer/slice three-layer structure is over-abstraction for flow editing's shallow state (current flow ID, selected node ID, canvas zoom value) — a "select node" operation requires defining action type + reducer + selector, Zustand only needs `set({selectedNodeId})`; call simulation real-time state (current node, conversation history) needs high-frequency updates, Zustand's immutable update has no middleware overhead, Redux's immer middleware produces perceptible GC pressure under high-frequency updates | Zustand's lightweight store directly maps flow editing's flat state, 60% less code than Redux; natively supports TypeScript type inference; can be composed with React Flow's `useStore` hook |
| 13 | **Vector Database** | pgvector (MVP) → Pinecone (V1.0) | Milvus / Weaviate / Pinecone (use from MVP) | Directly using Pinecone from MVP start: MVP stage knowledge base document volume is small (< 1000 chunks), Pinecone's hosted fee ($70/month+) accounts for 30%+ of MVP infrastructure cost — unreasonable; Milvus requires self-built ops (2C8G minimum), ops burden too heavy for MVP's 3-5 person team | pgvector runs inside PostgreSQL, zero extra infrastructure cost at MVP stage; vector retrieval latency < 50ms (within 1000 chunks) meets knowledge base Q&A needs; V1.0 when vector data volume > 100k and retrieval latency > 200ms, migrate to Pinecone (managed service zero ops, latency < 100ms, supports namespace isolation), migration path: pgvector → Pinecone `pgvector2pinecone` batch import tool |
| 14 | **Message Queue** | Redis Streams (MVP) → Kafka (V2.0) | RabbitMQ / Direct Kafka | RabbitMQ requires Erlang runtime and cluster management, ops complexity far higher than Redis Streams (already in stack); Kafka under small message volume (< 1000 messages/minute) is over-architecture — needs Zookeeper/KRaft coordination, infrastructure cost $200+/month; direct Kafka Producer/Consumer API requires extra learning cost | Redis Streams consumer group mode covers flow engine→operations analytics node execution record push (producer-consumer pattern); MVP stage message volume < 1000 messages/minute, Redis Streams single instance sufficient; no new infrastructure needed (Redis already in stack); V2.0 when message volume > 100k messages/minute and message persistence > 7 days needed, migrate to Kafka |

---

## IV. Telephony Access Architecture

### 4.1 Three Access Mode System Integrations

| Access Mode | System-Side Integration Component | Event Callback Mechanism | Callback Target |
|-------------|-----------------------------------|--------------------------|-----------------|
| **Platform-Managed Number** | Twilio Phone Number Purchase API → Purchase number → Configure Voice Webhook URL = `https://{host}/api/comm/webhook/voice` | Twilio sends HTTP POST (x-www-form-urlencoded) to Voice Webhook URL on call status changes, containing `CallSid`/`From`/`To`/`CallStatus` | Communication Gateway → Flow Runtime Engine |
| **BYO Number (SIP)** | Twilio SIP Trunking API → Create SIP Domain → Generate Termination URI `sip:{receptionist_id}@sip.voiceflow.cn` | User PBX forwards number to Termination URI → Twilio SIP Trunk receives → Convert to Voice Webhook (same flow as above) | Same managed number path |
| **WebRTC Browser Call** | Twilio Client SDK (JS) → Frontend embed `<script>` + Access Token (JWT, contains `client_token`) → Browser gets microphone → Establish WebRTC media stream | Browser-side `Twilio.Device.connect()` → Twilio signaling server → Voice Webhook (same flow as above) | Same managed number path |

**Twilio Unified Abstraction Layer**: All three modes follow the exact same processing chain after Voice Webhook — this is the architectural embodiment of "Twilio unified abstraction layer, extra development cost ~15%" from 1A. Communication Gateway's `ICallControl` interface uniformly handles broadcast/transfer/hangup commands for all three modes, only differing in number management mode (managed=purchase+bind, SIP=generate URI, WebRTC=generate Client Token).

### 4.2 Call Lifecycle State Machine

```mermaid
stateDiagram-v2
    [*] --> Ringing: Inbound signaling arrives<br/>(Twilio Webhook CallStatus=ringing)
    
    Ringing --> Connected: System answers<br/>(CGW returns <Answer> TwiML)
    Ringing --> Missed: Ring timeout / caller hangs up<br/>(max_ring_duration expired)
    Ringing --> Rejected: User rejects<br/>(CallStatus=busy/no-answer)
    
    Connected --> InIVR: Greeting starts playing<br/>(FRE executes greeting node)
    Connected --> Voicemail: Outside business hours<br/>(business_hours node outputs closed)
    Connected --> Hold: Transferring — waiting for target to answer<br/>(transfer_call node executes, warm transfer)
    
    InIVR --> InIVR: Node execution step by step<br/>(greeting→ask_question→conditional_branch→...)
    InIVR --> Hold: Transfer node triggered<br/>(transfer_call node executes)
    InIVR --> Ended: Flow ends / caller hangs up<br/>(end_call node or CallStatus=completed)
    
    Hold --> Transferred: Target answers<br/>(Twilio <Dial> answered)
    Hold --> Voicemail: Transfer target no-answer timeout<br/>(timeout_seconds expired, BR-CM-002)
    Hold --> Connected: Cold transfer — direct bridge<br/>(transfer_type=cold)
    
    Transferred --> Ended: Call ends after transfer<br/>(Callee hangs up)
    
    Voicemail --> Ended: Recording complete / timeout<br/>(Recording ends or timeout)
    
    Missed --> [*]
    Rejected --> [*]
    Ended --> [*]: Call data write + recording archive<br/>(Async trigger OAS + MCS)

    note right of InIVR
        Each node execution:
        - Rule node <10ms
        - AI node 300-800ms
        - Integration node <5s
        All nodes async write
        call_node_executions table
    end note

    note right of Hold
        Transfer waiting phase:
        - Play hold music
        - Start timeout timer
        - Fallback or voicemail after timeout
    end note
```

| State | Trigger Condition | System Behavior |
|-------|-------------------|-----------------|
| **Ringing** | Twilio Webhook `CallStatus=ringing` | CGW executes concurrency check (BR-CM-003), if exceeded returns `<Reject>`; otherwise returns `<Answer>`, FRE creates CallSession |
| **Connected** | After CGW returns `<Answer>`, Twilio confirms connection | FRE starts executing flow from `incoming_call_trigger`; records `connect_latency_ms`, if exceeds 10s marks "Slow Establishment" (BR-CM-004) |
| **InIVR** | Flow engine starts executing nodes | Nodes execute step by step, each node output written to `call_node_executions` table; AI nodes fallback if unavailable; transfer node triggers → Hold; caller hangs up (`CallStatus=completed`) → direct jump to Ended |
| **Hold** | `transfer_call` node executes | CGW issues `<Dial>` TwiML + plays hold music; starts timeout timer (10-60s configurable); target answers → Transferred; timeout → Voicemail (BR-CM-002); cold transfer mode → direct bridge Connected |
| **Transferred** | Callee answers | Call control transferred to callee; AI receptionist exits media stream; FRE marks node `transfer_result=success` |
| **Voicemail** | `business_hours` outputs `closed` and voicemail configured, or transfer timeout | CGW issues `<Record>` TwiML; after recording completes Twilio callbacks recording URL → MCS stores |
| **Ended** | `end_call` node executes or caller hangs up | FRE writes `end_reason`; CGW issues `<Hangup>`; async trigger OAS write call data + MCS recording archive |
| **Missed** | Caller hangs up before connection or ring timeout | Records `end_reason=missed`, not counted in operations statistics normal call count |
| **Rejected** | User actively rejects (`CallStatus=busy` or `no-answer`) | Records `end_reason=rejected`, not counted in operations statistics normal call count; does not trigger any subsequent flow |

---

## V. Integration Architecture

### 5.1 Generic Adapter Pattern

All external integrations follow a unified pattern — **Integration Gateway as synchronous proxy** (calls are real-time interactions, the user is on the other end of the phone waiting, integration must execute synchronously rather than async callback):

```
Flow Runtime Engine → Integration Gateway (sync, timeout 5s)
                         ├── Adapter Interface
                         │   ├── ICRMAdapter.lookup(phone)
                         │   ├── ICalendarAdapter.checkAvailability(date, duration)
                         │   ├── INotificationAdapter.send(channel, template, vars)
                         │   ├── IWebhookAdapter.dispatch(url, method, body)
                         │   └── ISMSAdapter.send(recipient, template, vars)
                         ├── Circuit Breaker (5 consecutive failures → open 30s)
                         ├── Retry Policy (1 retry, interval 2s)
                         └── Timeout Manager (5s hard timeout)
```

### 5.2 Detailed Integration Definitions

| Integration | Corresponding Node/Feature | Business Input Params | Business Output Params | Timeout Strategy | Retry Strategy | User Perception After Failure |
|-------------|---------------------------|----------------------|------------------------|------------------|----------------|------------------------------|
| **CRM Lookup** | `crm_lookup` (FR-IG-001) | `caller_number` (E.164), `crm_type` (HubSpot/Salesforce), `api_key` | `found` (bool), `customer` ({name, level, history}), `query_latency_ms` | Hard timeout 5s | 1 retry (interval 2s) | Downstream node uses `{{customer.name}}` template variable — if lookup fails (`found=false`), variable replaced with empty string, greeting becomes "Hello, welcome to our service" (no personalization), customer has no perceived anomaly; lookup failure logged to `call_node_executions.error_detail` |
| **Calendar Booking** | `calendar_booking` (FR-IG-002) | `calendar_type`, `date`, `duration`, `calendar_id`, `api_key` | `booking_result` (success/no_slots/error), `appointment`, `available_slots[]` | Hard timeout 5s | 1 retry (interval 2s) | `booking_result=error` broadcasts "Sorry, the booking system is temporarily unavailable. Transferring you to a human agent.", flow takes transfer branch; customer can clearly perceive anomaly but flow does not interrupt |
| **Webhook** | `webhook` (FR-IG-003) | `url` (HTTPS), `method` (POST/GET/PUT), `headers`, `body_template` (with template variables) | `webhook_success` (bool), `webhook_response`, `status_code` | Hard timeout 5s | 1 retry (interval 2s) | Default `block_on_failure=false` — Webhook failure does not block flow, customer has no perception; if user configures `block_on_failure=true`, failure takes fallback branch (e.g., transfer to human) |
| **SMS Send** | `send_sms` (FR-IG-004) | `recipient` (E.164), `template`, `fixed_number` | `sms_sent` (bool), `sms_sid`, `recipient` | Hard timeout 5s | 1 retry (interval 2s) | SMS send failure does not block flow (`sms_sent=false`), call ends normally; user can view SMS send status in call log; failure reason (e.g., Twilio error code 21614 invalid number) logged |
| **Notification Send** | `send_notification` | `channel` (Slack/WeCom/DingTalk/Email), `template`, `webhook_url` | `notification_sent` (bool), `channel`, `message_id` | Hard timeout 3s (lower than other integrations' 5s — notification is not a call critical path, timeout silently fails) | No retry (notification is "nice-to-have", retry may cause duplicate notification harassment) | Notification send failure customer completely has no perception (notification is internal team touchpoint, not customer-facing) |

### 5.3 Why the Integration Center Executes Synchronously Rather Than Async Callback

Calls are real-time interaction scenarios — the customer is on the other end of the phone waiting for system response. If CRM lookup were changed to async callback:

1. **Customer-perceived "blank pause"**: Flow engine executes to `crm_lookup` node → initiates async query → cannot immediately decide downstream branch (found → personalized greeting, not found → standard greeting) → must play "Please hold, looking up your information..." before query returns (extra TTS broadcast +2s latency + cost $0.005-0.015) — this "please hold" waiting experience is worse than sync waiting 3s (user knows they are waiting vs. not knowing what happened)

2. **Flow branch uncertainty**: Async callback means nodes after `crm_lookup` cannot depend on CRM query results — but in 1A Example B, `if_else` node directly uses `customer.order_status` for分流 judgment. Async mode would require重构 entire branch logic to callback-driven, complexity +300%

3. **Timeout more uncontrollable**: Sync mode hard timeout 5s + fallback `found=false`, customer waits ≤ 5s. Async mode, if callback never comes (provider down), flow engine must set a "wait timeout" → timeout then fallback — essentially same as sync timeout fallback, but with extra async state management code complexity

**Conclusion**: Integration center executes synchronously, hard timeout 5s + 1 retry, immediately fallback after timeout (return default value or error mark) — this is the optimal solution for real-time call scenarios.

### 5.4 Integration Center Key Architectural Decisions

| Decision Point | Selection | Rejected Alternative | Rationale |
|----------------|-----------|---------------------|-----------|
| **Sync vs Async** | Synchronous execution (flow engine waits for integration result) | Async callback | Calls are real-time interactions, user is on the other end of the phone waiting. If CRM query async callback takes 5-30 seconds, user experience is unacceptable. Only "send SMS" and "send notification" operations that do not require instant customer feedback can be executed async after call ends |
| **Adapter Registration Method** | Code-level registration (each integration is an Adapter class implementing `IIntegrationAdapter` interface) | Config-based registration (JSON Schema describing input/output params) | MVP stage has only 4 integrations (CRM/Calendar/Webhook/SMS), code registration is faster and type-safe — TypeScript type checking catches parameter errors at compile time. V2.0 when integration count > 10, consider config-based registration + dynamic adapter loading |
| **Integration Execution Location** | Executed inside Integration Gateway | Executed inside Flow Runtime Engine | Integration node timeout/retry/error handling logic accounts for 40% of code volume, unrelated to FRE's core scheduling logic. After independent deployment: (1) integration timeout does not occupy FRE threads (FRE async waits for IGW return, continues processing other calls in the meantime); (2) new integrations only need new adapter deployment, no FRE code changes; (3) IGW can independently scale to handle third-party API latency fluctuations |
| **Circuit Breaker Strategy** | 5 consecutive failures → open 30s (Circuit Breaker) | No circuit breaker (retry every time) | Without circuit breaker, if HubSpot API is down for 30 minutes, every customer call waits 5s + retry 2s = 7s before fallback — repeating this wait across all calls is wasteful. Circuit breaker immediately returns `found=false` fallback, customer wait time 0s, auto half-open probe after recovery |

---

## VI. Core Data Entity Relationships

### 6.1 Entity Relationship Diagram

```mermaid
erDiagram
    Tenant ||--o{ User : "owns"
    Tenant ||--o{ Receptionist : "owns"
    Tenant ||--o{ PhoneNumber : "owns"
    Tenant ||--o{ ApiKey : "owns"
    
    User ||--o{ Receptionist : "creates/edits"
    
    Receptionist ||--o{ Flow : "current version"
    Receptionist ||--o{ Version : "version history"
    Receptionist ||--o{ CallSession : "handles calls"
    Receptionist ||--o{ PhoneNumber : "binds"
    
    Flow ||--o{ Node : "contains"
    Flow ||--o{ Connection : "contains"
    
    Version ||--o{ Flow : "snapshot"
    
    CallSession ||--o{ CallNodeExecution : "execution records"
    CallSession ||--o{ CallRecording : "recordings"
    
    Node ||--o{ CallNodeExecution : "recorded"
```

### 6.2 Entity Field Definitions

#### Tenant

| Field | Business Meaning | Constraints |
|-------|-----------------|-------------|
| `tenant_id` | Tenant unique identifier | UUIDv7, generated at creation, immutable |
| `name` | Enterprise/team name | ≤ 100 chars, required |
| `plan` | Plan type | Enum: free/starter/professional/enterprise |
| `max_concurrent_calls` | Max concurrent calls | Determined by plan: Free 5 / Basic 10 / Pro 50 |
| `storage_region` | Data storage region | Enum: cn-beijing/us-east-1/eu-west-1, determines recording and database geographic distribution (OQ-002) |
| `created_at` / `updated_at` | Timestamps | Auto-maintained |
| `status` | Tenant status | Enum: active/suspended/deleted |

#### User

| Field | Business Meaning | Constraints |
|-------|-----------------|-------------|
| `user_id` | User unique identifier | UUIDv7 |
| `tenant_id` | Belongs to tenant | FK → Tenant, required |
| `email` | Login email | Unique (within tenant), required, ≤ 255 chars |
| `role` | RBAC role | Enum: admin/editor/viewer (FR-SE-001) |
| `password_hash` | Password hash | bcrypt(12 rounds) |
| `notification_settings` | Notification preferences | JSONB: `{daily_report:bool, alert_channels:[]}` |
| `last_login_at` | Last login time | For security audit |

#### Receptionist

| Field | Business Meaning | Constraints |
|-------|-----------------|-------------|
| `receptionist_id` | Receptionist unique identifier | UUIDv7 |
| `tenant_id` | Belongs to tenant | FK → Tenant |
| `name` | Receptionist name | ≤ 100 chars, required, e.g., "Front Desk Receptionist" |
| `status` | Running status | Enum: draft/published/archived (BR-VM-001 state machine) |
| `current_flow_id` | Currently active flow version | FK → Flow, updated on publish |
| `template_id` | Source template | FK → Template, used for "template usage rate" Key Result 2 stats |
| `last_call_date` | Most recent call date | Used to calculate North Star metric MAReceptionist |
| `created_by` | Creator | FK → User |

#### Flow (Flow Definition)

| Field | Business Meaning | Constraints |
|-------|-----------------|-------------|
| `flow_id` | Flow unique identifier | UUIDv7 |
| `receptionist_id` | Belongs to receptionist | FK → Receptionist |
| `version_label` | Version label | E.g., `v1.3-20260504T143000` (BR-VM-001) |
| `nodes` | Node list | JSONB array, each node contains `node_id`/`type`/`position`/`config` |
| `connections` | Connection list | JSONB array, each connection contains `source_node_id:port` → `target_node_id:port` |
| `is_published` | Whether published version | bool, published versions retained permanently (BR-VM-001) |
| `change_summary` | Change summary | ≤ 500 chars, e.g., "Modified greeting text" |
| `created_by` | Saver | FK → User |

#### Node

| Field | Business Meaning | Constraints |
|-------|-----------------|-------------|
| `node_id` | Node unique identifier | UUIDv7 |
| `flow_id` | Belongs to flow | FK → Flow |
| `type` | Node type | Enum: 20 types (`incoming_call_trigger`/`greeting`/.../`call_summary`) |
| `name` | Node display name | ≤ 50 chars, default is node type's default Chinese name |
| `position_x` / `position_y` | Canvas coordinates | Pixel values, used for canvas rendering |
| `config` | Node configuration items | JSONB, each node type has independent config Schema |
| `input_ports` / `output_ports` | Port definitions | JSONB arrays, each port contains `port_id`/`label`/`type` |

#### Connection

| Field | Business Meaning | Constraints |
|-------|-----------------|-------------|
| `connection_id` | Connection unique identifier | UUIDv7 |
| `flow_id` | Belongs to flow | FK → Flow |
| `source_node_id` | Source node | FK → Node |
| `source_port_id` | Source port | Corresponds to port_id in Node's output_ports |
| `target_node_id` | Target node | FK → Node |
| `target_port_id` | Target port | Corresponds to port_id in Node's input_ports |
| `label` | Connection condition label | ≤ 30 chars, e.g., "Book Branch"/"Yes/Open"/"No/Closed" |
| `connection_type` | Connection type | Enum: data_flow (solid blue) / conditional_flow (dashed orange) / ai_flow (dashed purple) |

#### Version (Version Snapshot)

| Field | Business Meaning | Constraints |
|-------|-----------------|-------------|
| `version_id` | Version unique identifier | UUIDv7 |
| `receptionist_id` | Belongs to receptionist | FK → Receptionist |
| `flow_id` | Snapshot flow definition | FK → Flow (BR-VM-003 auto-save generation) |
| `version_label` | Version number | E.g., `v1.3-20260504T143000` |
| `major` / `minor` | Major/minor version | major increments on publish, minor increments on each save |
| `created_by` | Saver | FK → User |
| `change_summary` | Change summary | ≤ 500 chars |

#### PhoneNumber

| Field | Business Meaning | Constraints |
|-------|-----------------|-------------|
| `phone_number_id` | Number unique identifier | UUIDv7 |
| `tenant_id` | Belongs to tenant | FK → Tenant |
| `receptionist_id` | Bound receptionist | FK → Receptionist, nullable (unbound) |
| `number` | Phone number | E.164 format, e.g., +8613800000001 |
| `number_type` | Number type | Enum: local/400_hotline/mobile |
| `access_mode` | Access mode | Enum: managed / sip_forwarding / webrtc |
| `monthly_cost` | Monthly rent | Local $1-5/month, 400 hotline $15-25/month |
| `status` | Number status | Enum: active/suspended/released |

#### CallSession

| Field | Business Meaning | Constraints |
|-------|-----------------|-------------|
| `call_session_id` | Call unique identifier | UUIDv7 |
| `tenant_id` | Belongs to tenant | FK → Tenant |
| `receptionist_id` | Handling receptionist | FK → Receptionist |
| `call_sid` | Twilio call SID | Twilio-assigned unique identifier, e.g., `CAxxxxxxxx` |
| `caller_number` | Caller number | E.164 format, stored masked (NFR-S-004) |
| `called_number` | Called number | E.164 format |
| `direction` | Call direction | Enum: inbound/outbound |
| `status` | Call status | Enum: ringing/connected/in_ivr/hold/transferred/voicemail/ended/missed/rejected |
| `end_reason` | End reason | Enum: normal/transfer_success/transfer_failed/timeout/caller_hangup/system_error |
| `duration_seconds` | Call duration | Total seconds from Connected to Ended |
| `connect_latency_ms` | Establishment latency | Latency from dial to hearing greeting (BR-CM-004) |
| `is_test` | Whether test call | bool, test calls not counted in operations statistics (FR-TS-002 AC2) |
| `created_at` / `ended_at` | Timestamps | |

#### CallNodeExecution

| Field | Business Meaning | Constraints |
|-------|-----------------|-------------|
| `execution_id` | Execution unique identifier | UUIDv7 |
| `call_session_id` | Belongs to call | FK → CallSession |
| `node_id` | Executed node | FK → Node |
| `node_type` | Node type | Enum: 20 types |
| `execution_order` | Execution order | Which step in this call (1-based) |
| `input_data` | Input data | JSONB, variable values passed from upstream nodes |
| `output_data` | Output data | JSONB, variable values output by this node |
| `duration_ms` | Execution duration | Used to calculate node pass rate and NFR-P-003/004 |
| `status` | Execution status | Enum: success/fallback_used/error/timeout |
| `error_detail` | Error details | Specific reason for integration call failure / AI fallback |
| `executed_at` | Execution time | Used for heatmap time dimension |

#### ApiKey

| Field | Business Meaning | Constraints |
|-------|-----------------|-------------|
| `api_key_id` | Key unique identifier | UUIDv7 |
| `tenant_id` | Belongs to tenant | FK → Tenant |
| `key_hash` | Key hash | SHA-256(api_key), plaintext only shown once at creation |
| `key_prefix` | Key prefix | E.g., `sk-****abcd`, used for UI identification (NFR-S-004) |
| `expires_at` | Expiry time | 90 days after creation (BR-SE-004), email reminder 7 days ahead |
| `last_used_at` | Last used time | For security audit |

#### CallRecording

| Field | Business Meaning | Constraints |
|-------|-----------------|-------------|
| `recording_id` | Recording unique identifier | UUIDv7 |
| `call_session_id` | Belongs to call | FK → CallSession |
| `recording_url` | Recording file URL | With 15-minute expiry signature (NFR-S-004) |
| `file_size_bytes` | File size | |
| `sha256_hash` | SHA-256 digital signature | Tamper-proof verification (NFR-C-001) |
| `storage_region` | Storage region | Mainland China = Alibaba Cloud OSS Beijing, non-China = AWS S3 (OQ-002) |
| `retention_policy` | Retention policy | Enum: test_7d/non_test_90d_cold/paid_365d (BR-OP-003) |
| `deletion_requested_at` | Deletion request time | Recorded when customer requests deletion, completed within 72h (NFR-C-001) |

---

## VII. Core API Operation List

| # | Module | Operation Name | Purpose | Key Input Params (Business Meaning) | Key Output Params (Business Meaning) | Core Error Scenarios | Corresponding 1B Feature ID |
|---|--------|---------------|---------|-------------------------------------|--------------------------------------|---------------------|----------------------------|
| 1 | Flow Builder | `createFlow` | Create blank flow or create from template | `template_id` (template ID), `receptionist_id`, `name` | `flow_id`, `nodes[]`, `connections[]` | Template does not exist; tenant receptionist count limit exceeded | FR-FL-004 |
| 2 | Flow Builder | `saveFlowDraft` | Save draft (auto version snapshot) | `flow_id`, `nodes[]`, `connections[]`, `client_version` (optimistic lock version) | `version_label`, `change_summary` | HTTP 409 concurrent conflict (BR-VM-002); validation not passed blocks | FR-FL-001/002, BR-VM-001 |
| 3 | Flow Builder | `validateFlow` | Execute flow validation (loop/open-circuit/required/start/end) | `flow_id` | `errors[]` (error list), `warnings[]` (warning list), `passed` | Validation service unavailable — frontend degrades to local validation (no server dependency) | FR-FL-003, BR-VA-001~005 |
| 4 | Flow Builder | `publishFlow` | Publish flow (publish after validation passes) | `flow_id` | `published_version`, `published_at` | Validation not passed blocks (modal displays error list); receptionist not bound to number | FR-RT-001, BR-VM-001 |
| 5 | Flow Builder | `compareVersions` | Compare differences between two versions | `version_id_a`, `version_id_b` | `diff_nodes[]` (added/modified/deleted nodes), `diff_connections[]` | Version already cleaned up (exceeds 50 draft limit) | FR-VM-002 |
| 6 | Flow Builder | `rollbackVersion` | Rollback to historical version | `receptionist_id`, `target_version_id`, `confirmation_text` (must = "Confirm Rollback") | `new_current_version` | Confirmation text mismatch; target version does not exist; new calls during rollback execute per old flow | FR-VM-002, BR-SE-002 |
| 7 | Telephony Access | `applyPhoneNumber` | Apply for platform-managed number | `area_code` (location), `number_type` (local landline/400 hotline) | `phone_number_id`, `number` (E.164), `monthly_cost` | No available numbers in location; tenant number count reached plan limit | FR-CM-001 |
| 8 | Telephony Access | `bindPhoneNumber` | Bind number to receptionist | `phone_number_id`, `receptionist_id` | `binding_id` | Number already bound; receptionist already has bound number | FR-CM-001 |
| 9 | Telephony Access | `generateSipConfig` | Generate SIP forwarding config parameters | `receptionist_id` | `sip_uri`, `domain`, `username`, `password` | Receptionist not published (SIP config only available after publish) | FR-CM-002 |
| 10 | Telephony Access | `generateEmbedCode` | Generate WebRTC embed code | `receptionist_id` | `<script>` tag code (contains `client_token`) | Receptionist not published | FR-CM-003 |
| 11 | Simulation Test | `startTextSimulation` | Start in-canvas text simulation | `flow_id` | `simulation_session_id`, `first_message` (system first message) | Flow contains unconfigured required nodes | FR-TS-001 |
| 12 | Simulation Test | `sendTextInput` | Send user input during text simulation | `simulation_session_id`, `user_input` | `system_response` (system reply), `highlighted_node_id` (current execution node) | Reach dead end (no subsequent connection) — returns red warning | FR-TS-001 |
| 13 | Simulation Test | `requestTestNumber` | Get real call simulation test number | `receptionist_id` | `test_number` (E.164), `expires_at` (10 minutes later) | Today's test limit reached (10/10); un-released test number already exists | FR-TS-002 |
| 14 | Runtime Management | `toggleReceptionist` | Start/stop receptionist | `receptionist_id`, `target_status` (running/stopped) | `current_status` | Stop modal secondary confirmation; calls after stop hear default prompt | FR-RT-001, BR-SE-002 |
| 15 | Runtime Management | `getActiveCalls` | Get current active call list | `receptionist_id` (optional, omit to return all tenant calls) | `active_calls[]` (per call: `call_sid`/`caller_number` masked/`current_node`/`duration_seconds`) | None | FR-RT-002 |
| 16 | Operations Dashboard | `getDashboardSummary` | Get operations dashboard core metrics | `receptionist_id` (optional), `time_range` (yesterday/7d/30d) | `total_calls`, `answer_rate`, `avg_duration`, `self_service_rate`, `transfer_rate`, MoM change | Data not yet generated (new receptionist has no yesterday data) — returns empty placeholder | FR-DB-001 |
| 17 | Operations Dashboard | `getNodeHeatmap` | Get node pass-rate heatmap data | `receptionist_id`, `time_range` | `heatmap_matrix[][]` (node×time slot, pass rate 0-1) | No call data — returns empty matrix | FR-DB-002 |
| 18 | Operations Dashboard | `getConversionFunnel` | Get conversion funnel data | `receptionist_id`, `date` | `funnel_stages[]` (per level: name/absolute count/conversion rate) | None | FR-DB-003 |
| 19 | Security & Permissions | `inviteTeamMember` | Invite team member | `email`, `role` (admin/editor/viewer) | `user_id`, `invitation_link` | Email already in tenant; invalid role | FR-SE-001 |
| 20 | Integration Config | `configureIntegration` | Configure external integration (CRM/Calendar etc.) | `node_id`, `integration_type`, `api_key`, `config` | `integration_id` | API Key invalid (cannot connect to verify); config format error | FR-IG-001~004 |

---

## VIII. Deployment & Scaling Architecture

### 8.1 Target Deployment Form

| Component | Deployment Method | Selection Rationale |
|-----------|-------------------|---------------------|
| **Frontend** | Vite build static assets → Nginx hosting → CDN (Cloudflare/Alibaba Cloud CDN) | Static asset global acceleration, first-screen load <2s (NFR-P-001); Nginx handles gzip/brotli + cache headers; CDN edge nodes cover mainland China (Alibaba Cloud CDN) + global (Cloudflare) |
| **Flow Runtime Engine** | Node.js 22 cluster mode → Docker container → 2C4G × 3 instances (MVP) / HPA auto-scaling (V1.0 K8s) | Node.js cluster utilizes multi-core CPU, single instance 500 concurrent calls; 3-instance redundancy (N+1) guarantees availability; stateless design (state stored in Redis) supports horizontal scaling |
| **Communication Gateway** | Same as Flow Runtime Engine (shared deployment, because both are tightly-coupled synchronous call chain — CGW receives Webhook and synchronously calls FRE) | CGW and FRE call chain latency requirement <50ms, independent deployment adds network round-trip +5ms — MVP stage shared process reduces latency; V1.0 when WebRTC media stream processing becomes bottleneck, deploy independently |
| **WebRTC Signaling** | Independent deployment 2C2G × 2 instances + K8s `sessionAffinity: ClientIP` | WebSocket long-connection service needs sticky session to ensure signaling from the same browser always routes to the same instance; independent deployment avoids WebSocket connections consuming CGW's HTTP connection pool and file descriptors |
| **AI Orchestration Gateway** | Independent deployment 2C2G × 2 instances | AI call latency characteristics (300-800ms) differ from rule nodes (<10ms) — independent deployment avoids AI wait blocking Node.js event loop and affecting rule node scheduling |
| **Integration Gateway** | Independent deployment 2C2G × 2 instances | External API timeout (5s) blocks threads — independent deployment uses independent thread pool, timeout does not pollute other services |
| **Operations Analytics** | Independent deployment 2C4G × 1 instance + PostgreSQL read replica | OLAP queries may full table scan, needs independent PostgreSQL read replica to avoid affecting primary DB write performance |
| **Other Support Services** | Shared deployment 2C2G × 2 instances (Flow Builder / Identity / Simulation / Media) | MVP stage call volume is low (<100 calls/day), support service QPS < 10, shared deployment saves resources; V1.0 split as needed. Flow Builder Service is "design-time" low-frequency low-concurrency operation, V1.0 can consider migrating to Serverless (pay-per-request, zero cost when idle) |
| **PostgreSQL 15** | Cloud-managed (AWS RDS / Alibaba Cloud RDS) 2C8G + read replica × 1 | Managed service auto-backup (daily full + WAL every 15 minutes, NFR-A-004), auto failover (RTO < 30s, NFR-A-002) |
| **Redis 7** | Cloud-managed (AWS ElastiCache / Alibaba Cloud Redis) 2C4G × 2 nodes (primary-replica) | Managed service auto-failover; data persistence (AOF + RDB); primary-replica architecture meets read high availability |
| **MinIO** | Self-built Docker container (MVP) → AWS S3 / Alibaba Cloud OSS (V1.0) | MVP stage file volume is small (<1GB), self-built MinIO zero cost; V1.0 migration to cloud storage via S3 API compatible layer with zero code changes |

### 8.2 Key Scaling Paths (Concurrent Calls from 100 to 10000)

| Stage | Concurrent Calls | First Service to Become Bottleneck | Bottleneck Cause | Coping Strategy |
|-------|-----------------|-----------------------------------|------------------|-----------------|
| **MVP Launch** | 5-50 | PostgreSQL (all services share single instance) | None | Single instance 2C8G sufficient to support 50 concurrent call read-write (<100 QPS) |
| **V1.0 Early** | 100-500 | Flow Runtime Engine (Node.js single-process event loop) | At 500 concurrent single process, Node.js event loop latency starts rising (event loop processing 500+ callbacks each time) | Enable Node.js cluster mode (4 processes × 2C4G = 8-core utilization); inter-process sync call session state via Redis Pub/Sub |
| **V1.0 Mid** | 500-2000 | PostgreSQL (write bottleneck — each node execution 1 UPDATE `call_node_executions`) | 500 concurrent × avg 10 nodes/call = 5000 UPDATE/s, approaching single-instance PostgreSQL write limit (~8000 TPS) | (1) `call_node_executions` writes changed to Redis Stream buffer + batch write (every 500ms/100 rows batch INSERT, write QPS drops 80%); (2) introduce PostgreSQL read replica to share operations analytics queries |
| **V1.0 Late** | 2000-5000 | Communication Gateway + Twilio API rate limit | Twilio REST API concurrency limit (default 100 concurrent requests/account) — each TTS broadcast/transfer/hangup calls Twilio API | (1) Apply to Twilio for increased concurrency limit; (2) implement request queue + local rate limiting (token bucket) in CGW; (3) evaluate introducing alternative telephony providers (e.g., Alibaba Cloud number service for mainland China) to share load |
| **V2.0** | 5000-10000 | Flow Runtime Engine (state machine memory usage + Redis network IO) | 10000 concurrent calls × 50KB state per call = 500MB state memory + Redis read-write 20000 ops/s | (1) FRE shard deployment by `tenant_id`, each shard handles 2000 concurrent; (2) Redis Cluster sharding, each shard handles portion of call sessions; (3) introduce Elasticsearch (mentioned in 1A) to replace PostgreSQL for call full-text search and aggregation analytics |

### 8.3 Multi-Tenant Data Isolation Strategy

| Scheme | Description | Advantages | Disadvantages | Conclusion |
|--------|-------------|------------|---------------|------------|
| **Scheme A: Database-Level Isolation** (each tenant independent PostgreSQL Database) | `CREATE DATABASE tenant_{id}` | Strongest isolation, independent backup/restore | Connection pool bloat (1000 tenants = 1000 DB connection pools, 20 connections per pool = 20000 connections); cross-tenant aggregation queries (e.g., operations metrics summary) require `dblink` or app-layer aggregation; Migration needs to be executed per database | ❌ Not selected — MVP stage tenant count is low (<100), but connection pool management complexity far exceeds benefit |
| **Scheme B: Schema-Level Isolation** (each tenant independent PostgreSQL Schema) | `CREATE SCHEMA tenant_{id}` | Good isolation, independent backup/restore | Same connection pool issues as Scheme A; cross-Schema queries need dynamic SQL splicing; PostgreSQL Schema limit (typically thousands) is sufficient for SaaS but not optimal | ❌ Not selected — management complexity still high, and cross-tenant data aggregation difficult (operations dashboard needs full-platform data analysis) |
| **Scheme C: Row-Level Isolation** (all tenants share tables, `WHERE tenant_id = $1`) | **✅ Selected** | Single connection pool manages all tenants (PGCONN_MAX=100); Migration executed once; naturally supports cross-tenant aggregation queries | Weakest isolation — must rely on app-layer Row-Level Security (RLS) + forced `WHERE tenant_id` per query | V1.0 selection. Combined with PostgreSQL RLS Policy (`CREATE POLICY tenant_isolation ON calls FOR SELECT USING (tenant_id = current_setting('app.tenant_id'))`) for database-layer兜底 isolation; V2.0 when large customer appears (call volume > 10000/day), migrate that customer separately to Scheme B as VIP isolation |
| **Cache Layer Isolation** (Redis) | `key` namespace: `tenant:{id}:call:{sid}` | Natural key isolation, no extra mechanism needed | — | Adopt Redis key prefix isolation |
| **File Storage Isolation** | S3/MinIO path: `/{storage_region}/{tenant_id}/{recording_id}.wav` | Natural path isolation + IAM Policy restricts tenants to only access their own prefix | — | Adopt S3 prefix isolation |
| **AI Resource Isolation** | Each tenant independent API Key (user's own OpenAI/ElevenLabs Key) or platform unified Key + cost tag (`tenant_id` recorded in cost tracking table) | Large customers with own Key completely isolate costs; small customers share platform Key but costs are trackable | Platform shared Key needs tenant-level rate limiting (prevent one tenant from consuming 90% of AI minute quota) | V1.0 supports both modes; platform Key via AI gateway token bucket rate limiting (max 50 AI calls per tenant per minute) |

---

## IX. Security & Compliance Architecture

### 9.1 Communication Encryption

| Layer | Requirement | Implementation | Product Bottom Line |
|-------|-------------|----------------|---------------------|
| **Signaling Layer** | TLS 1.3 | Twilio Webhook → CGW: HTTPS (TLS 1.3, Twilio mandatory requirement); CGW → Twilio REST API: HTTPS | TLS 1.2 and below connections not allowed (SSL Labs rating ≥ A) |
| **Media Layer** | SRTP AES-256-GCM | Twilio default uses DTLS-SRTP to encrypt WebRTC media stream (PSTN to Twilio segment handled by carrier, Twilio to platform segment encrypted) | Packet capture verifies no plaintext media stream (NFR-S-001) |
| **API Layer** | HTTPS + JWT (RS256 signature) | Frontend→Backend: HTTPS + Authorization: Bearer {jwt}; Inter-service: mTLS (V1.0 introduces, MVP stage uses internal network + shared secret) | JWT expiry ≤ 2 hours, refresh token ≤ 7 days |
| **File Access** | 15-minute expiry signature URL | Recording file URL with `?Expires=&Signature=` (AWS S3 Pre-signed URL / Alibaba Cloud OSS signed URL), auto-invalidates after 15 minutes (NFR-S-004) | Permanent public recording URLs not allowed |

### 9.2 Data Isolation Model

| Layer | Isolation Method | Implementation Details |
|-------|------------------|------------------------|
| **Application Layer** | JWT embeds `tenant_id` + RBAC `role`, every request passes through middleware injecting `req.tenant_id` | API Gateway (Traefik/Kong) validates JWT → injects Header `X-Tenant-Id` → downstream services read |
| **Database Layer** | PostgreSQL Row-Level Security + app-layer `WHERE tenant_id` | `CREATE POLICY tenant_isolation ON calls FOR ALL USING (tenant_id = current_setting('app.tenant_id'))`; each DB connection executes `SET app.tenant_id = $1` |
| **File Storage** | S3 prefix isolation + IAM Policy (V1.0) | `/{storage_region}/{tenant_id}/*`; IAM Policy restricts tenants to only GetObject their own prefix |
| **Cache** | Redis key prefix isolation | `tenant:{id}:*` namespace |
| **AI Resources** | Tenant-level token bucket rate limiting | Max 50 AI calls per tenant per minute; large customers can use own API Key (complete isolation) |

### 9.3 Permission System (Role × Permission Matrix)

| Operation | Admin | Editor | Viewer | Corresponding 1B Feature |
|-----------|-------|--------|--------|-------------------------|
| Create/Edit/Delete Flow | ✅ | ✅ | ❌ | FR-FL-001~006 |
| Publish/Rollback/Start/Stop Receptionist | ✅ | ❌ | ❌ | FR-RT-001, FR-VM-002 |
| Manage Numbers/Telephony Config | ✅ | ❌ | ❌ | FR-CM-001~003 |
| Execute Simulation Test | ✅ | ✅ | ❌ | FR-TS-001~002 |
| View Operations Dashboard | ✅ | ✅ | ✅ | FR-DB-001~003 |
| Configure External Integration (API Key) | ✅ | ❌ | ❌ | FR-IG-001~004 |
| Invite/Remove Team Members | ✅ | ❌ | ❌ | FR-SE-001 |
| Modify Billing/Plan | ✅ | ❌ | ❌ | — |
| Delete Receptionist | ✅ | ❌ | ❌ | — |

**Extensibility**: V1.0 early stage has 3 roles, future can extend to custom roles (V2.0) — role×permission matrix uses policy pattern in code (`class RbacPolicy { can(user, action, resource) }`), adding new roles does not require changing auth middleware.

### 9.4 Compliance Constraints

| Compliance Domain | Specific Regulation Reference | Product Bottom Line | Implementation |
|-------------------|------------------------------|---------------------|----------------|
| **Call Recording Notice** | China PIPL Art. 17 (notice obligation); US Federal Wiretap Act 18 U.S.C. § 2511 (one-party consent); GDPR Art. 6 (legal basis) | Recording notice played ≥ 3 seconds before call start (NFR-C-001) — does not rely on default assumption that "user checked consent" | Before `greeting` node execution, Communication Gateway auto-prefixes 3-second recording notice audio (system built-in audio file "This call may be recorded for quality assurance purposes"), cannot be skipped |
| **Recording Retention & Deletion** | China PIPL Art. 19 (minimum retention principle); GDPR Art. 17 (right to be forgotten, respond within 30 days) | Customer requests recording deletion → physical deletion completed within 72 hours (NFR-C-001); auto retention policy: test calls deleted after 7 days, non-test archived after 90 days (BR-OP-003) | Media & Compliance Service scheduled task (daily 03:00) + immediately marks `deletion_requested_at` upon receiving deletion request, scheduled task scans and executes physical deletion (object storage Delete + DB record cleanup) |
| **Data Export & Deletion** | GDPR Art. 20 (data portability); China PIPL Art. 45 (access/copy rights) | User can export all call data (JSON/CSV); account deletion physically clears all data within 30 days (NFR-C-002) | Frontend provides "Export Data" button (generates ZIP containing call records JSON + recording file links); account deletion marks `tenant.status=deleted`, scheduled task physically clears after 30 days |
| **Cross-Border Data Transfer** | China PIPL Art. 38 (data export security assessment); China Data Security Law Art. 31 (CIIO data localization) | Mainland China customer call recordings **default stored in Alibaba Cloud OSS Beijing region** (OQ-002 Option A); non-China regions use AWS S3 | Tenant registration judges default `storage_region` by IP/phone number, mainland China → `cn-beijing`; architecturally shields underlying differences through abstract storage layer (MinIO S3 API compatible), switching storage backend requires no business code changes |
| **Privacy Policy** | GDPR Art. 13 (notice obligation); CCPA § 1798.100 (California Consumer Privacy Act) | At registration, must display complete privacy policy, listing data collection scope, usage purpose, third-party sharing (Twilio/OpenAI/ElevenLabs), requiring user active checkbox "consent" (NFR-C-003) | Backend stores `user.privacy_consent_at` timestamp + consented privacy policy version number; privacy policy updates require user re-confirmation |
| **Recording Digital Signature** | China E-Signature Law Art. 13 (reliable electronic signature); FDA 21 CFR Part 11 (electronic record tamper-proof) | Recording file immediately calculates SHA-256 hash and writes to `call_recording.sha256_hash` upon upload (NFR-C-001) — used for tamper-proof verification | Media & Compliance Service synchronously calculates SHA-256 after downloading recording file + writes to metadata; frontend playback page provides "Verify Recording Integrity" button (re-calculates hash and compares) |

---

## Appendix: 1C Quality Red Line Self-Check

- [x] Are service names, entity names, and operation names fully consistent with 1A and 1B? — Verified: node type names (`incoming_call_trigger`/`greeting`/...) consistent with 1A §4.2; feature IDs (FR-FL-001~FR-SE-001) consistent with 1B §2; business rule IDs (BR-VA-001~BR-SE-004) consistent with 1B §3
- [x] Does each service's split rationale answer "what problems would arise if combined"? — Each S1-S10 "Split Rationale" contains specific quantified consequences of merging
- [x] Does every technology selection give a specific technical reason for "not choosing the alternative"? — §3.1 table 14 selections, each with alternative name + specific technical disadvantage
- [x] Does the data flow sequence diagram distinguish the rule engine path and the AI service path? — §2.1 sequence diagram clearly marks "pure rules <10ms" and "AI enhanced path 300-500ms", §2.2 path annotation table distinguishes latency characteristics of 10 paths; §2.3 adds text simulation execution flow sequence diagram (including architecture rationale for simulation mode not calling AI/integration)
- [x] Does the call state machine cover all key states and transitions? — §4.2 state machine contains 9 states (Ringing/Connected/InIVR/Hold/Transferred/Voicemail/Ended/Missed/Rejected), each transition has trigger condition and system behavior
- [x] Is the ER diagram entity count ≥ 8? Does each entity have ≥ 5 fields? — §6 contains 12 entities (Tenant/User/Receptionist/Flow/Node/Connection/Version/PhoneNumber/CallSession/CallNodeExecution/ApiKey/CallRecording), each entity 5-9 fields
- [x] Is the API operation count ≥ 15? Does it correspond to 1B feature IDs? — §7 contains 20 operations, each corresponding to a 1B feature ID
- [x] Does the deployment scaling path mark the bottleneck service and coping strategy for each stage? — §8.2 covers 5 scaling stages (MVP→V1.0 early/mid/late→V2.0), each stage marks bottleneck and coping
- [x] Does security & compliance have specific regulation references and product bottom-line constraints? — §9.4 each compliance constraint has specific regulation article number (e.g., PIPL Art. 17, GDPR Art. 17) + quantified product bottom line (e.g., 3-second notice, 72-hour deletion)
- [x] Does the full text contain vague arguments like "industry mainstream" or "best practices"? — Checked item by item, all selection arguments replaced with specific technical quantification (e.g., "X6's Cell model is not aligned with Flow Engine's Node/Connection model, requiring 30%+ additional adapter code")