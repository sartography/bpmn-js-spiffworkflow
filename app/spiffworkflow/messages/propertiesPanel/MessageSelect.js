import { useService } from 'bpmn-js-properties-panel';
import { SelectEntry } from '@bpmn-io/properties-panel';
import {
  createOrUpdateCorrelationProperties,
  findMessageModdleElements,
  getMessageRefElement,
  getRoot,
  isMessageElement,
  isMessageEvent,
  isMessageRefUsed,
} from '../MessageHelpers';

export const spiffExtensionOptions = {};

/**
 * Allows the selection, or creation, of Message at the Definitions level of a BPMN document.
 */
export function MessageSelect(props) {
  const shapeElement = props.element;
  const { commandStack, element } = props;
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
    const oldMessageRef = businessObject.messageRef;

    let definitions = getRoot(element.businessObject);
    if (!definitions.get('rootElements')) {
      definitions.set('rootElements', []);
    }

    // Retrieve Message
    let bpmnMessage = definitions.get('rootElements').find(element =>
      element.$type === 'bpmn:Message' && (element.id === messageId || element.name === messageId)
    );

    // If the Message doesn't exist, create new one
    if (!bpmnMessage) {
      bpmnMessage = bpmnFactory.create('bpmn:Message', {
        id: messageId,
        name: messageId
      });
      definitions.get('rootElements').push(bpmnMessage);
    }

    // Update messageRef of current Element
    if (isMessageEvent(shapeElement)) {
      const messageEventDefinition = element.businessObject.eventDefinitions[0];
      messageEventDefinition.messageRef = bpmnMessage;
      // call this to update the other elements in the props panel like payload
      commandStack.execute('element.updateModdleProperties', {
        element: element,
        moddleElement: element.businessObject,
        properties: {}
      });
    } else if (isMessageElement(shapeElement)) {
      element.businessObject.messageRef = bpmnMessage;
      commandStack.execute('element.updateProperties', {
        element: element,
        properties: {},
      });
    }

    // Add Correlation Properties of for the new message
    createOrUpdateCorrelationProperties(bpmnFactory, commandStack, element, spiffExtensionOptions['spiff.correlation_properties'], messageId);

    // Remove previous message in case it's not used anymore
    if (oldMessageRef && !isMessageRefUsed(definitions, oldMessageRef)) {
      const rootElements = definitions.get('rootElements');
      const oldMessageIndex = rootElements.findIndex(element => element.$type === 'bpmn:Message' && element.id === oldMessageRef.id);

      if (oldMessageIndex !== -1) {
        rootElements.splice(oldMessageIndex, 1);
        definitions.rootElements = rootElements;
      }
    }

  };

  const oldsetValue = (value) => {
    const messages = findMessageModdleElements(shapeElement.businessObject);
    for (const message of messages) {
      if (message.id === value) {
        if (isMessageEvent(shapeElement)) {
          const messageEventDefinition = businessObject.eventDefinitions[0];
          messageEventDefinition.messageRef = message;
          // call this to update the other elements in the props panel like payload
          commandStack.execute('element.updateModdleProperties', {
            element: shapeElement,
            moddleElement: businessObject,
            properties: {
              messageRef: message,
            },
          });
        } else if (
          businessObject.$type === 'bpmn:ReceiveTask' ||
          businessObject.$type === 'bpmn:SendTask'
        ) {
          commandStack.execute('element.updateModdleProperties', {
            element: shapeElement,
            moddleElement: businessObject,
            properties: {
              messageRef: message,
            },
          });
          commandStack.execute('element.updateProperties', {
            element: shapeElement,
            moddleElement: businessObject,
            properties: {
              messageRef: message,
            },
          });
        }
      }
    }
  };

  requestOptions(eventBus);

  const getOptions = (_value) => {
    const messages = findMessageModdleElements(shapeElement.businessObject);
    const options = [];
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
          label: opt.id,
          value: opt.id,
        });
      });
    }
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

function requestOptions(eventBus) {
  eventBus.on(`spiff.messages.returned`, (event) => {
    spiffExtensionOptions['spiff.messages'] = event.configuration.messages;
    spiffExtensionOptions['spiff.correlation_keys'] = event.configuration.correlation_keys;
    spiffExtensionOptions['spiff.correlation_properties'] = event.configuration.correlation_properties;
  });
  eventBus.fire(`spiff.messages.requested`, { eventBus });
}

function removeDuplicatesByLabel(array) {
  const seen = new Map();
  return array.filter(item => {
    return seen.has(item.label) ? false : seen.set(item.label, true);
  });
}
