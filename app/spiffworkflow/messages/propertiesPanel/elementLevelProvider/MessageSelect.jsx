import React from 'react';
import { useService } from 'bpmn-js-properties-panel';
import { SelectEntry } from '@bpmn-io/properties-panel';
import {
  createOrUpdateCorrelationPropertiesV2,
  findMessageModdleElements,
  getMessageRefElement,
  getRoot,
  isMessageElement,
  isMessageEvent,
  isMessageRefUsed,
  setParentCorrelationKeys,
  synCorrleationProperties,
} from '../../MessageHelpers';
import { SPIFF_ADD_MESSAGE_RETURNED_EVENT } from '../../../constants';

export const spiffExtensionOptions = {};

let ELEMENT_ID;

/**
 * Allows the selection, or creation, of Message at the Definitions level of a BPMN document.
 */
export function MessageSelect(props) {
  let shapeElement = props.element;
  const { commandStack, moddle, elementRegistry } = props;
  let { element } = props;
  const debounce = useService('debounceInput');
  const eventBus = useService('eventBus');
  const bpmnFactory = useService('bpmnFactory');

  const getValue = () => {
    const messageRefElement = getMessageRefElement(shapeElement);
    if (messageRefElement) {
      return messageRefElement.id;
    }
    return '';
  };

  const setValue = async (value) => {

    console.log('Set Value', value);

    const messageId = value;
    const { businessObject } = element;
    const oldMessageRef = businessObject.eventDefinitions?.[0].messageRef || businessObject.messageRef;
    const definitions = getRoot(businessObject);

    if (ELEMENT_ID) {
      // ⚠️⚠️ Not sure if we can keep this
      // This condition verify if Setvalue trigger is about the same element triggered from spifarena
      const nwElement = elementRegistry.get(ELEMENT_ID);
      shapeElement = (nwElement) ? nwElement : shapeElement;
      element = (nwElement) ? nwElement : element;
    }
  
    if (!definitions?.rootElements) {
      definitions.rootElements = [];
    }
  
    let bpmnMessage = findMessageById(definitions, messageId);
  
    if (!bpmnMessage) {
      bpmnMessage = createMessage(bpmnFactory, messageId);
      definitions.rootElements.push(bpmnMessage);
    } else if (bpmnMessage.id !== bpmnMessage.name) {
      bpmnMessage.id = bpmnMessage.name;
    }
  
    updateElementMessageRef(element, bpmnMessage, moddle, commandStack);
  
    const messageObject = findMessageObject(messageId);
    console.log('msgObject', messageObject);
  
    if (messageObject) {
      createOrUpdateCorrelationPropertiesV2(
        bpmnFactory,
        commandStack,
        element,
        messageObject.correlation_properties,
        messageId,
      );
    }
  
    if (oldMessageRef) {
      cleanupOldMessage(definitions, oldMessageRef.id);
      synCorrleationProperties(element, definitions, moddle, messageObject);
    }
  
    try {
      setParentCorrelationKeys(definitions, bpmnFactory, element, moddle);
    } catch (error) {
      console.error('Error caught while synchronizing Correlation key', error);
    }
  };

  eventBus.on(SPIFF_ADD_MESSAGE_RETURNED_EVENT, async (event) => {

    console.log('On SPIFF_ADD_MESSAGE_RETURNED_EVENT', event);

    // Check if the received element matches the current element
    if (event.elementId !== element.id) {
      ELEMENT_ID = event.elementId;
    }

    const cProperties = Object.entries(event.correlation_properties).map(([identifier, properties]) => ({
      identifier,
      retrieval_expression: (Array.isArray(properties.retrieval_expression))? properties.retrieval_expression[0] : properties.retrieval_expression
    }));

    let newMsg = {
      identifier: event.name,
      correlation_properties: cProperties
    };

    spiffExtensionOptions['spiff.messages'] = (Array.isArray(spiffExtensionOptions['spiff.messages']) && spiffExtensionOptions['spiff.messages']) ? spiffExtensionOptions['spiff.messages'] : [];
    const messageIndex = spiffExtensionOptions['spiff.messages'].findIndex(
      (msg) => msg.identifier === newMsg.identifier
    );
    if (messageIndex !== -1) {
      spiffExtensionOptions['spiff.messages'][messageIndex] = newMsg;
    } else {
      spiffExtensionOptions['spiff.messages'].push(newMsg);
    }
    setValue(event.name);
  });

  requestOptions(eventBus, bpmnFactory, element, moddle);

  const getOptions = () => {
    // Load messages from XML
    const options = [];
    const messages = findMessageModdleElements(shapeElement.businessObject);
    for (const message of messages) {
      options.push({ label: message.name, value: message.id });
    }

    // Load messages from API
    if (
      spiffExtensionOptions['spiff.messages'] &&
      spiffExtensionOptions['spiff.messages'] !== null
    ) {
      spiffExtensionOptions['spiff.messages'].forEach((opt) => {
        options.push({
          label: opt.identifier,
          value: opt.identifier,
        });
      });
    }

    // Remove duplicated options
    const uniqueArray = removeDuplicatesByLabel(options);
    return uniqueArray;
  };

  return (
    <SelectEntry
      id="selectMessage"
      element={shapeElement}
      description="Select the Message to associate with this task or event."
      label="Which message is this associated with?"
      getValue={getValue}
      setValue={setValue}
      getOptions={getOptions}
      debounce={debounce}
    />
  );
}

function requestOptions(eventBus, bpmnFactory, element, moddle) {
  eventBus.on(`spiff.messages.returned`, (event) => {
    spiffExtensionOptions['spiff.messages'] = event.configuration.messages;
  });
  eventBus.fire(`spiff.messages.requested`, { eventBus });
}

function removeDuplicatesByLabel(array) {
  const seen = new Map();
  return array.filter((item) => {
    return seen.has(item.label) ? false : seen.set(item.label, true);
  });
}

function findMessageById(definitions, messageId) {
  return definitions.rootElements?.find(
    (element) =>
      element.$type === 'bpmn:Message' &&
      (element.id === messageId || element.name === messageId),
  );
}

function createMessage(bpmnFactory, messageId) {
  return bpmnFactory.create('bpmn:Message', {
    id: messageId,
    name: messageId,
  });
}

function updateElementMessageRef(element, bpmnMessage, moddle, commandStack) {
  if (isMessageEvent(element)) {
    const messageEventDefinition = element.businessObject.eventDefinitions[0];
    messageEventDefinition.extensionElements = (messageEventDefinition.extensionElements) ? messageEventDefinition.extensionElements : moddle.create('bpmn:ExtensionElements');
    messageEventDefinition.messageRef = bpmnMessage;
    commandStack.execute('element.updateModdleProperties', {
      element: element,
      moddleElement: element.businessObject,
      properties: {},
    });
  } else if (isMessageElement(element)) {
    element.businessObject.extensionElements = (element.businessObject.extensionElements) ? element.businessObject.extensionElements : moddle.create('bpmn:ExtensionElements');
    element.businessObject.messageRef = bpmnMessage;
    commandStack.execute('element.updateProperties', {
      element: element,
      properties: {},
    });
  }
}

function findMessageObject(messageId) {

  const messageObject = spiffExtensionOptions['spiff.messages']?.find(
    (msg) => msg.identifier === messageId
  );

  if (messageObject) {
    return {
      "identifier": messageObject.identifier,
      "correlation_properties": messageObject.correlation_properties.map(prop => ({
        "identifier": prop.identifier,
        "retrieval_expression": prop.retrieval_expression
      }))
    };
  } else {
    return null;
  }
}

function cleanupOldMessage(definitions, oldMessageId) {
  if (!isMessageRefUsed(definitions, oldMessageId)) {
    const rootElements = definitions.rootElements;
    const oldMessageIndex = rootElements.findIndex(
      (element) => element.$type === 'bpmn:Message' && element.id === oldMessageId,
    );
    if (oldMessageIndex !== -1) {
      rootElements.splice(oldMessageIndex, 1);
      definitions.rootElements = rootElements;
    }
  }
}
