import { useService } from 'bpmn-js-properties-panel';
import { isTextFieldEntryEdited, TextFieldEntry } from '@bpmn-io/properties-panel';
import { without } from 'min-dash';
import { findDataObjects, findDataReferenceShapes } from '../../DataObject/DataObjectHelpers';
import { is } from 'bpmn-js/lib/util/ModelUtil';


export function findCorrelationKeys(element) {
  const correlationProperties = [];
  for (const rootElement of element.businessObject.$parent.rootElements) {
    if (rootElement.$type === "bpmn:CorrelationProperty") {
      correlationProperties.push(rootElement)
    }
  }
  return correlationProperties;
}

/**
 * Provides a list of data objects, and allows you to add / remove data objects, and change their ids.
 * @param props
 * @constructor
 */
export function CorrelationKeysArray(props) {
  const moddle = props.moddle;
  const element = props.element;
  const commandStack = props.commandStack;
  const elementRegistry = props.elementRegistry;

  let correlationProperties = findCorrelationKeys(element);
  const items = correlationProperties.map((correlationProperty, index) => {
    const id = `correlation-${correlationProperty.id}`;
    return {
      id: id,
      label: correlationProperty.id,
      entries:
        CorrelationKeyGroup({
          id: id,
          element,
          correlationProperty
        })
      ,
      autoFocusEntry: id,
      // remove: removeFactory({ element, correlationProperty, commandStack, elementRegistry })
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

function CorrelationKeyGroup(props) {
  const {
    idPrefix,
    correlationProperty
  } = props;

  let entries = [
    {
      id: `${idPrefix}-group`,
      component: CorrelationKeyGroup,
      isEdited: isTextFieldEntryEdited,
      idPrefix,
      correlationProperty
    }
  ];
  return entries;
}


function CorrelationKeyTextField(props) {
  const {
    idPrefix,
    element,
    parameter,
    correlationProperty
  } = props;

  const commandStack = useService('commandStack');
  const debounce = useService('debounceInput');

  const setValue = (value) => {
    // commandStack.execute(
    //   'element.updateModdleProperties',
    //   {
    //     element,
    //     moddleElement: correlationProperty,
    //     properties: {
    //       'id': value
    //     }
    //   }
    // );
    //
    // // Also update the label of all the references
    // let references = findDataReferenceShapes(element, correlationProperty.id);
    // for (const ref of references) {
    //   commandStack.execute('element.updateProperties', {
    //     element: ref,
    //     moddleElement: ref.businessObject,
    //     properties: {
    //       'name': value
    //     },
    //     changed:[ ref ] // everything is already marked as changed, don't recalculate.
    //   });
    // }
  };

  const getValue = (parameter) => {
    return "";
    // return correlationProperty.id;
  };

  return TextFieldEntry({
    element: parameter,
    id: idPrefix + '-textField',
    label: 'Correlation Key',
    getValue,
    setValue,
    debounce
  });
}

