# Data model (draft)

A sketch of the data the charter platform stores, independent of the backend. Names and types are provisional. A relational store such as Postgres (for example via Supabase) is assumed, but the model does not depend on it.

## Design principles

1. **Raw input and derived results are separate.** Participants produce contributions: proposals, test cases and judgements. Interpretations, clusters, support scores and statuses are *outputs* of an aggregation procedure, never stored as input.
2. **Aggregation is pluggable.** Every derived result names the method, parameters, scope and input snapshot that produced it. Several methods can run on the same data side by side, so their outcomes can be compared.
3. **Text is versioned.** Proposals are anchored to an immutable charter version, so an amendment cannot silently shift the target of earlier proposals.
4. **Results are reproducible.** Given a run's inputs and method version, its outputs can be recomputed.
5. **Personal data is kept to a minimum.** Demographics are optional, stored apart from contributions, and only read by aggregation jobs.

## Entities

### Structure

| Entity | Key fields | Notes |
|---|---|---|
| `space` | id, name, access (`open` \| `invite`), parent_space_id | A community's charter space. `parent_space_id` records forks, for example from the Apertus Charter. |
| `membership` | user_id, space_id, role | Roles such as member, panel or admin. Panel membership can come from sortition. |
| `charter_version` | id, space_id, label, parent_version_id, created_at | Immutable once published. |
| `clause` | id, charter_version_id, article, number, text | For example article 4, clause 4.3. |

### Contributions (raw input)

| Entity | Key fields | Notes |
|---|---|---|
| `proposal` | id, clause_id, author_id, op (`replace` \| `insert` \| `delete`), anchor, new_text, rationale | `anchor` = {quote, start, end} within the clause text. |
| `test_case` | id, proposal_id?, author_id, prompt, must, must_not, origin (`human` \| `llm`) | Can stand alone or belong to a proposal. LLM-drafted cases need human confirmation. |
| `judgement` | id, user_id, target_type, target_id, kind, value, created_at | Generic input: `kind` ∈ {vote, rating, pairwise, points, …} with a `value` (JSON) whose shape depends on the kind. Uniqueness is enforced per (user, target, kind). |
| `profile` | user_id, demographics (JSON), consent | Optional and access-restricted. Used for reweighting and sampling. |

Keeping `judgement` generic lets new input formats (for example A/B ratings of model answers, or priority budgets) be added without schema changes.

### Derived (aggregation output)

| Entity | Key fields | Notes |
|---|---|---|
| `aggregation_run` | id, method, method_version, params (JSON), scope, input_snapshot, created_at | `scope` = {level, space_id?, group_id?}; see below. |
| `group` | id, run_id?, kind (`declared` \| `emergent`), label, size | *Declared*: a community or other self-identified group. *Emergent*: a cluster or interpretation inferred by a run. |
| `group_member` | group_id, user_id, weight | Weights support reweighting and probabilities from sortition. |
| `score` | run_id, target_type, target_id, group_id?, value, status | For example support for a proposal within one group, a bridging score, or a status label (broad, contested, weak). |
| `decision` | run_id, target_id, outcome, decided_by | Outcomes ratified by the recruited track. |

## Aggregation levels

The same contributions can be aggregated at different levels. Each level is a run scope, not a separate schema.

| Level | Unit aggregated over | Example question |
|---|---|---|
| Within an interpretation | members of one emergent group | Which wording do people who share this reading prefer? |
| Within a community | members of one declared group or space | What does hospital staff support overall? |
| Across groups | all groups in a space | Which proposals find support across viewpoints? |
| Across spaces | several communities | Which test cases belong to a shared safety floor? |

Candidate methods include simple majority, bridging-based ranking (as in Community Notes), opinion clustering (as in Polis), quadratic or budgeted voting, Method of Equal Shares for choosing a bundle, and sortition-weighted preference aggregation. Since each run records its method, a single interface can show the same proposal under different aggregation rules.

## Mapping to the current prototype

| Prototype (`index.html`) | Model |
|---|---|
| `GROUPS.r` (readings) | `group` with kind `emergent` |
| `GROUPS.c` (communities) | `group` with kind `declared` |
| `HOTS[k].edits[i]` | `proposal` (+ `test_case` for prompt, now and then) |
| `edit.sup[]` | `score` per (run, proposal, group) |
| `status()` (broad, contested, partial) | `score.status`, computed by a run rather than in the browser |

## Open questions

- **Granularity of anchors:** spans of characters within a clause, or whole-clause proposals only?
- **Stability of groups:** emergent groups change with every run. Should a run inherit labels and colours from the previous one so the overlay stays readable?
- **Proposals that interact:** how should overlapping or mutually exclusive edits to the same span be represented, as a set of alternatives or as dependencies?
- **Snapshots:** should `input_snapshot` be a timestamp cutoff or an explicit list of contribution IDs?
- **Model evaluation:** should model answers and their grading against test cases (the before/after scorecard) live here or in a separate evaluation store?
