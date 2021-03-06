import { useService } from 'bpmn-js-properties-panel';
import { isTextFieldEntryEdited, TextFieldEntry } from '@bpmn-io/properties-panel';
import { without } from 'min-dash';
import { findDataObjects, findDataReferenceShapes } from '../../DataObject/DataObjectHelpers';
import { is } from 'bpmn-js/lib/util/ModelUtil';

/**
 * Provides a list of data objects, and allows you to add / remove data objects, and change their ids.
 * @param props
 * @constructor
 */
export function DataObjectArray(props) {
  const moddle = props.moddle;
  const element = props.element;
  const commandStack = props.commandStack;
  const elementRegistry = props.elementRegistry;
  let process;

  // This element might be a process, or something that will reference a process.
  if (is(element.businessObject, 'bpmn:Process')) {
    process = element.businessObject;
  } else if (element.businessObject.processRef) {
    process = element.businessObject.processRef;
  }

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
    let newDataObject = moddle.create('bpmn:DataObject');
    let newElements = process.get('flowElements');
    newDataObject.id = moddle.ids.nextPrefixed('DataObject_');
    newElements.push(newDataObject);
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
    // Also update the label of all the references
    let references = findDataReferenceShapes(element, dataObject.id);
    for (const ref of references) {
      commandStack.execute('element.updateProperties', {
        element: ref,
        moddleElement: ref.businessObject,
        properties: {
          'name': '???'
        },
        changed:[ ref ] // everything is already marked as changed, don't recalculate.
      });
    }
  };
}

function DataObjectGroup(props) {
  const {
    idPrefix,
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
  const debounce = useService('debounceInput');

  const setValue = (value) => {
    commandStack.execute(
      'element.updateModdleProperties',
      {
        element,
        moddleElement: dataObject,
        properties: {
          'id': value
        }
      }
    );

    // Also update the label of all the references
    let references = findDataReferenceShapes(element, dataObject.id);
    for (const ref of references) {
      commandStack.execute('element.updateProperties', {
        element: ref,
        moddleElement: ref.businessObject,
        properties: {
          'name': value
        },
        changed:[ ref ] // everything is already marked as changed, don't recalculate.
      });
    }
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

