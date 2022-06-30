import {HeaderButton, TextAreaEntry, TextFieldEntry, isTextFieldEntryEdited} from '@bpmn-io/properties-panel';
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

  /**
   * Returns a list of all the data business objects.
   * @returns {string|null|*}
   */
  const findDataObjects = () => {
    // Find the parent process of this business object.
    const businessObject = element.businessObject;
    const parent = businessObject.parent

  };

  const getValue = () => {
    return ""
  }

  const setValue = value => {
    return ""
  }


  return <TextAreaEntry
    id={id}
    element={element}
    description={"My Text Area"}
    label={"Help me!"}
    getValue={ getValue }
    setValue={ setValue }
    debounce={debounce}
  />;
}
