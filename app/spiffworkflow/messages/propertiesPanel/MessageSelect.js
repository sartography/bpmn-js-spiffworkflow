import { useService } from 'bpmn-js-properties-panel';
import { SelectEntry } from '@bpmn-io/properties-panel';
import {
  createOrUpdateCorrelationProperties,
  findCorrelationPropertiesAndRetrievalExpressionsForMessage,
  findMessageModdleElements,
  getMessageRefElement,
  isMessageEvent,
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

  const setValue = (value) => {

    const messageId = value;

    const { businessObject } = shapeElement;

    /* Need to add the selected message as the messageRef on the current message task */
    // const messages = spiffExtensionOptions['spiff.messages']
    const messages = findMessageModdleElements(shapeElement.businessObject);

    // Check if message selected is already created

    // Message Creation

    // console.log('setValue ', messageId);
    // console.log('spiffExtensionOptions', spiffExtensionOptions);
    // console.log('businessObject ', businessObject);
    // console.log('messages', messages);
    // console.log('commandStack', commandStack);

    // Add DataStore to the BPMN model
    const process = element.businessObject.$parent;
    const definitions = process.$parent;
    if (!definitions.get('rootElements')) {
      definitions.set('rootElements', []);
    }

    // console.log('process', process);
    // console.log('definitions', definitions);

    // Retrieve Message
    let bpmnMessage = definitions.get('rootElements').find(element =>
      element.$type === 'bpmn:Message' && element.name === messageId
    );

    // If the Message doesn't exist, create new one
    if (!bpmnMessage) {
      bpmnMessage = bpmnFactory.create('bpmn:Message', {
        name: messageId
      });
      definitions.get('rootElements').push(bpmnMessage);
    }

    // Update Element messageReg with new Message Created
    commandStack.execute('element.updateModdleProperties', {
      element: shapeElement,
      moddleElement: businessObject,
      properties: {
        messageRef: bpmnMessage,
      },
    });

    createOrUpdateCorrelationProperties(bpmnFactory, commandStack, element, definitions, spiffExtensionOptions['spiff.correlation_properties'], messageId)

    return;

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
    return options;
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

