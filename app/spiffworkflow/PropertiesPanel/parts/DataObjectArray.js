import { useService } from 'bpmn-js-properties-panel';
import { getBusinessObject, is } from 'bpmn-js/lib/util/ModelUtil';
import { isTextFieldEntryEdited, TextFieldEntry } from '@bpmn-io/properties-panel';

/**
 * Provides a list of data objects, and allows you to add / remove data objects, and change their ids.
 * @param props
 * @constructor
 */
export function DataObjectArray(props) {
  const moddle = props.moddle;
  const element = props.dataElement;
  const process = getProcess(element);

  let dataObjects = [];
  for (const element of process.flowElements) {
    if (element.$type === 'bpmn:DataObject') {
      dataObjects.push(element);
    }
  }
  const items = dataObjects.map((dataObject, index) => {
    const id = element.id + '-dataObjects-' + index;
    return {
      id: id,
      label: dataObject.id,
      entries: [
        DataObjectGroup({
          idPrefix: id,
          element,
          dataObject
        })
      ],
      autoFocusEntry: dataObject.id,
      remove: remove
    };
  });

  function add(event) {
//    event.stopPropagation();
    console.log('PLEASE ADD A NEW DATA OBJECT');
  }

  function remove(event) {
//    event.stopPropagation();
    console.log('PLEASE REMOVE A DATA OBJECT');
  }

  console.log("About to return the following items:", items);

  return { items, add };
}

function DataObjectGroup(props) {
  const {
    idPrefix,
    element,
    dataObject
  } = props;

  let entries =
    {
      id: idPrefix + '-dataObject',
      component: DataObjectTextField,
      isEdited: isTextFieldEntryEdited,
      idPrefix,
      dataObject
    };

  console.log("Data Object Group", entries);
  return entries;
}


function DataObjectTextField(props) {
  console.log("The Text Field is Being Created");
  const {
    idPrefix,
    element,
    parameter
  } = props;

  const commandStack = useService('commandStack');
  const translate = useService('translate');
  const debounce = useService('debounceInput');


  const setValue = (value) => {
    console.log('set data object value ');
  };

  const getValue = (parameter) => {
    console.log('get data object value ');
  };

  return TextFieldEntry({
    element: parameter,
    id: idPrefix + '-name',
    label: 'Data Object Name',
    getValue,
    setValue,
    debounce
  });
}

function getProcess(element) {
  let parent = element.parent;
  return is(parent, 'bpmn:Process') ?
    getBusinessObject(parent) :
    getBusinessObject(parent).get('processRef');
}
