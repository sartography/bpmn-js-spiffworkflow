import React from 'react';
import { useService } from 'bpmn-js-properties-panel';
import { SelectEntry } from '@bpmn-io/properties-panel';
import {
  createOrUpdateCorrelationProperties,
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

export const spiffExtensionOptions = {};

/**
 * Allows the selection, or creation, of Message at the Definitions level of a BPMN document.
 */
export function MessageSelect(props) {
  const shapeElement = props.element;
  const { commandStack, element, moddle } = props;
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

    // Define variables
    const messageId = value;
    const { businessObject } = element;
    let oldMessageRef = (businessObject.eventDefinitions) ? businessObject.eventDefinitions[0].messageRef : businessObject.messageRef;

    let definitions = getRoot(element.businessObject);
    if (!definitions.get('rootElements')) {
      definitions.set('rootElements', []);
    }

    // Retrieve Message
    let bpmnMessage = definitions
      .get('rootElements')
      .find(
        (element) =>
          element.$type === 'bpmn:Message' &&
          (element.id === messageId || element.name === messageId),
      );

    // If the Message doesn't exist, create new one
    if (!bpmnMessage) {
      bpmnMessage = bpmnFactory.create('bpmn:Message', {
        id: messageId,
        name: messageId,
      });
      definitions.get('rootElements').push(bpmnMessage);
    }

    // Update messageRef of current Element
    if (isMessageEvent(shapeElement)) {
      element.businessObject.eventDefinitions[0].set(
        'extensionElements',
        moddle.create('bpmn:ExtensionElements'),
      ); // Clear extension element
      const messageEventDefinition = element.businessObject.eventDefinitions[0];
      messageEventDefinition.messageRef = bpmnMessage;
      // call this to update the other elements in the props panel like payload
      commandStack.execute('element.updateModdleProperties', {
        element: element,
        moddleElement: element.businessObject,
        properties: {},
      });
    } else if (isMessageElement(shapeElement)) {
      element.businessObject.set(
        'extensionElements',
        moddle.create('bpmn:ExtensionElements'),
      ); // Clear extension element
      element.businessObject.messageRef = bpmnMessage;
      commandStack.execute('element.updateProperties', {
        element: element,
        properties: {},
      });
    }

    // Add Correlation Properties of for the new message
    const msgObject = spiffExtensionOptions['spiff.messages']
      ? spiffExtensionOptions['spiff.messages'].find(
        (msg) => msg.identifier === messageId,
      )
      : undefined;

    if (msgObject) {
      createOrUpdateCorrelationPropertiesV2(
        bpmnFactory,
        commandStack,
        element,
        msgObject['correlation_properties'],
        messageId,
      );
    }

    if (oldMessageRef) {

      // Remove previous message in case it's not used anymore
      const isOldMessageUsed = isMessageRefUsed(definitions, oldMessageRef.id);
      if (!isOldMessageUsed) {
        const rootElements = definitions.get('rootElements');
        const oldMessageIndex = rootElements.findIndex(
          (element) =>
            element.$type === 'bpmn:Message' && element.id === oldMessageRef.id,
        );
        if (oldMessageIndex !== -1) {
          rootElements.splice(oldMessageIndex, 1);
          definitions.rootElements = rootElements;
        }
      }

      // Automatic deletion of previous message correlation properties
      synCorrleationProperties(element, definitions, moddle);
    }

    // Update Correlation key if Process has collaboration
    try {
      setParentCorrelationKeys(definitions, bpmnFactory, element, moddle);
    } catch (error) {
      console.error('Error Caught while synchronizing Correlation key', error);
    }

  };

  eventBus.on(`spiff.add_message.returned`, (event) => {
    const cProperties = Object.entries(event.correlation_properties).map(([identifier, properties]) => ({
      identifier,
      retrieval_expression: properties.retrieval_expressions[0]
    }));
    let newMsg = {
      identifier: event.name,
      correlation_properties: cProperties
    };
    spiffExtensionOptions['spiff.messages'] = (Array.isArray(spiffExtensionOptions['spiff.messages']) && spiffExtensionOptions['spiff.messages']) ? spiffExtensionOptions['spiff.messages'] : [];
    spiffExtensionOptions['spiff.messages'].push(newMsg);
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
