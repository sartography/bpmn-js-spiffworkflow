import { useService } from 'bpmn-js-properties-panel';
import { SimpleEntry } from '@bpmn-io/properties-panel';
import { findCorrelationKeys } from '../MessageHelpers';

/**
 * Provides a list of data objects, and allows you to add / remove data objects, and change their ids.
 * @param props
 * @constructor
 */
export function CorrelationKeysArray(props) {
  const { element } = props; // fixme:  Is it a shape or a moddle element?

  const correlationProperties = findCorrelationKeys(element.businessObject);
  const items = correlationProperties.map((correlationProperty, _index) => {
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

  return { items };
}

// <bpmn:correlationKey name="lover"> <--- The CorrelationKeyGroup
//   <bpmn:correlationPropertyRef>lover_name</bpmn:correlationPropertyRef>
//   <bpmn:correlationPropertyRef>lover_instrument</bpmn:correlationPropertyRef>
// </bpmn:correlationKey>
// <bpmn:correlationKey name="singer" />
function correlationGroup(props) {
  const { correlationProperty } = props;
  const id = `correlation-${correlationProperty.name}`;
  return correlationProperty.refs.map((cpRef, _index) => {
    return {
      id: `${id}-${cpRef.id}-group`,
      component: CorrelationKeyTextField,
      correlationProperty,
      cpRef,
    };
  });
}

function CorrelationKeyTextField(props) {
  const { id, parameter, cpRef } = props;

  const debounce = useService('debounceInput');

  const getValue = (_parameter) => {
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
