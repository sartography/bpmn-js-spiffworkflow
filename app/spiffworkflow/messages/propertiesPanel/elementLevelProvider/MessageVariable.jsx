import React from 'react';
import { useService } from 'bpmn-js-properties-panel';
import { TextFieldEntry } from '@bpmn-io/properties-panel';
import { getMessageElementForShapeElement, isMessageEvent } from '../../MessageHelpers';

/**
 * Allows the creation, or editing of messageVariable at the bpmn:sendTask level of a BPMN document.
 */
export function MessageVariable(props) {
  const shapeElement = props.element;
  const { moddle, element, commandStack } = props;
  const debounce = useService('debounceInput');
  const messageElement = getMessageElementForShapeElement(shapeElement);
  const disabled = !messageElement;

  const getMessageVariableObject = () => {
    if (element) {
      const { extensionElements } = (isMessageEvent(element)) ? element.businessObject.eventDefinitions[0] : element.businessObject;
      if (extensionElements) {
        return extensionElements
          .get('values')
          .filter(function getInstanceOfType(e) {
            return e.$instanceOf('spiffworkflow:MessageVariable');
          })[0];
      }
    }
    return null;
  };

  const getValue = () => {
    const messageVariableObject = getMessageVariableObject();
    if (messageVariableObject) {
      return messageVariableObject.value;
    }
    return '';
  };

  const setValue = (value) => {
    var extensions = (isMessageEvent(element)) ?
      element.businessObject.eventDefinitions[0].get('extensionElements') || moddle.create('bpmn:ExtensionElements') :
      element.businessObject.get('extensionElements') || moddle.create('bpmn:ExtensionElements');

    let messageVariableObject = getMessageVariableObject();
    if (!messageVariableObject) {
      messageVariableObject = moddle.create(
        'spiffworkflow:MessageVariable'
      );
      extensions
        .get('values')
        .push(messageVariableObject);
    }
    messageVariableObject.value = value;
    (isMessageEvent(element)) ? element.businessObject.eventDefinitions[0].set('extensionElements', extensions) : element.businessObject.set('extensionElements', extensions);
    commandStack.execute('element.updateProperties', {
      element,
      properties: {},
    });
  };

  return (
    <TextFieldEntry
      id="messageVariable"
      element={shapeElement}
      description="The name of the variable where we should store payload."
      label="Variable Name"
      disabled={disabled}
      getValue={getValue}
      setValue={setValue}
      debounce={debounce}
    />
  );
}
