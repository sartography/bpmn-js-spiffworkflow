import React from 'react';
import { useEffect, useState } from '@bpmn-io/properties-panel/preact/hooks';
import { useService } from 'bpmn-js-properties-panel';
import { SelectEntry } from '@bpmn-io/properties-panel';
import {
  createOrUpdateCorrelationPropertiesV2,
  findMessageModdleElements,
  getMessageRefElement,
  getRoot,
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

  const setMessage = async (value, targetElement, savedMessage) => {
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
      commandStack.execute('spiff.message.update', {
        update: (set) => {
          set(moddleElement, 'messageRef', undefined);
          const extensions = moddleElement.extensionElements;
          if (extensions?.values) {
            set(
              extensions,
              'values',
              extensions.values.filter(
                (extension) =>
                  extension.$type !== 'spiffworkflow:ProcessVariableCorrelation'
              )
            );
          }
        },
      });
      return;
    }

    // Never silently duplicate a live id: claiming it would corrupt the id
    // index and export duplicate BPMN ids.
    if (
      !findMessageById(definitions, messageId) &&
      moddle.ids.assigned(messageId)
    ) {
      // eslint-disable-next-line no-console
      console.warn(`message id <${messageId}> is already in use`);
      return;
    }

    commandStack.execute('spiff.message.update', {
      update: (set) => {
        let bpmnMessage = findMessageById(definitions, messageId);
        if (!bpmnMessage) {
          bpmnMessage = createMessage(bpmnFactory, messageId);
          set(definitions, 'rootElements', [
            ...definitions.rootElements,
            bpmnMessage,
          ]);
        }
        const host = isMessageEvent(targetElement)
          ? businessObject.eventDefinitions[0]
          : businessObject;
        if (!host.extensionElements) {
          set(
            host,
            'extensionElements',
            moddle.create('bpmn:ExtensionElements')
          );
        }
        set(host, 'messageRef', bpmnMessage);
        const messageObject =
          savedMessage ||
          findMessageObject(bpmnMessage.name) ||
          findMessageObject(messageId);
        if (messageObject) {
          createOrUpdateCorrelationPropertiesV2(
            bpmnFactory,
            commandStack,
            targetElement,
            messageObject.correlation_properties,
            bpmnMessage.id,
            set
          );
        }
        if (oldMessageRef) {
          syncCorrelationProperties(
            targetElement,
            definitions,
            moddle,
            messageObject,
            set
          );
        }
        setParentCorrelationKeys(
          definitions,
          bpmnFactory,
          targetElement,
          moddle,
          set
        );
      },
    });
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

    // Give the host a command-backed action that remains usable when this panel
    // unmounts while its external message editor is open.
    const prepareMessageEditor = (event) => {
      if (event.value?.elementId !== element.id) return;
      event.element = element;
      event.applyMessage = (message) => {
        if (elementRegistry.get(element.id) !== element) return;
        return setMessage(message.identifier, element, message);
      };
    };
    eventBus.on('spiff.message.edit', 1500, prepareMessageEditor);
    eventBus.on('spiff.messages.returned', handleMessagesReturned);
    eventBus.on(SPIFF_ADD_MESSAGE_RETURNED_EVENT, handleAddMessageReturned);
    eventBus.fire('spiff.messages.requested', { eventBus });

    return () => {
      eventBus.off('spiff.message.edit', prepareMessageEditor);
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
          value:
            messages.find((message) => message.name === opt.identifier)?.id ||
            opt.identifier,
        });
      });
    }

    // Remove duplicated options
    const uniqueArray = removeDuplicatesByValue(options);
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

function removeDuplicatesByValue(array) {
  const seen = new Map();
  return array.filter((item) => {
    return seen.has(item.value) ? false : seen.set(item.value, true);
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
