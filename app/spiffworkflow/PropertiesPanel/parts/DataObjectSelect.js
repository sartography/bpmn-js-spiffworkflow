import {useService } from 'bpmn-js-properties-panel';
import { SelectEntry } from '@bpmn-io/properties-panel';

/**
 * Finds the value of the given type within the extensionElements
 * given a type of "spiff:preScript", would find it in this, and retnr
 * the object.
 *
 *  <bpmn:
 <bpmn:userTask id="123" name="My User Task!">
 <bpmn:extensionElements>
 <spiff:preScript>
 me = "100% awesome"
 </spiff:preScript>
 </bpmn:extensionElements>
 ...
 </bpmn:userTask>
 *
 * @returns {string|null|*}
 */
export function DataObjectSelect(props) {
  const moddle = props.moddle;
  const id = props.id;
  const element = props.element;
  const debounce = useService('debounceInput');


  const getValue = () => {
    return element.businessObject.dataObjectRef.id
  }

  const setValue = value => {
    const businessObject = element.businessObject;
    for (const element of businessObject.$parent.flowElements) {
      if (element.$type === 'bpmn:DataObject' && element.id === value) {
        businessObject.dataObjectRef = element;
      }
    }
  }

  const getOptions = value => {
    console.log("Hey there (options)!")
    const businessObject = element.businessObject;
    const parent = businessObject.$parent;
    let options = []
    for (const element of parent.flowElements) {
      if (element.$type === 'bpmn:DataObject') {
        options.push({label: element.id, value: element.id})
      }
    }
    return options
  }

  const select = <SelectEntry
    id={'selectDataObject'}
    element={element}
    description={"Select the Data Object this represents."}
    label={"Which Data Object does this reference?"}
    getValue={ getValue }
    setValue={ setValue }
    getOptions={ getOptions }
    debounce={debounce}
  />;
  console.log("Returning this:", select)
  return select

}
