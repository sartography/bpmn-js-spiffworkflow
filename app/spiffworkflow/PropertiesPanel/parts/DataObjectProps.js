import {  SelectEntry, isTextFieldEntryEdited} from '@bpmn-io/properties-panel';
import {useService} from 'bpmn-js-properties-panel';

/**
 * Allows for the creation and deletion of Data Objects
 * and connecting those data objects to Data References.
 * @param dataElement The selected Data Object Reference
 * @param moddle For updating the underlying xml object
 * @returns {[{component: (function(*)), isEdited: *, id: string, element},{component: (function(*)), isEdited: *, id: string, element}]}
 */
export default function (dataElement, moddle) {
  return [
    {
      id: 'dataObjects',
      dataElement,
      component: DataObjectSelector,
      isEdited: isTextFieldEntryEdited,
      moddle: moddle,
    },
  ];
}

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
function DataObjectSelector(props) {
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

  return <SelectEntry
    id={'selectDataObject'}
    element={element}
    description={"Select the Data Object this represents."}
    label={"Which Data Object does this reference?"}
    getValue={ getValue }
    setValue={ setValue }
    getOptions={ getOptions }
    debounce={debounce}
  />;
}
