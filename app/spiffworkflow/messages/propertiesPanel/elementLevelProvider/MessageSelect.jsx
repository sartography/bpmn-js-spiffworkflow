import React from 'react';
import { useEffect, useState } from '@bpmn-io/properties-panel/preact/hooks';
import { useService } from 'bpmn-js-properties-panel';
import { SelectEntry } from '@bpmn-io/properties-panel';
import {
  createOrUpdateCorrelationPropertiesV2,
  findMessageModdleElements,
  getMessageRefElement,
  getRoot,
  isMessageElement,
  isMessageEvent,
  setParentCorrelationKeys,
  syncCorrelationProperties,
} from '../../MessageHelpers';
import { SPIFF_ADD_MESSAGE_RETURNED_EVENT } from '../../../constants';

export const spiffExtensionOptions = {};

/**
 * Allows the selection, or creation, of Message at the Definitions level of a BPMN document.
 */
export function MessageSelect(props) {
  const shapeElement = props.element;
  const { commandStack, moddle, elementRegistry } = props;
  const { element } = props;
  const debounce = useService('debounceInput');
  const eventBus = useService('eventBus');
  const bpmnFactory = useService('bpmnFactory');

  // Per-mount state — avoids stale module-level data leaking between renders.
  const [apiMessages, setApiMessages] = useState(null);

  const getValue = () => {
    const messageRefElement = getMessageRefElement(shapeElement);
    if (messageRefElement) {
      return messageRefElement.id;
    }
    return '';
  };

  const setMessage = async (value, targetElement) => {
    const messageId = value;
    const { businessObject } = targetElement;
    const oldMessageRef =
      businessObject.eventDefinitions?.[0].messageRef ||
      businessObject.messageRef;
    const definitions = getRoot(businessObject);

    if (!definitions?.rootElements) {
      definitions.rootElements = [];
    }

    if (!messageId) {
      const moddleElement = isMessageEvent(targetElement)
        ? targetElement.businessObject.eventDefinitions[0]
        : targetElement.businessObject;
      commandStack.execute('element.updateModdleProperties', {
        element: targetElement,
        moddleElement,
        properties: { messageRef: undefined },
      });
      return;
    }

    let bpmnMessage = findMessageById(definitions, messageId);

    if (!bpmnMessage) {
      bpmnMessage = createMessage(bpmnFactory, messageId);
      definitions.rootElements.push(bpmnMessage);
    }

    updateElementMessageRef(targetElement, bpmnMessage, moddle, commandStack);

    const messageObject = findMessageObject(messageId);

    if (messageObject) {
      createOrUpdateCorrelationPropertiesV2(
        bpmnFactory,
        commandStack,
        targetElement,
        messageObject.correlation_properties,
        messageId
      );
    }

    if (oldMessageRef) {
      syncCorrelationProperties(targetElement, definitions, moddle, messageObject);
    }

    try {
      setParentCorrelationKeys(definitions, bpmnFactory, targetElement, moddle);
    } catch (error) {
      console.error('Error caught while synchronizing Correlation key', error);
    }
  };

  useEffect(() => {
    // Clear stale module-level data from previous mounts so getOptions()
    // starts fresh on each component mount.
    spiffExtensionOptions['spiff.messages'] = null;

    const handleMessagesReturned = (event) => {
      // Keep spiffExtensionOptions in sync for synchronous findMessageObject()
      // lookups, and update Preact state to trigger a dropdown re-render.
      spiffExtensionOptions['spiff.messages'] = event.configuration.messages;
      setApiMessages(event.configuration.messages);
    };

    const handleAddMessageReturned = async (event) => {
      const cProperties = Object.entries(event.correlation_properties).map(
        ([identifier, properties]) => ({
          identifier,
          retrieval_expression: Array.isArray(properties.retrieval_expression)
            ? properties.retrieval_expression[0]
            : properties.retrieval_expression,
        })
      );

      let newMsg = {
        identifier: event.name,
        correlation_properties: cProperties,
      };

      // Update spiffExtensionOptions synchronously so findMessageObject() in
      // setValue() can look up the new message immediately.
      const current = Array.isArray(spiffExtensionOptions['spiff.messages'])
        ? spiffExtensionOptions['spiff.messages']
        : [];
      const messageIndex = current.findIndex(
        (msg) => msg.identifier === newMsg.identifier
      );
      if (messageIndex !== -1) {
        current[messageIndex] = newMsg;
      } else {
        current.push(newMsg);
      }
      spiffExtensionOptions['spiff.messages'] = current;

      // Also update Preact state to trigger a dropdown re-render.
      setApiMessages([...current]);

      setMessage(event.name, elementRegistry.get(event.elementId) || element);
    };

    eventBus.on('spiff.messages.returned', handleMessagesReturned);
    eventBus.on(SPIFF_ADD_MESSAGE_RETURNED_EVENT, handleAddMessageReturned);
    eventBus.fire('spiff.messages.requested', { eventBus });

    return () => {
      eventBus.off('spiff.messages.returned', handleMessagesReturned);
      eventBus.off(SPIFF_ADD_MESSAGE_RETURNED_EVENT, handleAddMessageReturned);
    };
  }, [bpmnFactory, element, eventBus, moddle]);

  const getOptions = () => {
    // Load messages from XML
    const options = [{ label: '-- none --', value: '' }];
    const messages = findMessageModdleElements(shapeElement.businessObject);
    for (const message of messages) {
      options.push({ label: message.name, value: message.id });
    }

    // Load messages from API
    if (Array.isArray(apiMessages)) {
      apiMessages.forEach((opt) => {
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
      setValue={(value) => setMessage(value, element)}
      getOptions={getOptions}
      debounce={debounce}
    />
  );
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
      (element.id === messageId || element.name === messageId)
  );
}

function createMessage(bpmnFactory, messageId) {
  return bpmnFactory.create('bpmn:Message', {
    id: messageId,
    name: messageId,
  });
}

function updateElementMessageRef(element, bpmnMessage, moddle, commandStack) {
  if (isMessageEvent(element) && element.businessObject) {
    const messageEventDefinition = element.businessObject.eventDefinitions[0];
    messageEventDefinition.extensionElements =
      messageEventDefinition.extensionElements
        ? messageEventDefinition.extensionElements
        : moddle.create('bpmn:ExtensionElements');
    messageEventDefinition.messageRef = bpmnMessage;
    commandStack.execute('element.updateModdleProperties', {
      element: element,
      moddleElement: element.businessObject,
      properties: {},
    });
  } else if (isMessageElement(element) && element.businessObject) {
    element.businessObject.extensionElements = element.businessObject
      .extensionElements
      ? element.businessObject.extensionElements
      : moddle.create('bpmn:ExtensionElements');
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
      identifier: messageObject.identifier,
      correlation_properties: messageObject.correlation_properties.map(
        (prop) => ({
          identifier: prop.identifier,
          retrieval_expression: prop.retrieval_expression,
        })
      ),
    };
  } else {
    return null;
  }
}
