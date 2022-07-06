import { useService } from 'bpmn-js-properties-panel';
import { isTextFieldEntryEdited, TextFieldEntry } from '@bpmn-io/properties-panel';
import { remove as collectionRemove } from 'diagram-js/lib/util/Collections';
import { without } from 'min-dash';

/**
 * Provides a list of data objects, and allows you to add / remove data objects, and change their ids.
 * @param props
 * @constructor
 */
export function DataObjectArray(props) {
  const moddle = props.moddle;
  const element = props.element;
  const process = props.element.businessObject;
  const commandStack = props.commandStack;
  const elementRegistry = props.elementRegistry;


  let dataObjects = findDataObjects(process);
  const items = dataObjects.map((dataObject, index) => {
    const id = process.id + '-dataObj-' + index;
    return {
      id: id,
      label: dataObject.id,
      entries:
        DataObjectGroup({
          idPrefix: id,
          element,
          dataObject
        })
      ,
      autoFocusEntry: id + '-dataObject',
      remove: removeFactory({ element, dataObject, process, commandStack, elementRegistry })
    };
  });

  function add(event) {
    event.stopPropagation();
    let newDo = moddle.create('bpmn:DataObject');
    let newElements = process.get('flowElements');
    newDo.id = moddle.ids.nextPrefixed('DataObject_');
    newElements.push(newDo);
    commandStack.execute('element.updateModdleProperties', {
      element,
      moddleElement: process,
      properties: {
        flowElements: newElements
      }
    });
  }

  return { items, add };
}

function removeFactory(props) {
  const {
    element,
    dataObject,
    process,
    commandStack,
    elementRegistry
  } = props;


  return function(event) {
    event.stopPropagation();
    commandStack.execute('element.updateModdleProperties', {
      element,
      moddleElement: process,
      properties: {
        flowElements: without(process.get('flowElements'), dataObject)
      }
    });
  };
}


function findDataObjects(process) {
  let dataObjects = [];
  for (const element of process.flowElements) {
    if (element.$type === 'bpmn:DataObject') {
      dataObjects.push(element);
    }
  }
  return dataObjects;
}

export function findDataObject(process, id) {
  for (const dataObj of findDataObjects(process)) {
    if (dataObj.id == id) {
      return dataObj;
    }
  }
}

function DataObjectGroup(props) {
  const {
    idPrefix,
    element,
    dataObject
  } = props;

  let entries = [
    {
      id: idPrefix + '-dataObject',
      component: DataObjectTextField,
      isEdited: isTextFieldEntryEdited,
      idPrefix,
      dataObject
    }
  ];
  return entries;
}


function DataObjectTextField(props) {
  const {
    idPrefix,
    element,
    parameter,
    dataObject
  } = props;

  const commandStack = useService('commandStack');
  const translate = useService('translate');
  const debounce = useService('debounceInput');

  const setValue = (value) => {
    return commandStack.execute(
      'element.updateModdleProperties',
      {
        element,
        moddleElement: dataObject,
        properties: {
          'id': value
        }
      }
    );
  };



  const getValue = (parameter) => {
    return dataObject.id;
  };

  return TextFieldEntry({
    element: parameter,
    id: idPrefix + '-id',
    label: 'Data Object Id',
    getValue,
    setValue,
    debounce
  });
}

