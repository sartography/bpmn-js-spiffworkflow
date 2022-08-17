import { useService } from 'bpmn-js-properties-panel';
import { TextFieldEntry } from '@bpmn-io/properties-panel';
import {
  findMessageModdleElements,
  getMessageRefElement,
} from '../MessageHelpers';

/**
 * Allows the creation, or editing of messageVariable at the bpmn:sendTask level of a BPMN document.
 */
export function MessageVariable(props) {
  const shapeElement = props.element;
  const debounce = useService('debounceInput');

  const getMessageVariableObject = () => {
    const { businessObject } = shapeElement;
    const taskMessage = getMessageRefElement(shapeElement);
    const messages = findMessageModdleElements(businessObject);
    if (taskMessage) {
      for (const message of messages) {
        if (message.id === taskMessage.id) {
          const { extensionElements } = message;
          if (extensionElements) {
            return message.extensionElements
              .get('values')
              .filter(function getInstanceOfType(e) {
                return e.$instanceOf('spiffworkflow:messageVariable');
              })[0];
          }
        }
      }
    }
    return null;
  };

  const getValue = () => {
    const messageVariableObject = getMessageVariableObject();
    // console.log('messageVariableObject', messageVariableObject);
    if (messageVariableObject) {
      return messageVariableObject.messageVariable;
    }
    return '';
  };

  const setValue = (value) => {
    const { businessObject } = shapeElement;
    let messageVariableObject = getMessageVariableObject();
    // console.log('messageVariableObject', messageVariableObject);
    if (!messageVariableObject) {
      messageVariableObject = businessObject.$model.create(
        'spiffworkflow:messageVariable'
      );
      if (!businessObject.extensionElements) {
        businessObject.extensionElements = businessObject.$model.create(
          'bpmn:ExtensionElements'
        );
      }
      businessObject.extensionElements
        .get('values')
        .push(messageVariableObject);
    }
    messageVariableObject.messageVariable = value;
  };

  return (
    <TextFieldEntry
      id="messageVariable"
      element={shapeElement}
      description="The name of the variable where we should store payload."
      label="Variable Name"
      getValue={getValue}
      setValue={setValue}
      debounce={debounce}
    />
  );
}
