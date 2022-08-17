import { is } from 'bpmn-js/lib/util/ModelUtil';

/**
 * loops up until it can find the root.
 * @param element
 */
export function getRoot(element) {
  // todo: Do we want element to be a shape or moddle object?
  if (element.$type === 'bpmn:Definitions') {
    return element;
  }
  if (typeof element.$parent !== 'undefined') {
    return getRoot(element.$parent);
  }
  return element;
}

export function isMessageElement(shapeElement) {
  return (
    is(shapeElement, 'bpmn:SendTask') ||
    is(shapeElement, 'bpmn:ReceiveTask') ||
    isMessageEvent(shapeElement)
  );
}

export function isMessageEvent(shapeElement) {
  const { eventDefinitions } = shapeElement.businessObject;
  if (eventDefinitions && eventDefinitions[0]) {
    return eventDefinitions[0].$type === 'bpmn:MessageEventDefinition';
  }
  return false;
}

export function canReceiveMessage(shapeElement) {
  if (is(shapeElement, 'bpmn:ReceiveTask')) {
    return true;
  }
  if (isMessageEvent(shapeElement)) {
    return (
      is(shapeElement, 'bpmn:StartEvent') || is(shapeElement, 'bpmn:CatchEvent')
    );
  }
  return false;
}

export function getMessageRefElement(shapeElement) {
  if (isMessageEvent(shapeElement)) {
    const messageEventDefinition =
      shapeElement.businessObject.eventDefinitions[0];
    if (messageEventDefinition && messageEventDefinition.messageRef) {
      return messageEventDefinition.messageRef;
    }
  } else if (
    isMessageElement(shapeElement) &&
    shapeElement.businessObject.messageRef
  ) {
    return shapeElement.businessObject.messageRef;
  }
  return null;
}

export function findFormalExpressions(shapeElement) {
  const formalExpressions = [];
  const messageRef = getMessageRefElement(shapeElement);
  if (messageRef) {
    const root = getRoot(shapeElement.businessObject);
    if (root.$type === 'bpmn:Definitions') {
      for (const childElement of root.rootElements) {
        if (childElement.$type === 'bpmn:CorrelationProperty') {
          const retrievalExpression = processCorrelationProperty(
            childElement,
            messageRef
          );
          // todo: is there a better test for this than length === 1?
          if (retrievalExpression.length === 1) {
            const formalExpression = {
              correlationId: childElement.id,
              expression: retrievalExpression[0],
            };
            formalExpressions.push(formalExpression);
          }
        }
      }
    }
  }
  return formalExpressions;
}

export function getMessageElementForShapeElement(shapeElement) {
  const { businessObject } = shapeElement;
  const taskMessage = getMessageRefElement(shapeElement);
  const messages = findMessageModdleElements(businessObject);
  if (taskMessage) {
    for (const message of messages) {
      if (message.id === taskMessage.id) {
        return message;
      }
    }
  }
  return null;
}

function processCorrelationProperty(correlationProperty, message) {
  const expressions = [];
  for (const retrievalExpression of correlationProperty.correlationPropertyRetrievalExpression) {
    if (
      retrievalExpression.$type ===
        'bpmn:CorrelationPropertyRetrievalExpression' &&
      retrievalExpression.messageRef &&
      retrievalExpression.messageRef.id === message.id &&
      retrievalExpression.messagePath.body
    ) {
      expressions.push(retrievalExpression.messagePath.body);
    }
  }
  return expressions;
}

export function findCorrelationProperties(element) {
  const root = getRoot(element);
  const correlationProperties = [];
  for (const rootElement of root.rootElements) {
    if (rootElement.$type === 'bpmn:CorrelationProperty') {
      correlationProperties.push(rootElement);
    }
  }
  return correlationProperties;
}

export function findCorrelationKeys(element) {
  const root = getRoot(element);
  const correlationKeys = [];
  for (const rootElement of root.rootElements) {
    if (rootElement.$type === 'bpmn:Collaboration') {
      const currentKeys = rootElement.correlationKeys;
      for (const correlationKey in currentKeys) {
        const currentCorrelation = rootElement.correlationKeys[correlationKey];
        const currentProperty = {};
        currentProperty.name = currentCorrelation.name;
        currentProperty.refs = [];
        for (const correlationProperty in currentCorrelation.correlationPropertyRef) {
          currentProperty.refs.push(
            currentCorrelation.correlationPropertyRef[correlationProperty]
          );
        }
        correlationKeys.push(currentProperty);
      }
    }
  }
  return correlationKeys;
}

export function findMessageModdleElements(element) {
  const messages = [];
  const root = getRoot(element);
  for (const rootElement of root.rootElements) {
    if (rootElement.$type === 'bpmn:Message') {
      messages.push(rootElement);
    }
  }
  return messages;
}
