import { Group, ListGroup, SelectEntry, isTextFieldEntryEdited, TextEntry } from '@bpmn-io/properties-panel';
import {useService} from 'bpmn-js-properties-panel';
import {getBusinessObject} from 'bpmn-js/lib/util/ModelUtil';
import {remove as collectionRemove} from 'diagram-js/lib/util/Collections';

/**
 * Allows you to associate the selected Data Reference to a
 * data object.  Many references can point to the same data object.
 * Also allows you to select which Data Objects are available
 * in the system overall.
 * @param dataElement The selected Data Object Reference
 * @param moddle For updating the underlying xml object
 * @returns {[{component: (function(*)), isEdited: *, id: string, element},{component: (function(*)), isEdited: *, id: string, element}]}
 */
export default function (dataElement, moddle) {

  return [
    {
      id: 'selectDataObject',
      dataElement,
      component: DataObjectSelector,
      isEdited: isTextFieldEntryEdited,
      moddle: moddle,
    },
    {
      id: 'editDataObjects',
      dataElement,
      label: 'Available Data Objects',
      component: Group,
      entries: [
        ...DataObjectProps({dataElement, moddle})
      ]
    }
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

/**
 * Provides a list of data objects, and allows you to add / remove data objects, and change their ids.
 * @param props
 * @constructor
 */
function DataObjectProps(props) {

  const moddle = props.moddle;
  const id = props.id;
  const element = props.dataElement;

  const businessObject = element.businessObject;
  const parent = businessObject.$parent;

  let dataObjects = []
  for (const element of parent.flowElements) {
    if (element.$type === 'bpmn:DataObject') {
      dataObjects.push(element)
    }
  }

  const entries = dataObjects.map((dataObject, index) => {

    return {
      id: dataObject.id,
      label: dataObject.id,
      autoFocusEntry: dataObject.id,
      remove: removeDataObject({ dataObject })
    };
  });

  return entries

  function removeDataObject({ dataObject }) {
    return function(event) {
      const parent = dataObject.$parent
      collectionRemove(parent, dataObject);
    };
  }

  function addFactory({ bpmnFactory, commandStack, element }) {
    return function(event) {
      event.stopPropagation();

      const businessObject = element.businessObject.$parent;
      businessObject.add('bpmn:DataObject')
    };
  }



}
