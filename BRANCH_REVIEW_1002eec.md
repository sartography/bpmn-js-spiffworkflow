# Branch review: `fix/message-authoring-lifecycle` @ `1002eec`

- Branch: `fix/message-authoring-lifecycle`
- Reviewed commit: `1002eec` ("Make message catalog edits reversible and preserve correlation identity")
- Base: `4019068` (`origin/main`)
- Spec: `~/onboarding/specs/active/message-authoring-feedback/` (`spec.md`, `branch-review-fix-message-authoring-lifecycle.md`, `review-resolution.md`)
- Validation done here: full Karma suite **89/89 SUCCESS** via
  `~/onboarding/specs/active/message-authoring-feedback/arena-compatibility.karma.cjs`
  (`CHROME_BIN=/opt/google/chrome/chrome node_modules/.bin/karma start <that file> --single-run`).
- Prior review (C1–C5 against `3ea599d`) is correctly addressed by `1002eec` as far as
  the tests cover: catalog save and message selection are now one `spiff.message.update`
  command with recorded changes + reverse-order revert, id-claim/unclaim is handled,
  retained-message property pruning and per-message binding cleanup work, dropdown
  resolves by BPMN id with API-name fallback, rename preserves identity via `bpmn_id`.
  No regressions found in those five areas.

The items below are what is still critical (silent wrong behavior, identity
corruption, or a save path that throws). Ordered by severity.

---

## H1 — `spiff.messages.save` never adds new properties to `MainCorrelationKey` (additions go stale)

Where: `app/spiffworkflow/messages/MessageInterceptor.js` (`syncMessagesToBpmn`, save handler
`eventBus.on('spiff.messages.save')`); contrast `setParentCorrelationKeys` in
`app/spiffworkflow/messages/MessageHelpers.js:731+`, called only from
`MessageSelect.jsx:117`.

What: the save path handles *removal* from keys (via `clearRemovedReferences` filtering
`key.correlationPropertyRef`), but nothing on the save path ever *adds* to a
`MainCorrelationKey` (collaboration `correlationKeys` or definitions-level
`correlationKeys`). `setParentCorrelationKeys` (which sets the key to
`correlationProperties.slice()`, i.e. "all properties") runs only on dropdown
select, not on catalog save.

Consequence: editing the catalog alone (add a new correlation property, recreate a
deleted message, add a second property to a retained message) creates the global
`bpmn:CorrelationProperty` + retrieval expression but leaves the key pointing at
the old set. If the user never re-selects the message afterwards (the normal Ed
catalog-edit flow), the saved XML has the property but the key does not group it —
stale routing/grouping at runtime, with no UI signal. Removals are correct, so the
bug is one-sided and easy to miss in tests that always follow a save with a select
(the "delete then recreate" lifecycle test does exactly that, which is why it passes).

Fix: inside the same `spiff.message.update` command on save, after the upsert loop,
reconcile the key the same way the select path does (all current correlation
properties), for both the collaboration key and the definitions-level key. Add a
lifecycle test that does *save only* (no select): add property `uid2` to retained
message B via `spiff.messages.save`, assert `MainCorrelationKey.correlationPropertyRef`
contains `uid2`, round-trip XML clean, undo restores.

## H2 — `MessageLaunchEditorButton` mutates `messageRef.id` outside the command stack, breaking the preserved identity

Where: `app/spiffworkflow/messages/propertiesPanel/elementLevelProvider/MessageLaunchEditorButton.js:30-56`,
wired live in `TaskEventMessageProvider.js:51` (every message task/event shows it).

What:

```js
if (messageRef && messageRef.name && messageRef.name !== messageId) {
  messageId = messageRef.name;   // sends the *name* when id != name
}
...
eventBus.once(listenEvent, (response) => {
  messageRef.id = response.value;  // direct mutation, no commandStack, no ids claim/unclaim
});
```

With this branch making `id != name` load-bearing (C4/C5), this button is now the
active saboteur: it addresses the message by name, then overwrites the stable BPMN
id in place. Direct `messageRef.id = ...` skips `moddle.ids.unclaim(old)` /
`claim(new)`, so the id index is corrupt (`assigned(old)` still hits, `assigned(new)`
misses), future creates with either id can duplicate/throw, `saveXML` can emit a
dangling reference, and undo cannot restore the old id. Retrieval expressions hold
the same object reference so they follow the rename silently — the corruption spreads
without a visible error.

Fix: route the response through `commandStack.execute('spiff.message.update', ...)`
with `set(messageRef, 'id', ...)` so `MessageUpdateHandler` maintains the id index and
undo, or (safer for now) stop overwriting `id` from the host response — update `name`
only and keep `id` stable, consistent with the `bpmn_id` rename contract. Add a test:
Arena-style message `id=B/name=Shared callback`, simulate the editor round-trip,
assert `id` still `B`, `moddle.ids.assigned('B')` intact, undo restores.

## M1 — duplicate-identifier catalog save throws out of the event handler (whole save reverts, host sees an exception)

Where: `MessageInterceptor.js` upsert (`bpmnFactory.create('bpmn:Message', { id: msg.identifier })`)
+ `MessageUpdateHandler.set` (`moddle.ids.claim`, throws on duplicate).

What: if a save introduces an id that is already claimed (new message whose
identifier equals a live task/event/message/property id, or two new messages with the
same identifier in one save), `claim` throws inside `context.update`, the handler
reverts partial changes and rethrows out of `commandStack.execute`, i.e. out of the
`spiff.messages.save` event handler. Net effect: the *entire* catalog edit is discarded
(revert is correct — no half-written model) but the host gets an exception instead of
a usable error, so the Ed catalog edit appears to do nothing / breaks the save flow.
The old code silently created duplicate ids (invalid XML, worse); the new fail-closed
behavior is the right instinct but needs a boundary: pre-validate identifiers for
uniqueness (and against `moddle.ids.assigned`) before executing, or catch and surface a
host-readable error (`spiff.messages.save.failed`) instead of throwing through the bus.

Test: save with two new messages sharing one identifier (no `bpmn_id`), assert either a
clean rejection with the model unchanged or a defined dedup policy — not an escaping exception.

---

### Non-critical (recorded, not blocking)

- Untracked mutation inside the undoable save: `syncMessagesToBpmn` does
  `corrProp.correlationPropertyRetrievalExpression = []` directly for an existing
  property with a falsy expression list instead of `set(...)`. Undo then leaves `[]`
  where `undefined` was (same serialization today, but it breaks the "every mutation is
  recorded" invariant the handler depends on). Use `set`.
- `MessageUpdateHandler.execute` returns `elementRegistry.getAll()`: forces a full
  redraw on every catalog save/select. Fine for tests, potentially laggy on large Arena
  diagrams. Return the actually-touched elements if this ever shows up in profiling.
- `spiff.messages.save` assumes `messages` is an array (`updated.map`). A malformed
  payload throws through the bus (same M1 path). Guard with an early return.
- `retained` as a `Map` keyed by moddle element collapses duplicate `undefined` keys
  (multiple brand-new messages) — harmless today because the map is only consulted with
  real elements, but a plain lookup by `bpmn_id`/name would be less subtle.
- `LaunchJsonSchemaEditorButton` in `TaskEventMessageProvider.js` is dead code (defined,
  never added to `entries`). Either wire it or delete it before someone copies the
  `element.id === msgRef.id || element.name === msgRef.id` pattern.

### Suggested tests before merge

1. Save-only property addition updates `MainCorrelationKey` (no select in between), undo restores.
2. Editor-button round-trip on `id != name` preserves `id`, id index, and undo.
3. Duplicate-identifier save is rejected gracefully with the model unchanged (no escaping exception).

---

## Follow-up (2026-10-15): replicated and fixed

All three items reproduced as failing tests in `test/spec/MessagesLifecycleSpec.js`
(3 red, 89 green pre-fix). Corrections while replicating:

- **M1 mechanism:** `ids.claim()` does *not* throw on duplicates (it silently
  overwrites the index) and the serializer does not check them, so a bad save
  wrote duplicate BPMN ids that only failed on the next import — worse than the
  exception originally described. Separately, had the handler thrown, the failed
  action would skip `_executedAction` but leave a stale `_currentExecution`
  entry, so `elements.changed` would never fire again (frozen UI). Hence
  pre-validation (never execute a doomed payload) rather than try/catch.

Fixes (same branch, on top of `1002eec`):

- **H1:** extracted `reconcileMainCorrelationKey` in `MessageHelpers.js` (the exact
  former `setParentCorrelationKeys` body; select-path behavior unchanged) plus
  `syncCatalogCorrelationKeys`, called in the same `spiff.message.update` command
  after the save upsert loop. Save path creates the collaboration key only when at
  least one property exists, so a schema-only save invents no XML. Test: save-only
  `uid2` addition asserts key membership, XML round-trip, undo *and* redo.
- **H2:** `MessageLaunchEditorButton` no longer assigns `messageRef.id`; the host
  response updates `name` through `commandStack.execute('spiff.message.update')`
  (undoable, id index intact), with null/empty guards. `commandStack` is now passed
  through the `messageLaunchEditorButton` entry. Test: Arena-style `id=B` renamed
  via editor round-trip keeps `B`, `ids.assigned('B')` intact, undo restores.
- **M1:** `validateCatalogUpdate` in `MessageInterceptor.js` mirrors the removal
  rules (retained-match, expression pruning, recreate-after-delete id reuse) and
  rejects duplicate/missing identifiers or ids taken by survivors *before*
  executing, firing `spiff.messages.save.failed` with a reason and leaving the
  model untouched. Non-array payloads rejected the same way. The sibling vector on
  the select path (`MessageSelect.jsx` creating a message whose id is live) now
  aborts with a warning instead of duplicating. Also fixed the untracked
  `corrProp.correlationPropertyRetrievalExpression = []` direct assignment to use
  `set(...)`. Tests: duplicate-`DUP` save rejected with model byte-identical;
  select of an API identifier equal to a live task id is a no-op.

Validation: **93/93** Karma SUCCESS via the Arena-compatibility config
(89 pre-existing + 4 new), production build passes with only the pre-existing
bundle-size warnings.
