import { useService } from 'bpmn-js-properties-panel';
import {
  isTextFieldEntryEdited,
  ListGroup,
  TextFieldEntry,
  SimpleEntry,
} from '@bpmn-io/properties-panel';
import { without } from 'min-dash';
import { is } from 'bpmn-js/lib/util/ModelUtil';
import {
  findDataObjects,
  findDataReferenceShapes,
} from '../../DataObject/DataObjectHelpers';
import {
  findCorrelationProperties,
  findCorrelationKeys,
  getRoot,
} from '../MessageHelpers';

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
      entries: correlationGroup({
        id,
        element,
        correlationProperty,
      }),
      autoFocusEntry: id,
    };
  });

  // function add(event) {
  //   event.stopPropagation();
  //   const newCorrelationKey = moddle.create('bpmn:CorrelationKey');
  //   newCorrelationKey.name = moddle.ids.nextPrefixed('CorrelationKey_');
  //   console.log('newCorrelationKey', newCorrelationKey);
  //   commandStack.execute('element.updateModdleProperties', {
  //     element,
  //     moddleElement: element.businessObject,
  //     newElements: newCorrelationKey,
  //   });
  // }

  return { items };
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
    for (const cpRef of references) {
      commandStack.execute('element.updateProperties', {
        element: cpRef,
        moddleElement: cpRef.businessObject,
        properties: {
          name: '???',
        },
        changed: [cpRef], // everything is already marked as changed, don't recalculate.
      });
    }
  };
}

// <bpmn:correlationKey name="lover"> <--- The CorrelationKeyGroup
//   <bpmn:correlationPropertyRef>lover_name</bpmn:correlationPropertyRef>
//   <bpmn:correlationPropertyRef>lover_instrument</bpmn:correlationPropertyRef>
// </bpmn:correlationKey>
// <bpmn:correlationKey name="singer" />
function correlationGroup(props) {
  const { element, correlationProperty } = props;
  const id = `correlation-${correlationProperty.name}`;
  return correlationProperty.refs.map((cpRef, index) => {
    return {
      id: `${id}-${cpRef.id}-group`,
      component: CorrelationKeyTextField,
      correlationProperty,
      cpRef,
    };
  });
}

function CorrelationKeyTextField(props) {
  const { id, element, parameter, correlationProperty, cpRef } = props;

  const commandStack = useService('commandStack');
  const debounce = useService('debounceInput');

  const getValue = (parameter) => {
    return cpRef.id;
  };

  return SimpleEntry({
    element: parameter,
    id: `${id}-textField`,
    label: cpRef.id,
    editable: false,
    getValue,
    disabled: true,
    debounce,
  });
}
