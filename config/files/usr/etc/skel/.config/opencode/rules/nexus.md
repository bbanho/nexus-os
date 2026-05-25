---
alwaysApply: true
---

When starting any implementation, bugfix, or architectural design in the intraclinica-ng codebase — you MUST query the NEXUS Bipartite Cross-Reference System to prevent semantic drift.

## The Iron Law

* **NEVER** use brute-force `grep`, `rg`, `find` loops, or manual file reads to learn or understand the codebase patterns. Doing so causes semantic drift and exhausts your context budget.
* Standard `grep` only sees raw files (L0) and misses the L1 Abstraction layer, topological mappings, and structural invariants managed by NEXUS.

## Engagement Protocol

1. **Topography Discovery**:
   Always execute `nexus_repomap(format="text")` to map the physical layout and structural dependencies of the codebase before proposing any file changes.

2. **Semantic Context Grounding**:
   Call the `nexus_query` tool (from the `nexus` MCP server connected via SSE to `http://localhost:7474/sse`) with natural language questions to obtain precise Grounding Packs:
   ```json
   // Example query format:
   nexus_query(
     query="como o sistema gerencia o estado e signals no modulo de agendamento",
     zoom_in=true,
     hyde=false
   )
   ```
3. **No Code Without Grounding**:
   Your architecture specs and files to modify MUST match existing patterns returned by `nexus_query`. Cite target paths discovered via NEXUS in your execution plans.