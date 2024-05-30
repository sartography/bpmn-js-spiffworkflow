import React from 'react';
import { useService } from 'bpmn-js-properties-panel';
import { TextAreaEntry } from '@bpmn-io/properties-panel';
import {
  getMessageElementForShapeElement,
  isMessageEvent,
} from '../../MessageHelpers';

/**
 * Allows the creation, or editing of messagePayload at the bpmn:sendTask level of a BPMN document.
 */
export function MessagePayload(props) {
  const shapeElement = props.element;
  const { moddle, element, commandStack } = props;
  const debounce = useService('debounceInput');
  const messageElement = getMessageElementForShapeElement(shapeElement);
  const disabled = !messageElement;

  const getMessagePayloadObject = () => {
    if (element) {
      const { extensionElements } = isMessageEvent(element)
        ? element.businessObject.eventDefinitions[0]
        : element.businessObject;

      if (extensionElements) {
        let payloadResp = extensionElements
          .get('values')
          .filter(function getInstanceOfType(e) {
            return e.$instanceOf('spiffworkflow:MessagePayload');
          })[0];

        return payloadResp;
      }
    }
    return null;
  };

  const getValue = () => {
    const messagePayloadObject = getMessagePayloadObject();
    if (messagePayloadObject) {
      return messagePayloadObject.value;
    } else {
      // Check : for old models where payload exists on message level
      const bo = isMessageEvent(element)
        ? element.businessObject.eventDefinitions[0]
        : element.businessObject;

      const { messageRef } = bo;
      if (messageRef) {
        const { extensionElements } = messageRef;
        const payloadResp = extensionElements
          .get('values')
          .filter(function getInstanceOfType(e) {
            return e.$instanceOf('spiffworkflow:MessagePayload');
          })[0];

        if (payloadResp) {
          setValue(payloadResp.value);
          return payloadResp.value;
        }
      }
    }
    return '';
  };

  const setValue = (value) => {

    var extensions = isMessageEvent(element)
      ? element.businessObject.eventDefinitions[0].get('extensionElements') ||
      moddle.create('bpmn:ExtensionElements')
      : element.businessObject.get('extensionElements') ||
      moddle.create('bpmn:ExtensionElements');

    let messagePayloadObject = getMessagePayloadObject();
    if (!messagePayloadObject) {
      messagePayloadObject = moddle.create('spiffworkflow:MessagePayload');
      extensions.get('values').push(messagePayloadObject);
    }
    messagePayloadObject.value = value;

    isMessageEvent(element)
      ? element.businessObject.eventDefinitions[0].set(
        'extensionElements',
        extensions
      )
      : element.businessObject.set('extensionElements', extensions);

    commandStack.execute('element.updateProperties', {
      element,
      properties: {},
    });
  };

  return (
    <TextAreaEntry
      id="messagePayload"
      element={shapeElement}
      description="Enter a JSON object to define the message payload directly or provide the variable name that holds the payload data."
      label="Payload"
      disabled={disabled}
      getValue={getValue}
      setValue={setValue}
      debounce={debounce}
    />
  );
}
