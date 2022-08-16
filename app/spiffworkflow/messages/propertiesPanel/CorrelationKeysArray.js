import { useService } from 'bpmn-js-properties-panel';
import {
  isTextFieldEntryEdited,
  ListGroup,
  TextFieldEntry,
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
    // console.log('correlationProperty.refs', correlationProperty.refs);
    console.log('id', id);
    return {
      id,
      correlationProperty,
      label: correlationProperty.name,
      // entries: correlationProperty.refs,
      entries: correlationGroup({
        id,
        element,
        correlationProperty,
      }),
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
      newElements: newCorrelationKey,
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
  console.log('HELL1');
  // return [
  //   {
  //     // id,
  //     // label: correlationProperty.name,
  //     // entries: [],
  //     // entries: CorrelationKeyGroup({
  //     //   id,
  //     //   element,
  //     //   correlationProperty,
  //     // }),
  //     id: `${id}-hey-group`,
  //     // component: CorrelationKeyGroup,
  //     component: CorrelationKeyTextField,
  //     // isEdited: isTextFieldEntryEdited,
  //     correlationProperty,
  //     // autoFocusEntry: id,
  //   },
  // ];
  return correlationProperty.refs.map((cpRef, index) => {
    console.log('ref1', cpRef);
    return {
      // id,
      // label: correlationProperty.name,
      // entries: [],
      // entries: CorrelationKeyGroup({
      //   id,
      //   element,
      //   correlationProperty,
      // }),
      id: `${id}-${cpRef.id}-group`,
      // component: CorrelationKeyGroup,
      component: CorrelationKeyTextField,
      // isEdited: isTextFieldEntryEdited,
      correlationProperty,
      cpRef,
      // autoFocusEntry: id,
    };
  });
}

function CorrelationKeyGroup(props) {
  const { id, correlationProperty } = props;
  console.log('HELLO');

  const entries = correlationProperty.refs.map((cpRef, index) => {
    // debugger;
    // return CorrelationKeyTextField({
    return {
      id: `${id}-${cpRef.id}-group`,
      component: CorrelationKeyTextField,
      isEdited: isTextFieldEntryEdited,
      correlationProperty,
    };
    // })
  });
  // console.log('stuff', stuff);

  console.log('entries', entries);
  return [
    {
      id: `${id}-group`,
      entries,
      isEdited: isTextFieldEntryEdited,
      correlationProperty,
    },
  ];
}

function CorrelationKeyTextField(props) {
  console.log('WE IN TEXT');
  console.log('props', props);
  const { id, element, parameter, correlationProperty, cpRef } = props;
  console.log('cpRef', cpRef);

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
    for (const cpRef of references) {
      commandStack.execute('element.updateProperties', {
        element: cpRef,
        moddleElement: cpRef.businessObject,
        properties: {
          name: value,
        },
        changed: [cpRef], // everything is already marked as changed, don't recalculate.
      });
    }
  };

  const getValue = (parameter) => {
    return correlationProperty.refs;
  };

  // return ListGroup({
  //   element: parameter,
  //   items: correlationProperty.refs,
  //   id: `${idPrefix}-textField`,
  //   label: 'Correlation Properties',
  //   getValue,
  //   setValue,
  //   debounce,
  // });
  console.log('correlationProperty.id', correlationProperty.name);
  return TextFieldEntry({
    element: parameter,
    id: `${id}-textField`,
    label: cpRef.id,
    getValue,
    setValue,
    debounce,
  });
}
