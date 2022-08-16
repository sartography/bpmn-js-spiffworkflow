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

export function findFormalExpressions(element) {
  const formalExpressions = [];
  if (element.messageRef) {
    const root = getRoot(element);
    if (root.$type === 'bpmn:Definitions') {
      for (const child_element of root.rootElements) {
        if (child_element.$type === 'bpmn:CorrelationProperty') {
          const retrieval_expression = processCorrelationProperty(
            child_element,
            element.messageRef
          );
          // todo: is there a better test for this than length === 1?
          if (retrieval_expression.length === 1) {
            const formalExpression = {};
            formalExpression.correlationId = child_element.id;
            formalExpression.expression = retrieval_expression[0];
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
  for (const retrieval_expression of correlationProperty.correlationPropertyRetrievalExpression) {
    if (
      retrieval_expression.$type ===
        'bpmn:CorrelationPropertyRetrievalExpression' &&
      retrieval_expression.messageRef &&
      retrieval_expression.messageRef.id === message.id &&
      retrieval_expression.messagePath.body
    ) {
      expressions.push(retrieval_expression.messagePath.body);
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
