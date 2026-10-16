import CommandInterceptor from 'diagram-js/lib/command/CommandInterceptor';
import {
  getRoot,
  syncCatalogCorrelationKeys,
} from './MessageHelpers';
import MessageUpdateHandler from './MessageUpdateHandler';

function findCatalogMessage(definitions, message) {
  return definitions.rootElements.find(
    (root) =>
      root.$type === 'bpmn:Message' &&
      (message.bpmn_id
        ? root.id === message.bpmn_id
        : root.name === message.identifier)
  );
}

/**
 * Pre-validates a catalog save so `commandStack.execute` is never called with
 * a payload that would corrupt the model. Duplicate BPMN ids do not throw on
 * claim (the id index silently overwrites) and the serializer does not check
 * them either, so without this the save would write duplicate ids that fail
 * on the next import. Returns an error reason string, or null when valid.
 */
function validateCatalogUpdate(moddle, definitions, updated) {
  if (!Array.isArray(updated)) {
    return 'catalog messages must be an array';
  }
  const roots = definitions.rootElements || [];
  const retained = new Map(
    updated.map((message) => [
      roots.find(
        (root) =>
          root.$type === 'bpmn:Message' &&
          (message.bpmn_id
            ? root.id === message.bpmn_id
            : root.name === message.identifier)
      ),
      message,
    ])
  );
  const removedMsgIds = new Set();
  for (const el of roots) {
    if (el.$type === 'bpmn:Message' && !retained.has(el)) {
      removedMsgIds.add(el.id);
    }
  }
  // Mirror of the property-pruning rule in syncMessagesToBpmn: a property
  // survives when it keeps at least one retrieval expression or is still
  // referenced by the updated catalog.
  const propertySurvives = (property) => {
    for (const expression of property.correlationPropertyRetrievalExpression ?? []) {
      const message = expression.messageRef;
      if (!message) {
        continue;
      }
      if (removedMsgIds.has(message.id)) {
        continue;
      }
      const config = retained.get(message);
      if (
        config &&
        !(config.correlation_properties || []).some(
          (prop) => prop.identifier === property.id
        )
      ) {
        continue;
      }
      return true;
    }
    return updated.some((message) =>
      (message.correlation_properties || []).some(
        (prop) => prop.identifier === property.id
      )
    );
  };
  const removedPropertyIds = new Set(
    roots
      .filter(
        (el) =>
          el.$type === 'bpmn:CorrelationProperty' && !propertySurvives(el)
      )
      .map((el) => el.id)
  );
  const freedIds = new Set([...removedMsgIds, ...removedPropertyIds]);
  const isFreed = (id) => freedIds.has(id);
  const isTakenBySurvivor = (id) => {
    const assigned = moddle.ids.assigned(id);
    if (!assigned) {
      return false;
    }
    const assignedId = assigned === true ? id : assigned.id;
    return !isFreed(assignedId);
  };
  const newMessageIds = new Set();
  for (const message of updated) {
    if (typeof message.identifier !== 'string' || !message.identifier) {
      return 'catalog message is missing an identifier';
    }
    if (findCatalogMessage(definitions, message)) {
      continue;
    }
    if (newMessageIds.has(message.identifier)) {
      return `duplicate catalog message identifier <${message.identifier}>`;
    }
    newMessageIds.add(message.identifier);
    if (isTakenBySurvivor(message.identifier)) {
      return `catalog message identifier <${message.identifier}> is already in use`;
    }
  }
  for (const message of updated) {
    for (const property of message.correlation_properties ?? []) {
      if (typeof property.identifier !== 'string' || !property.identifier) {
        return 'catalog correlation property is missing an identifier';
      }
      const existing = roots.find(
        (el) =>
          el.$type === 'bpmn:CorrelationProperty' &&
          el.id === property.identifier
      );
      if (existing && !removedPropertyIds.has(existing.id)) {
        continue;
      }
      if (newMessageIds.has(property.identifier)) {
        return `duplicate catalog identifier <${property.identifier}>`;
      }
      if (isTakenBySurvivor(property.identifier)) {
        return `catalog correlation property identifier <${property.identifier}> is already in use`;
      }
    }
  }
  return null;
}

function messagesFromBpmn(definitions) {
  const messages = [];
  if (!definitions?.rootElements) return messages;
  const corrPropsByMsgId = {};
  for (const el of definitions.rootElements) {
    if (el.$type === 'bpmn:CorrelationProperty') {
      for (const expr of el.correlationPropertyRetrievalExpression ?? []) {
        const msgId = expr.messageRef?.id;
        if (msgId) {
          if (!corrPropsByMsgId[msgId]) corrPropsByMsgId[msgId] = [];
          corrPropsByMsgId[msgId].push({
            identifier: el.id,
            retrieval_expression: expr.messagePath?.body ?? '',
          });
        }
      }
    }
  }
  for (const el of definitions.rootElements) {
    if (el.$type === 'bpmn:Message') {
      messages.push({
        bpmn_id: el.id,
        identifier: el.name,
        schema_file: el.jsonSchemaId ?? '',
        correlation_properties: corrPropsByMsgId[el.id] ?? [],
      });
    }
  }
  return messages;
}

function clearRemovedReferences(
  element,
  removedMsgIds,
  removedPropertyIds,
  set,
  droppedByMessage
) {
  const dropped = droppedByMessage.get(element.messageRef?.id) || new Set();
  if (removedMsgIds.has(element.messageRef?.id)) {
    set(element, 'messageRef', undefined);
  }
  for (const key of element.correlationKeys ?? []) {
    set(
      key,
      'correlationPropertyRef',
      (key.correlationPropertyRef ?? []).filter(
        (property) => !removedPropertyIds.has(property.id)
      )
    );
  }
  const extensions = element.extensionElements;
  if (extensions?.values) {
    set(
      extensions,
      'values',
      extensions.values.filter(
        (extension) =>
          extension.$type !== 'spiffworkflow:ProcessVariableCorrelation' ||
          (!removedPropertyIds.has(extension.propertyId) &&
            !dropped.has(extension.propertyId))
      )
    );
  }
  for (const child of [
    ...(element.flowElements ?? []),
    ...(element.eventDefinitions ?? []),
    ...(element.messageFlows ?? []),
  ]) {
    clearRemovedReferences(
      child,
      removedMsgIds,
      removedPropertyIds,
      set,
      droppedByMessage
    );
  }
}

function syncMessagesToBpmn(bpmnFactory, moddle, definitions, updated, set) {
  const retained = new Map(
    updated.map((message) => [findCatalogMessage(definitions, message), message])
  );
  const droppedByMessage = new Map();

  const removedMsgIds = new Set();
  for (let i = definitions.rootElements.length - 1; i >= 0; i--) {
    const el = definitions.rootElements[i];
    if (el.$type === 'bpmn:Message' && !retained.has(el)) {
      removedMsgIds.add(el.id);
      set(
        definitions,
        'rootElements',
        definitions.rootElements.filter((root) => root !== el)
      );
    }
  }

  const removedPropertyIds = new Set();
  for (const el of definitions.rootElements) {
    if (
      el.$type === 'bpmn:CorrelationProperty' &&
      el.correlationPropertyRetrievalExpression
    ) {
      set(
        el,
        'correlationPropertyRetrievalExpression',
        el.correlationPropertyRetrievalExpression.filter((expression) => {
          const message = expression.messageRef;
          const config = retained.get(message);
          const removed =
            removedMsgIds.has(message?.id) ||
            (config &&
              !(config.correlation_properties || []).some(
                (property) => property.identifier === el.id
              ));
          if (removed && message) {
            if (!droppedByMessage.has(message.id))
              droppedByMessage.set(message.id, new Set());
            droppedByMessage.get(message.id).add(el.id);
          }
          return !removed;
        })
      );
    }
  }
  for (let i = definitions.rootElements.length - 1; i >= 0; i--) {
    const el = definitions.rootElements[i];
    if (
      el.$type === 'bpmn:CorrelationProperty' &&
      (el.correlationPropertyRetrievalExpression?.length ?? 0) === 0 &&
      !updated.some((message) =>
        message.correlation_properties?.some(
          (property) => property.identifier === el.id
        )
      )
    ) {
      removedPropertyIds.add(el.id);
      set(
        definitions,
        'rootElements',
        definitions.rootElements.filter((root) => root !== el)
      );
    }
  }

  clearRemovedReferences(
    definitions,
    removedMsgIds,
    removedPropertyIds,
    set,
    droppedByMessage
  );
  definitions.rootElements.forEach((element) =>
    clearRemovedReferences(
      element,
      removedMsgIds,
      removedPropertyIds,
      set,
      droppedByMessage
    )
  );

  for (const msg of updated) {
    let bpmnMsg = findCatalogMessage(definitions, msg);
    if (!bpmnMsg) {
      bpmnMsg = bpmnFactory.create('bpmn:Message', {
        id: msg.identifier,
        name: msg.identifier,
      });
      set(definitions, 'rootElements', [...definitions.rootElements, bpmnMsg]);
    }
    set(bpmnMsg, 'name', msg.identifier);
    set(bpmnMsg, 'jsonSchemaId', msg.schema_file || undefined);

    for (const cp of msg.correlation_properties ?? []) {
      let corrProp = definitions.rootElements.find(
        (el) =>
          el.$type === 'bpmn:CorrelationProperty' && el.id === cp.identifier
      );
      if (!corrProp) {
        corrProp = bpmnFactory.create('bpmn:CorrelationProperty', {
          id: cp.identifier,
          name: cp.identifier,
        });
        corrProp.correlationPropertyRetrievalExpression = [];
        set(definitions, 'rootElements', [
          ...definitions.rootElements,
          corrProp,
        ]);
      } else if (!corrProp.correlationPropertyRetrievalExpression) {
        set(corrProp, 'correlationPropertyRetrievalExpression', []);
      }

      const existingIdx =
        corrProp.correlationPropertyRetrievalExpression.findIndex(
          (expr) => expr.messageRef?.id === bpmnMsg.id
        );
      if (existingIdx === -1) {
        const retrievalExpr = bpmnFactory.create(
          'bpmn:CorrelationPropertyRetrievalExpression'
        );
        const formalExpr = bpmnFactory.create('bpmn:FormalExpression');
        formalExpr.body = cp.retrieval_expression;
        retrievalExpr.messagePath = formalExpr;
        retrievalExpr.messageRef = bpmnMsg;
        set(corrProp, 'correlationPropertyRetrievalExpression', [
          ...corrProp.correlationPropertyRetrievalExpression,
          retrievalExpr,
        ]);
      } else {
        set(
          corrProp.correlationPropertyRetrievalExpression[existingIdx]
            .messagePath,
          'body',
          cp.retrieval_expression
        );
      }
    }
  }
}

export default class MessageInterceptor extends CommandInterceptor {
  constructor(
    eventBus,
    bpmnFactory,
    commandStack,
    bpmnUpdater,
    moddle,
    elementRegistry
  ) {
    super(eventBus);
    commandStack.registerHandler('spiff.message.update', MessageUpdateHandler);

    eventBus.on('spiff.messages.get', () => {
      const definitions = getRoot(null, moddle);
      eventBus.fire('spiff.messages.got', {
        messages: messagesFromBpmn(definitions),
      });
    });

    eventBus.on('spiff.messages.save', (event) => {
      const { messages: updated } = event;
      const definitions = getRoot(null, moddle);
      if (!definitions?.rootElements) return;
      const failure = validateCatalogUpdate(moddle, definitions, updated);
      if (failure) {
        eventBus.fire('spiff.messages.save.failed', {
          messages: updated,
          reason: failure,
        });
        return;
      }
      commandStack.execute('spiff.message.update', {
        update: (set) => {
          syncMessagesToBpmn(bpmnFactory, moddle, definitions, updated, set);
          syncCatalogCorrelationKeys(definitions, bpmnFactory, moddle, set);
        },
      });
    });
  }
}

MessageInterceptor.$inject = [
  'eventBus',
  'bpmnFactory',
  'commandStack',
  'bpmnUpdater',
  'moddle',
  'elementRegistry',
];
