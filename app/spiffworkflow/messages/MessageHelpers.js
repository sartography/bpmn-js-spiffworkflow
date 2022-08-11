/**
 * loops up until it can find the root.
 * @param element
 */
export function getRoot(element) {
  if (element.$type === 'bpmn:Definitions') {
    return element;
  } else if ( typeof element.$parent != 'undefined') {
    return getRoot(element.$parent);
  } else {
    console.log('Cannot getRoot: ', element);
    return element;
  }
}

export function findFormalExpressions(element) {
  const formalExpressions = []
  if (element.messageRef){
    const root  = getRoot(element)
    if (root.$type === 'bpmn:Definitions') {
      for (const child_element of root.rootElements) {
        if (child_element.$type === 'bpmn:CorrelationProperty') {
          let retrieval_expression = processCorrelationProperty(child_element, element.messageRef);
          // todo: is there a better test for this than length === 1?
          if (retrieval_expression.length === 1){
            formalExpressions.push(retrieval_expression[0]);
          }
        }
      }
    }
  }
  return formalExpressions
}

function processCorrelationProperty(correlationProperty, message) {
  let expressions = []
  for (let retrieval_expression of correlationProperty.correlationPropertyRetrievalExpression){
    if ((retrieval_expression.$type === 'bpmn:CorrelationPropertyRetrievalExpression') &&
      (retrieval_expression.messageRef) &&
      (retrieval_expression.messageRef.id === message.id) &&
      (retrieval_expression.messagePath.body)) {
      expressions.push(retrieval_expression.messagePath.body)
    }
  }
  return expressions
}

export function findCorrelationKeys(element) {
  const root = getRoot(element);
  const correlationProperties = [];
  for (const rootElement of root.rootElements) {
    if (rootElement.$type === 'bpmn:CorrelationProperty') {
      correlationProperties.push(rootElement);
    }
  }
  return correlationProperties;
}

export function findMessageModdleElements(element) {
  const messages = [];
  const root = getRoot(element)
  for (const rootElement of root.rootElements) {
    if (rootElement.$type === 'bpmn:Message') {
      messages.push(rootElement);
    }
  }
  return messages;
}
