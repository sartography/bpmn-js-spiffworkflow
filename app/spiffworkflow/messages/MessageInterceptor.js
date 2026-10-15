import CommandInterceptor from 'diagram-js/lib/command/CommandInterceptor';
import { getRoot } from './MessageHelpers';

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
        identifier: el.name,
        schema_file: el.jsonSchemaId ?? '',
        correlation_properties: corrPropsByMsgId[el.id] ?? [],
      });
    }
  }
  return messages;
}

function clearRemovedReferences(element, removedMsgIds, removedPropertyIds) {
  if (removedMsgIds.has(element.messageRef?.id)) {
    element.set('messageRef', undefined);
  }
  for (const key of element.correlationKeys ?? []) {
    key.correlationPropertyRef = (key.correlationPropertyRef ?? []).filter(
      (property) => !removedPropertyIds.has(property.id)
    );
  }
  const extensions = element.extensionElements;
  if (extensions?.values) {
    extensions.set(
      'values',
      extensions.values.filter(
        (extension) =>
          extension.$type !== 'spiffworkflow:ProcessVariableCorrelation' ||
          !removedPropertyIds.has(extension.propertyId)
      )
    );
  }
  for (const child of [
    ...(element.flowElements ?? []),
    ...(element.eventDefinitions ?? []),
    ...(element.messageFlows ?? []),
  ]) {
    clearRemovedReferences(child, removedMsgIds, removedPropertyIds);
  }
}

function syncMessagesToBpmn(bpmnFactory, moddle, definitions, updated) {
  const updatedNames = new Set(updated.map((m) => m.identifier));

  const removedMsgIds = new Set();
  for (let i = definitions.rootElements.length - 1; i >= 0; i--) {
    const el = definitions.rootElements[i];
    if (el.$type === 'bpmn:Message' && !updatedNames.has(el.name)) {
      removedMsgIds.add(el.id);
      moddle.ids.unclaim(el.id);
      definitions.rootElements.splice(i, 1);
    }
  }

  const removedPropertyIds = new Set();
  for (const el of definitions.rootElements) {
    if (
      el.$type === 'bpmn:CorrelationProperty' &&
      el.correlationPropertyRetrievalExpression
    ) {
      for (
        let i = el.correlationPropertyRetrievalExpression.length - 1;
        i >= 0;
        i--
      ) {
        if (
          removedMsgIds.has(
            el.correlationPropertyRetrievalExpression[i].messageRef?.id
          )
        ) {
          el.correlationPropertyRetrievalExpression.splice(i, 1);
        }
      }
    }
  }
  for (let i = definitions.rootElements.length - 1; i >= 0; i--) {
    const el = definitions.rootElements[i];
    if (
      el.$type === 'bpmn:CorrelationProperty' &&
      (el.correlationPropertyRetrievalExpression?.length ?? 0) === 0
    ) {
      removedPropertyIds.add(el.id);
      moddle.ids.unclaim(el.id);
      definitions.rootElements.splice(i, 1);
    }
  }

  clearRemovedReferences(definitions, removedMsgIds, removedPropertyIds);
  definitions.rootElements.forEach((element) =>
    clearRemovedReferences(element, removedMsgIds, removedPropertyIds)
  );

  for (const msg of updated) {
    let bpmnMsg = definitions.rootElements.find(
      (el) => el.$type === 'bpmn:Message' && el.name === msg.identifier
    );
    if (!bpmnMsg) {
      bpmnMsg = bpmnFactory.create('bpmn:Message', {
        id: msg.identifier,
        name: msg.identifier,
      });
      definitions.rootElements.push(bpmnMsg);
    }
    bpmnMsg.jsonSchemaId = msg.schema_file || undefined;

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
        definitions.rootElements.push(corrProp);
      } else {
        corrProp.correlationPropertyRetrievalExpression =
          corrProp.correlationPropertyRetrievalExpression ?? [];
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
        corrProp.correlationPropertyRetrievalExpression.push(retrievalExpr);
      } else {
        corrProp.correlationPropertyRetrievalExpression[
          existingIdx
        ].messagePath.body = cp.retrieval_expression;
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

    eventBus.on('spiff.messages.get', () => {
      const definitions = getRoot(null, moddle);
      eventBus.fire('spiff.messages.got', {
        messages: messagesFromBpmn(definitions),
      });
    });

    eventBus.on('spiff.messages.save', (event) => {
      const { messages: updated, elementId } = event;
      const definitions = getRoot(null, moddle);
      if (!definitions?.rootElements) return;
      syncMessagesToBpmn(bpmnFactory, moddle, definitions, updated);
      const element = elementRegistry.get(elementId);
      if (element) {
        commandStack.execute('element.updateProperties', {
          element,
          properties: {},
        });
      }
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
