import { useService } from 'bpmn-js-properties-panel';
import { TextAreaEntry } from '@bpmn-io/properties-panel';
import { findMessageModdleElements } from '../MessageHelpers';

/**
 * Allows the selection, or creation, of Message at the Definitions level of a BPMN document.
 */
export function MessagePayload(props) {
  const shapeElement = props.element;
  const { commandStack } = props;
  const debounce = useService('debounceInput');

  const getMessagePayloadObject = () => {
    const businessObject = shapeElement.businessObject;
    if (!businessObject.extensionElements) {
      return null;
    }
    return businessObject.extensionElements
      .get('values')
      .filter(function getInstanceOfType(e) {
        return e.$instanceOf('spiffworkflow:messagePayload');
      })[0];
  };

  const getValue = () => {
    const messagePayloadObject = getMessagePayloadObject();
    if (messagePayloadObject) {
      return messagePayloadObject.payload;
    }
    return '';
  };

  const setValue = (value) => {
    const { businessObject } = shapeElement;
    let MessagePayloadObject = getMessagePayloadObject();
    if (!MessagePayloadObject) {
      MessagePayloadObject = businessObject.$model.create('spiffworkflow:messagePayload');
      // if (type !== SCRIPT_TYPE.bpmn) {
        if (!businessObject.extensionElements) {
          businessObject.extensionElements = businessObject.$model.create(
            'bpmn:ExtensionElements'
          );
        }
        businessObject.extensionElements.get('values').push(MessagePayloadObject);
      // }
    }
    MessagePayloadObject.payload = value;
  };

  return (
    <TextAreaEntry
      id="messagePayload"
      element={shapeElement}
      description="The payload of the message."
      label="Payload"
      getValue={getValue}
      setValue={setValue}
      debounce={debounce}
    />
  );
}
