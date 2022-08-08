import {useService } from 'bpmn-js-properties-panel';
import { SelectEntry } from '@bpmn-io/properties-panel';
import {findMessages} from '../MessageHelpers';

/**
 * Allows the selection, or creation, of Message at the Definitions level of a BPMN document.
 */
export function MessageSelect(props) {
  const shapeElement = props.element;
  const commandStack = props.commandStack;
  const debounce = useService('debounceInput');

  const getValue = () => {
    return "";
  }

  const setValue = value => {
    return;
    /*
    const businessObject = element.businessObject;
    for (const flowElem of businessObject.$parent.flowElements) {
      if (flowElem.$type === 'bpmn:DataObject' && flowElem.id === value) {
        commandStack.execute('element.updateModdleProperties', {
          element,
          moddleElement: businessObject,
          properties: {
            dataObjectRef: flowElem
          }
        });
        commandStack.execute('element.updateProperties', {
          element,
          moddleElement: businessObject,
          properties: {
            'name': flowElem.id
          }
        });
      }
    }
  */
  }

  const getOptions = value => {
    const messages = findMessages(shapeElement.businessObject)
    let options = []
    for (const message of messages) {
      options.push({label: message.id, value: message.name})
    }
    return options
  }

  return <SelectEntry
    id={'selectMessage'}
    element={shapeElement}
    description={"Select the Message to associate with this task or event."}
    label={"Which message is this associated with?"}
    getValue={ getValue }
    setValue={ setValue }
    getOptions={ getOptions }
    debounce={debounce}
  />;

}
