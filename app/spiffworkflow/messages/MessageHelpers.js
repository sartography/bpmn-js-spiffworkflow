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

export function getMessageRefElement(businessObject) {
  if (businessObject.$type === 'bpmn:IntermediateThrowEvent') {
    const messageEventDefinition = businessObject.eventDefinitions[0];
    if (messageEventDefinition.messageRef) {
      return messageEventDefinition.messageRef;
    }
  } else if (
    businessObject.$type === 'bpmn:SendTask' &&
    businessObject.messageRef
  ) {
    return businessObject.messageRef;
  }
  return '';
}

export function findFormalExpressions(businessObject) {
  const formalExpressions = [];
  const messageRef = getMessageRefElement(businessObject);
  if (messageRef) {
    const root = getRoot(businessObject);
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
        const correlationProperties = [];
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
