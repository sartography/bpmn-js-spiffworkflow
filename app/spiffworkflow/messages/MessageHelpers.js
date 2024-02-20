import { is } from 'bpmn-js/lib/util/ModelUtil';

/**
 * loops up until it can find the root.
 * @param element
 */
export function getRoot(businessObject, moddle) {
  // HACK: get the root element. need a more formal way to do this
  if (moddle) {
    for (const elementId in moddle.ids._seed.hats) {
      if (elementId.startsWith('Definitions_')) {
        return moddle.ids._seed.hats[elementId];
      }
    }
  } else {
    // todo: Do we want businessObject to be a shape or moddle object?
    if (businessObject.$type === 'bpmn:Definitions') {
      return businessObject;
    }
    if (typeof businessObject.$parent !== 'undefined') {
      return getRoot(businessObject.$parent);
    }
  }
  return businessObject;
}

export function isMessageElement(shapeElement) {
  return (
    is(shapeElement, 'bpmn:SendTask') ||
    is(shapeElement, 'bpmn:ReceiveTask') ||
    isMessageEvent(shapeElement)
  );
}

export function isMessageEvent(shapeElement) {
  try {
    const { eventDefinitions } = shapeElement.businessObject;
    if (eventDefinitions && eventDefinitions[0]) {
      return eventDefinitions[0].$type === 'bpmn:MessageEventDefinition';
    }
    return false;
  } catch (error) {
    return false;
  }
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

export function findCorrelationKeyForCorrelationProperty(shapeElement, moddle) {
  const correlationKeyElements = findCorrelationKeys(shapeElement, moddle);
  for (const cke of correlationKeyElements) {
    if (cke.correlationPropertyRef) {
      for (const correlationPropertyRef of cke.correlationPropertyRef) {
        if (correlationPropertyRef.id === shapeElement.id) {
          return cke;
        }
      }
    }
  }
  return null;
}

export function findCorrelationPropertiesAndRetrievalExpressionsForMessage(
  shapeElement
) {
  const formalExpressions = [];
  const messageRefElement = getMessageRefElement(shapeElement);
  if (messageRefElement) {
    const root = getRoot(shapeElement.businessObject);
    if (root.$type === 'bpmn:Definitions') {
      for (const childElement of root.rootElements) {
        if (childElement.$type === 'bpmn:CorrelationProperty') {
          const retrievalExpression =
            getRetrievalExpressionFromCorrelationProperty(
              childElement,
              messageRefElement
            );
          if (retrievalExpression) {
            const formalExpression = {
              correlationPropertyModdleElement: childElement,
              correlationPropertyRetrievalExpressionModdleElement:
                retrievalExpression,
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

function getRetrievalExpressionFromCorrelationProperty(
  correlationProperty,
  message
) {
  if (correlationProperty.correlationPropertyRetrievalExpression) {
    for (const retrievalExpression of correlationProperty.correlationPropertyRetrievalExpression) {
      if (
        retrievalExpression.$type ===
        'bpmn:CorrelationPropertyRetrievalExpression' &&
        retrievalExpression.messageRef &&
        retrievalExpression.messageRef.id === message.id
      ) {
        return retrievalExpression;
      }
    }
  }
  return null;
}

export function findCorrelationProperties(businessObject, moddle) {
  const root = getRoot(businessObject, moddle);
  const correlationProperties = [];
  if (isIterable(root.rootElements)) {
    for (const rootElement of root.rootElements) {
      if (rootElement.$type === 'bpmn:CorrelationProperty') {
        correlationProperties.push(rootElement);
      }
    }
  }
  return correlationProperties;
}

export function findCorrelationPropertiesByMessage(element) {

  let messageId;
  const { businessObject } = element;
  const root = getRoot(businessObject);
  const correlationProperties = [];

  if (isMessageEvent(element)) {
    messageId = businessObject.eventDefinitions[0].messageRef.id;
  } else if (isMessageElement(element)) {
    if (!businessObject.messageRef) return;
    messageId = businessObject.messageRef.id;
  }

  if (isIterable(root.rootElements)) {
    for (const rootElement of root.rootElements) {
      if (rootElement.$type === 'bpmn:CorrelationProperty') {
        rootElement.correlationPropertyRetrievalExpression = (rootElement.correlationPropertyRetrievalExpression) ? rootElement.correlationPropertyRetrievalExpression : [];
        const existingExpressionIndex = rootElement.correlationPropertyRetrievalExpression.findIndex(retrievalExpr =>
          retrievalExpr.messageRef && retrievalExpr.messageRef.id === messageId
        );
        (existingExpressionIndex !== -1) ? correlationProperties.push(rootElement) : null;
      }
    }
  }
  return correlationProperties;
}

function isIterable(obj) {
  // checks for null and undefined
  if (obj == null) {
    return false;
  }
  return typeof obj[Symbol.iterator] === 'function';
}

export function findCorrelationKeys(businessObject, moddle) {
  const root = getRoot(businessObject, moddle);
  const correlationKeys = [];
  if (root.rootElements) {
    for (const rootElement of root.rootElements) {
      if (rootElement.$type === 'bpmn:Collaboration') {
        const currentKeys = rootElement.correlationKeys;
        for (const correlationKey in currentKeys) {
          const currentCorrelation = rootElement.correlationKeys[correlationKey];
          correlationKeys.push(currentCorrelation);
        }
      }
    }
  }
  return correlationKeys;
}

export function findMessageModdleElements(businessObject) {
  const messages = [];
  const root = getRoot(businessObject);
  if (root.rootElements) {
    for (const rootElement of root.rootElements) {
      if (rootElement.$type === 'bpmn:Message') {
        messages.push(rootElement);
      }
    }
  }
  return messages;
}

export function findMessageElement(businessObject, messageId) {
  const root = getRoot(businessObject);

  if (root.rootElements) {
    for (const rootElement of root.rootElements) {
      if (rootElement.$type === 'bpmn:Message' && rootElement.name == messageId) {
        return rootElement;
      }
    }
  }
  return null;
}

export function createOrUpdateCorrelationProperties(bpmnFactory, commandStack, element, propertiesConfig, messageId) {

  let definitions = getRoot(element.businessObject);

  if (propertiesConfig) {
    // Iterate over each property configuration
    propertiesConfig.forEach(propConfig => {
      if (isMessageIdInRetrievalExpressions(propConfig, messageId)) {

        let correlationProperty = findCorrelationPropertyById(definitions, propConfig.id);

        // If the correlationProperty does not exist, create it
        if (correlationProperty === null) {
          correlationProperty = bpmnFactory.create(
            'bpmn:CorrelationProperty'
          );
          correlationProperty.id = propConfig.id;
          correlationProperty.name = propConfig.id;
          correlationProperty.correlationPropertyRetrievalExpression = [];
        } else if (correlationProperty && !correlationProperty.correlationPropertyRetrievalExpression) {
          correlationProperty.correlationPropertyRetrievalExpression = [];
        }

        // Iterate over retrieval expressions and add them to the correlationProperty
        propConfig.retrieval_expressions.forEach(expr => {
          const existingExpressionIndex = correlationProperty.correlationPropertyRetrievalExpression.findIndex(retrievalExpr =>
            retrievalExpr.messageRef && retrievalExpr.messageRef.id === messageId
          );
          if (expr.message_ref == messageId && existingExpressionIndex === -1) {
            const retrievalExpression = bpmnFactory.create('bpmn:CorrelationPropertyRetrievalExpression');
            const formalExpression = bpmnFactory.create('bpmn:FormalExpression');
            formalExpression.body = (expr.formal_expression) ? expr.formal_expression : '';
            retrievalExpression.messagePath = formalExpression;
            const msgElement = findMessageElement(element.businessObject, expr.message_ref);
            retrievalExpression.messageRef = msgElement;
            correlationProperty.correlationPropertyRetrievalExpression.push(retrievalExpression);
          }
        });

        const existingIndex = definitions.rootElements.findIndex(element =>
          element.id === correlationProperty.id && element.$type === correlationProperty.$type);

        if (existingIndex !== -1) {
          // Update existing correlationProperty
          definitions.rootElements[existingIndex] = correlationProperty;
        } else {
          // Add new correlationProperty
          definitions.rootElements.push(correlationProperty);
        }

        commandStack.execute('element.updateProperties', {
          element,
          properties: {},
        });
      }
    });
  }

}

export function findCorrelationPropertyById(definitions, id) {
  let foundCorrelationProperty = null;
  definitions.rootElements.forEach(rootElement => {
    if (rootElement.$type === 'bpmn:CorrelationProperty' && rootElement.id === id) {
      foundCorrelationProperty = rootElement;
    }
  });
  return foundCorrelationProperty;
}

export function isMessageRefUsed(definitions, messageRef) {
  definitions.rootElements.forEach(rootElement => {
    if (rootElement.$type == 'bpmn:Process') {
      const process = rootElement;
      process.flowElements.forEach(element => {
        if (isMessageElement(element)) {
          if (element.messageRef === messageRef) {
            return true;
          }
        }
      });
    }
  });
  return false;
}

function isMessageIdInRetrievalExpressions(propConfig, messageId) {
  return propConfig.retrieval_expressions.some(expr => expr.message_ref === messageId);
}




// MY HELPERS

// Create new correlation property from editor
export function createNewCorrelationProperty(element, moddle, commandStack, messageRef) {

  // console.log('createNewCorrelationProperty', element, moddle, commandStack);

  const rootElement = getRoot(element.businessObject);
  const { rootElements } = rootElement;

  const newCorrelationPropertyElement = moddle.create(
    'bpmn:CorrelationProperty'
  );

  const correlationPropertyId = moddle.ids.nextPrefixed(
    'CorrelationProperty_'
  );

  newCorrelationPropertyElement.id = correlationPropertyId;
  newCorrelationPropertyElement.name = correlationPropertyId;
  newCorrelationPropertyElement.correlationPropertyRetrievalExpression = [];

  if (messageRef) {
    const retrievalExpression = moddle.create('bpmn:CorrelationPropertyRetrievalExpression');
    const formalExpression = moddle.create('bpmn:FormalExpression');
    formalExpression.body = '';
    retrievalExpression.messagePath = formalExpression;
    retrievalExpression.messageRef = messageRef;
    newCorrelationPropertyElement.correlationPropertyRetrievalExpression.push(retrievalExpression);
  }

  rootElements.push(newCorrelationPropertyElement);

  commandStack.execute('element.updateProperties', {
    element,
    properties: {},
  });

}



// Create new message from editor
export function createNewMessage(element, moddle, commandStack) {

  // console.log('createNewMessage', element, moddle, commandStack);

  if (element.type === 'bpmn:Collaboration' || element.type === 'bpmn:Process') {

    const rootElement = getRoot(element.businessObject);
    const { rootElements } = rootElement;
    const messageId = moddle.ids.nextPrefixed('Message_');
    const newMessageElement = moddle.create('bpmn:Message');

    newMessageElement.id = messageId;
    newMessageElement.name = messageId;

    rootElements.push(newMessageElement);

    commandStack.execute('element.updateProperties', {
      element,
      properties: {},
    });

  }
}
