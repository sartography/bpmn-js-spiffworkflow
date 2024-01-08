import { useService } from 'bpmn-js-properties-panel';
import { SelectEntry } from '@bpmn-io/properties-panel';
import {
  findMessageModdleElements,
  getMessageRefElement,
  isMessageEvent,
} from '../MessageHelpers';
import {spiffExtensionOptions} from "../../extensions/propertiesPanel/SpiffExtensionSelect";


export const availableMessages = {
  messages: null,
  correlationKeys: null,
  correlationProperties: null,
};

/**
 * Allows the selection, or creation, of Message at the Definitions level of a BPMN document.
 */
export function MessageSelect(props) {
  const shapeElement = props.element;
  const { commandStack } = props;
  const debounce = useService('debounceInput');
  const eventBus = useService('eventBus');

  const getValue = () => {
    const messageRefElement = getMessageRefElement(shapeElement);
    console.log("The business Object event def is ", shapeElement.businessObject.eventDefinitions[0]);
    return shapeElement.businessObject.messageRef;
    /*
    const messageRefElement = getMessageRefElement(shapeElement);
    if (messageRefElement) {
      return messageRefElement.id;
    }
    return '';
    */
  };

  const setValue = (value) => {
    const { businessObject } = shapeElement;
    commandStack.execute('element.updateModdleProperties', {
      element: shapeElement,
      moddleElement: businessObject,
      properties: {
        messageRef: value,
      },
    });


    /* Need to add the selected message as the messageRef on the current message task */
    /*
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
`      */
  };

  if (spiffExtensionOptions.messages === null || spiffExtensionOptions.messages === undefined) {
    requestMessageOptions(eventBus);
  }
  const getOptions = (_value) => {
    const options = [];
    if (availableMessages.messages !== null) {
      availableMessages.messages.forEach((message) => {
        options.push({label: message.id, value: message.id});
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


function requestMessageOptions(eventBus) {
  // Little backwards, but you want to assure you are ready to catch, before you throw
  // or you risk a race condition.
  eventBus.on(`spiff.messages.returned`, (event) => {
    availableMessages.messages = event.messages;
    availableMessages.correlationKeys = event.correlation_keys;
    availableMessages.correlationProperties = event.correlation_properties;
  });
  eventBus.fire(`spiff.messages.requested`, { eventBus });
}
