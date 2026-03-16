# LifeOS AI Architecture Redesign — Task Tracker

## Master Plan
- [x] Deep codebase exploration (entities, services, repos, events, migrations)
- [x] Write comprehensive 3-layer architecture redesign plan
- [x] Integrate Supermemory graph ideologies (memory-as-nodes, version chains, auto-forget)
- [x] Get user review & approval on final plan
- [x] Execute Phase 1: RAG Knowledge Layer (DocumentChunker, EmbeddingService.embedChunkedDocument, AiFoundationProperties.Chunking, V29 migration)
- [x] Execute Phase 2: Persistent Memory Graph (ConversationMemory graph fields, MemoryGraphService, MemoryLifecycleService, MemoryRelationship V31 constraint, V30 migration)
- [x] Execute Phase 3: Structured App Data Layer (NOTES intent + appendNotesSnapshot, QueryIntentClassifier JOURNAL/NOTES/AI)
- [x] Execute Phase 4: Context Assembly Redesign (PromptAssemblyService 3-layer, MemoryRetrievalStrategyService limits 120→60/50→30)
- [x] Execute Phase 5: Pipeline future-proofing (IngestionPipeline facade, NoteService wired, EmbeddingTextBuilder journal/document/saved_link)
- [x] Execute Phase 6: Memory Graph API (MemoryGraphController GET /nodes + /edges, MemoryRelationshipRepository.findByUserUid)
