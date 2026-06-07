# Graph Report - .  (2026-06-07)

## Corpus Check
- 98 files · ~26,385 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 673 nodes · 1329 edges · 20 communities (19 shown, 1 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]

## God Nodes (most connected - your core abstractions)
1. `JwtPayload` - 84 edges
2. `PrismaService` - 53 edges
3. `EnrichmentService` - 19 edges
4. `ProposalsService` - 19 edges
5. `ResearchService` - 18 edges
6. `JwtAuthGuard` - 17 edges
7. `PaginationDto` - 15 edges
8. `ProspectsService` - 15 edges
9. `ServicesService` - 15 edges
10. `CurrentUser` - 14 edges

## Surprising Connections (you probably didn't know these)
- `ClientFiltersDto` --inherits--> `PaginationDto`  [EXTRACTED]
  apps/api/src/modules/clients/clients.controller.ts → apps/api/src/common/dto/pagination.dto.ts
- `FilterDealsDto` --inherits--> `PaginationDto`  [EXTRACTED]
  apps/api/src/modules/deals/dto/filter-deals.dto.ts → apps/api/src/common/dto/pagination.dto.ts
- `FilterProspectsDto` --inherits--> `PaginationDto`  [EXTRACTED]
  apps/api/src/modules/prospects/dto/filter-prospects.dto.ts → apps/api/src/common/dto/pagination.dto.ts
- `ServiceFiltersDto` --inherits--> `PaginationDto`  [EXTRACTED]
  apps/api/src/modules/services/services.controller.ts → apps/api/src/common/dto/pagination.dto.ts
- `Sidebar()` --calls--> `getStoredToken()`  [EXTRACTED]
  src/erp/ERPPrototype.tsx → src/api/inspyra.ts

## Import Cycles
- None detected.

## Communities (20 total, 1 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.02
Nodes (54): ACTIVITY, AGENTS, AI_STATE_COLOR, AI_STATE_LABEL, AI_STATE_TONE, BOTS, CAMP_DATA, CHANNELS (+46 more)

### Community 1 - "Community 1"
Cohesion: 0.08
Nodes (24): PROSPECT, CATALOG_ITEM, PrismaService, AllExceptionsFilter, humanToken(), jwt, serviceToken(), createMockPrisma() (+16 more)

### Community 2 - "Community 2"
Cohesion: 0.06
Nodes (20): AgentRoiController, AgentRoiModule, AgentRoiService, RoiField, AgentRunsController, EndRunDto, ErrorDto, StartRunDto (+12 more)

### Community 3 - "Community 3"
Cohesion: 0.07
Nodes (6): ClientsController, JwtPayload, OutreachController, ProspectValidationController, ProspectsController, ServicesController

### Community 4 - "Community 4"
Cohesion: 0.09
Nodes (13): CreateDeliverableDto, CreateServiceDto, CreateUserDto, buildMeta(), paginate(), PaginationDto, ServiceFiltersDto, ServicesModule (+5 more)

### Community 5 - "Community 5"
Cohesion: 0.06
Nodes (38): agentRoiApi, AgentRoiDashboard, AgentRoiRow, authApi, clearStoredToken(), CommercialProposalData, ContactChannel, DecisionFactors (+30 more)

### Community 6 - "Community 6"
Cohesion: 0.08
Nodes (7): CreateEnrichmentJobDto, ReviewEnrichmentDto, SuggestEnrichmentDto, AuthRequest, EnrichmentController, EnrichmentData, EnrichmentService

### Community 7 - "Community 7"
Cohesion: 0.07
Nodes (11): ProposalsController, CommercialProposalData, detectCommunicationLanguage(), detectIndustryProfile(), INDUSTRY_CONFIG, IndustryKey, LANGUAGE_LABELS, MARKET_CONFIG (+3 more)

### Community 8 - "Community 8"
Cohesion: 0.12
Nodes (8): DealsController, DealsModule, ACTIVE_STAGES, DealsService, STALL_DAYS, CreateDealDto, FilterDealsDto, MoveStageDto

### Community 9 - "Community 9"
Cohesion: 0.13
Nodes (7): AuthController, AuthModule, AuthService, LoginDto, RefreshTokenDto, RegisterDto, JwtStrategy

### Community 10 - "Community 10"
Cohesion: 0.11
Nodes (6): CreateResearchJobDto, AuthRequest, ResearchController, RawCompany, ResearchService, SonnetEvaluation

### Community 11 - "Community 11"
Cohesion: 0.17
Nodes (10): DatabaseModule, EnrichmentModule, HealthController, HealthModule, OutreachModule, PricingModule, ProposalsModule, ProspectValidationModule (+2 more)

### Community 12 - "Community 12"
Cohesion: 0.16
Nodes (4): CreateCatalogItemDto, ServiceCatalogController, ServiceCatalogModule, ServiceCatalogService

### Community 13 - "Community 13"
Cohesion: 0.21
Nodes (6): CreateProspectDto, FilterProspectsDto, UpdateProspectDto, ProspectsModule, ProspectsService, VALID_TRANSITIONS

### Community 14 - "Community 14"
Cohesion: 0.22
Nodes (5): ClientFiltersDto, ClientsModule, ClientsService, CreateClientDto, CreateContactDto

### Community 15 - "Community 15"
Cohesion: 0.20
Nodes (5): CreateValidationDto, ReviewValidationDto, calcOpportunityScore(), PRIORITY_WEIGHT, ProspectValidationService

### Community 16 - "Community 16"
Cohesion: 0.19
Nodes (5): ACTIVITY_STATES, CONTACTABLE_FROM, OutreachService, RESPOND_FROM, SCHEDULE_FROM

### Community 17 - "Community 17"
Cohesion: 0.40
Nodes (3): BUDGETS, ModelId, PRICING

### Community 18 - "Community 18"
Cohesion: 0.50
Nodes (4): getStoredToken(), ComercialTabs(), Prospects(), Sidebar()

## Knowledge Gaps
- **127 isolated node(s):** `PROSPECT`, `CATALOG_ITEM`, `jwt`, `AGENT_TOKEN`, `PRODUCTION_RULES` (+122 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What connects `PROSPECT`, `CATALOG_ITEM`, `jwt` to the rest of the system?**
  _127 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.015384615384615385 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.07506584723441616 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.061224489795918366 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.06938775510204082 - nodes in this community are weakly interconnected._
- **Should `Community 4` be split into smaller, more focused modules?**
  _Cohesion score 0.08865248226950355 - nodes in this community are weakly interconnected._
- **Should `Community 5` be split into smaller, more focused modules?**
  _Cohesion score 0.0553306342780027 - nodes in this community are weakly interconnected._