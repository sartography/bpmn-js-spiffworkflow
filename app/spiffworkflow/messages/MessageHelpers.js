/**
 * loops up until it can find the root.
 * @param element
 */
export function getRoot(element) {
  if(element.$parent) {
    return getRoot(element.$parent)
  } else {
    return element
  }
}

export function findCorrelationKeys(element) {
  const root = getRoot(element)
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
