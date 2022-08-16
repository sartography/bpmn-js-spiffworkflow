import { useService } from 'bpmn-js-properties-panel';
import {
  isTextFieldEntryEdited, ListGroup,
  TextFieldEntry,
} from '@bpmn-io/properties-panel';
import { without } from 'min-dash';
import { is } from 'bpmn-js/lib/util/ModelUtil';
import {
  findDataObjects,
  findDataReferenceShapes,
} from '../../DataObject/DataObjectHelpers';
import { findCorrelationProperties, findCorrelationKeys, getRoot } from '../MessageHelpers';



/**
 * Provides a list of data objects, and allows you to add / remove data objects, and change their ids.
 * @param props
 * @constructor
 */
export function CorrelationKeysArray(props) {
  const { moddle } = props;
  const { element } = props; // fixme:  Is it a shape or a moddle element?
  const { commandStack } = props;
  const { elementRegistry } = props;

  const correlationProperties = findCorrelationKeys(element.businessObject);
  const items = correlationProperties.map((correlationProperty, index) => {
    const id = `correlationGroup-${correlationProperty.name}`;
    return {
      id,
      correlationProperty,
      label: correlationProperty.name,
      entries: correlationProperty.refs,
      // entries: correlationGroup({
      //   id,
      //   element,
      //   correlationProperty,
      // }),
      autoFocusEntry: id,
      // remove: removeFactory({ element, correlationProperty, commandStack, elementRegistry })
    };
  });

  function add(event) {
    event.stopPropagation();
    const newCorrelationKey = moddle.create('bpmn:CorrelationKey');
    newCorrelationKey.name = moddle.ids.nextPrefixed('CorrelationKey_');
    console.log('newCorrelationKey', newCorrelationKey);
    commandStack.execute('element.updateModdleProperties', {
      element,
      moddleElement: element.businessObject,
      newElements: newCorrelationKey
    });
  }

  return { items, add };
}

function removeFactory(props) {
  const { element, dataObject, process, commandStack } = props;

  return function (event) {
    event.stopPropagation();
    commandStack.execute('element.updateModdleProperties', {
      element,
      moddleElement: process,
      properties: {
        flowElements: without(process.get('flowElements'), dataObject),
      },
    });
    // Also update the label of all the references
    const references = findDataReferenceShapes(element, dataObject.id);
    for (const ref of references) {
      commandStack.execute('element.updateProperties', {
        element: ref,
        moddleElement: ref.businessObject,
        properties: {
          name: '???',
        },
        changed: [ref], // everything is already marked as changed, don't recalculate.
      });
    }
  };
}

function correlationGroup(props) {
  const { element, correlationProperty } = props;
  const id = `correlation-${correlationProperty.id}`;
  return {
    id,
    label: correlationProperty.id,
    entries: CorrelationKeyGroup({
      id,
      element,
      correlationProperty,
    }),
    autoFocusEntry: id,
  };
}

function CorrelationKeyGroup(props) {
  const { idPrefix, correlationProperty } = props;

  return [
    {
      id: `${idPrefix}-group`,
      component: CorrelationKeyTextField,
      isEdited: isTextFieldEntryEdited,
      idPrefix,
      correlationProperty,
    },
  ];
}

function CorrelationKeyTextField(props) {
  const { idPrefix, element, parameter, correlationProperty } = props;

  const commandStack = useService('commandStack');
  const debounce = useService('debounceInput');

  const setValue = (value) => {
    commandStack.execute('element.updateModdleProperties', {
      element,
      moddleElement: correlationProperty,
      properties: {
        id: value,
      },
    });

    // Also update the label of all the references
    // const references = findDataReferenceShapes(element, correlationProperty.id);
    const references = ['hello1', 'hello2'];
    for (const ref of references) {
      commandStack.execute('element.updateProperties', {
        element: ref,
        moddleElement: ref.businessObject,
        properties: {
          name: value,
        },
        changed: [ref], // everything is already marked as changed, don't recalculate.
      });
    }
  };

  const getValue = (parameter) => {
    return correlationProperty.refs;
  };

  return ListGroup({
    element: parameter,
    items: correlationProperty.refs,
    id: `${idPrefix}-textField`,
    label: 'Correlation Properties',
    getValue,
    setValue,
    debounce,
  });
}
