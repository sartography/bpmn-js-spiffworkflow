import { useService } from 'bpmn-js-properties-panel';
import { SelectEntry } from '@bpmn-io/properties-panel';
import { findMessageModdleElements } from '../MessageHelpers';

/**
 * Allows the selection, or creation, of Message at the Definitions level of a BPMN document.
 */
export function MessageSelect(props) {
  const shapeElement = props.element;
  const { commandStack } = props;
  const debounce = useService('debounceInput');

  const getValue = () => {
    if (shapeElement.businessObject.$type === 'bpmn:IntermediateThrowEvent') {
      const messageEventDefinition =
        shapeElement.businessObject.eventDefinitions[0];
      if (messageEventDefinition.messageRef) {
        return messageEventDefinition.messageRef.id;
      }
    } else if (
      shapeElement.businessObject.$type === 'bpmn:SendTask' &&
      shapeElement.businessObject.messageRef
    ) {
      return shapeElement.businessObject.messageRef.id;
    }
    return '';
  };

  const setValue = (value) => {
    /* Need to add the selected message as the messageRef on the current message task */
    const { businessObject } = shapeElement;
    const messages = findMessageModdleElements(shapeElement.businessObject);
    for (const message of messages) {
      if (message.id === value) {
        if (businessObject.$type === 'bpmn:IntermediateThrowEvent') {
          const messageEventDefinition = businessObject.eventDefinitions[0];
          messageEventDefinition.messageRef = message;
        } else if (businessObject.$type === 'bpmn:SendTask') {
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

  const getOptions = (_value) => {
    const messages = findMessageModdleElements(shapeElement.businessObject);
    const options = [];
    for (const message of messages) {
      options.push({ label: message.name, value: message.id });
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
