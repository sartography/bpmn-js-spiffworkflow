# Bug Repro: CorrelationKey ID Churn on Message Editor Save

## Summary

Opening the Message Editor modal on a message boundary event, saving without
any changes, and then saving the BPMN file causes the `bpmn:CorrelationKey`
`id` attribute to change to a new random value (e.g. `CorrelationKey_main` →
`CorrelationKey_1ory5dq`). This creates noise in version-controlled process
model repositories.

## Environment

- spiff-arena with `bpmn-js-spiffworkflow` loaded as a local symlink
- A BPMN file that has `bpmn:correlationKey` as a **direct child of
  `bpmn:Definitions`** (i.e. **no** `bpmn:Collaboration` element)

## Repro Steps

1. Boot spiff-arena locally (e.g. `run-spiff-arena`).  Make sure the frontend
   is using the local `~/bpmn-js-spiffworkflow` by running
   `use_local_bpmn_js_spiffworkflow` first.

2. Navigate to a BPMN file that contains a message boundary event and a
   `bpmn:correlationKey` directly under `bpmn:Definitions` (no
   `bpmn:Collaboration`).  Example:

   ```
   http://localhost:7001/process-models/order:order-survey:order-survey/files/order-survey.bpmn
   ```

   Sign in with `admin / admin`.

3. Note the current `id` of the `<bpmn:correlationKey>` element in the XML on
   disk, e.g.:

   ```xml
   <bpmn:correlationKey id="CorrelationKey_main" name="MainCorrelationKey">
   ```

4. Click the **message boundary event** (the circle with an envelope icon) on
   the "Survey Received" task to select it.

5. In the properties panel on the right, click the **Message** group header to
   expand it (if not already expanded).

6. Click **"Open message editor"**.

7. In the Message Editor dialog, click **Save** without making any changes.

8. Click **"Close (this does not save)"**.

9. Click the **Save** button in the BPMN editor toolbar.

10. Inspect the BPMN file on disk:

    ```bash
    grep CorrelationKey ~/civitos-process-models/order/order-survey/order-survey/order-survey.bpmn
    ```

### Expected result

The `id` attribute is **unchanged**: `id="CorrelationKey_main"`.

### Actual result (before fix)

The `id` attribute changed to a new random value: `id="CorrelationKey_1ory5dq"`.

## Root Cause

`setParentCorrelationKeys` in `MessageHelpers.js` called
`findOrCreateMainCorrelationKey` **unconditionally**, before checking whether a
`bpmn:Collaboration` element exists.  `findOrCreateMainCorrelationKey`
generates a fresh random ID whenever it cannot locate an existing key.

For BPMNs that have `bpmn:correlationKey` as a direct child of
`bpmn:Definitions` (no collaboration), bpmn-moddle silently drops those
elements, so the search never finds the existing key and always creates a new
one.

## Fix

`setParentCorrelationKeys` now guards the call to
`findOrCreateMainCorrelationKey` inside the `if (collaboration)` block.  When
no collaboration is present the function returns immediately without touching
any root elements.  Additionally, `findOrCreateMainCorrelationKey` was updated
to search `collaboration.correlationKeys` first (before `rootElements`) so
that it correctly finds the key when a collaboration does exist.

Committed on the `fix-correlation-key-churn` branch of
`bpmn-js-spiffworkflow`.
