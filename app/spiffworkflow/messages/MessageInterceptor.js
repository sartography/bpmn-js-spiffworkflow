import CommandInterceptor from 'diagram-js/lib/command/CommandInterceptor';
import {
  isMessageElement,
  isMessageRefUsed,
  setParentCorrelationKeys,
  syncCorrelationProperties,
  getRoot,
} from './MessageHelpers';

const HIGH_PRIORITY = 90500;

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
        schema_file: '',
        correlation_properties: corrPropsByMsgId[el.id] ?? [],
      });
    }
  }
  return messages;
}

function syncMessagesToBpmn(bpmnFactory, definitions, updated) {
  const updatedNames = new Set(updated.map((m) => m.identifier));

  const removedMsgIds = new Set();
  for (let i = definitions.rootElements.length - 1; i >= 0; i--) {
    const el = definitions.rootElements[i];
    if (el.$type === 'bpmn:Message' && !updatedNames.has(el.name)) {
      removedMsgIds.add(el.id);
      definitions.rootElements.splice(i, 1);
    }
  }

  for (const el of definitions.rootElements) {
    if (el.$type === 'bpmn:CorrelationProperty' && el.correlationPropertyRetrievalExpression) {
      for (let i = el.correlationPropertyRetrievalExpression.length - 1; i >= 0; i--) {
        if (removedMsgIds.has(el.correlationPropertyRetrievalExpression[i].messageRef?.id)) {
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
      definitions.rootElements.splice(i, 1);
    }
  }

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

    for (const cp of msg.correlation_properties ?? []) {
      let corrProp = definitions.rootElements.find(
        (el) => el.$type === 'bpmn:CorrelationProperty' && el.id === cp.identifier
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

      const existingIdx = corrProp.correlationPropertyRetrievalExpression.findIndex(
        (expr) => expr.messageRef?.id === msg.identifier
      );
      if (existingIdx === -1) {
        const retrievalExpr = bpmnFactory.create('bpmn:CorrelationPropertyRetrievalExpression');
        const formalExpr = bpmnFactory.create('bpmn:FormalExpression');
        formalExpr.body = cp.retrieval_expression;
        retrievalExpr.messagePath = formalExpr;
        retrievalExpr.messageRef = bpmnMsg;
        corrProp.correlationPropertyRetrievalExpression.push(retrievalExpr);
      } else {
        corrProp.correlationPropertyRetrievalExpression[existingIdx].messagePath.body =
          cp.retrieval_expression;
      }
    }
  }
}

export default class MessageInterceptor extends CommandInterceptor {
  constructor(eventBus, bpmnFactory, commandStack, bpmnUpdater, moddle, elementRegistry) {
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
      syncMessagesToBpmn(bpmnFactory, definitions, updated);
      const element = elementRegistry.get(elementId);
      if (element) {
        commandStack.execute('element.updateProperties', { element, properties: {} });
      }
    });

    this.postExecuted(['shape.delete'], HIGH_PRIORITY, function (event) {
      const { context } = event;
      const { shape, rootElement } = context;
      const { businessObject } = shape;

      if (isMessageElement(shape)) {
        let oldMessageRef = businessObject.eventDefinitions
          ? businessObject.eventDefinitions[0].messageRef
          : businessObject.messageRef;

        let definitions = getRoot(rootElement, moddle);
        if (!definitions.get('rootElements')) {
          definitions.set('rootElements', []);
        }

        if (oldMessageRef) {
          // Remove previous message in case it's not used anymore
          const isOldMessageUsed = isMessageRefUsed(
            definitions,
            oldMessageRef.id
          );
          if (!isOldMessageUsed) {
            const rootElements = definitions.get('rootElements');
            const oldMessageIndex = rootElements.findIndex(
              (element) =>
                element.$type === 'bpmn:Message' &&
                element.id === oldMessageRef.id
            );
            if (oldMessageIndex !== -1) {
              rootElements.splice(oldMessageIndex, 1);
              definitions.rootElements = rootElements;
            }
          }

          // Automatic deletion of previous message correlation properties
          syncCorrelationProperties(shape, definitions, moddle);
        }

        // Update Correlation key if Process has collaboration
        try {
          setParentCorrelationKeys(definitions, bpmnFactory, shape, moddle);
        } catch (error) {
          console.error(
            'Error Caught while synchronizing Correlation key',
            error
          );
        }
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
