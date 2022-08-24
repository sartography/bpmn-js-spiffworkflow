import { useService } from 'bpmn-js-properties-panel';
import { SimpleEntry, TextFieldEntry } from '@bpmn-io/properties-panel';
import { findCorrelationKeys, getRoot } from '../MessageHelpers';

/**
 * Provides a list of data objects, and allows you to add / remove data objects, and change their ids.
 * @param props
 * @constructor
 */
export function CorrelationKeysArray(props) {
  const { element, moddle, commandStack } = props;

  const correlationKeys = findCorrelationKeys(element.businessObject);
  const items = correlationKeys.map((correlationKey, index) => {
    const id = `correlationGroup-${index}`;
    return {
      id,
      label: correlationKey.name,
      entries: correlationGroup({
        id,
        element,
        correlationKey,
        commandStack,
      }),
      autoFocusEntry: id,
    };
  });

  function add(event) {
    event.stopPropagation();
    if (element.type === 'bpmn:Collaboration') {
      const newCorrelationKeyElement = moddle.create('bpmn:CorrelationKey');
      newCorrelationKeyElement.name =
        moddle.ids.nextPrefixed('CorrelationKey_');
      const correlationKeyElements =
        element.businessObject.get('correlationKeys');
      correlationKeyElements.push(newCorrelationKeyElement);
      commandStack.execute('element.updateProperties', {
        element,
        moddleElement: moddle,
        properties: {
          correlationKey: correlationKeyElements,
        },
      });
    }
  }

  return { items, add };
}

// <bpmn:correlationKey name="lover"> <--- The correlationGroup
//   <bpmn:correlationPropertyRef>lover_name</bpmn:correlationPropertyRef>
//   <bpmn:correlationPropertyRef>lover_instrument</bpmn:correlationPropertyRef>
// </bpmn:correlationKey>
// <bpmn:correlationKey name="singer" />
function correlationGroup(props) {
  const { correlationKey, commandStack } = props;
  const id = `correlation-${correlationKey.name}`;
  const entries = [
    {
      id: `${id}-${correlationKey.name}-key`,
      component: CorrelationKeyTextField,
      correlationKey,
      commandStack,
    },
  ];
  (correlationKey.correlationPropertyRef || []).forEach(
    (correlationProperty) => {
      entries.push({
        id: `${id}-${correlationProperty.id}-group`,
        component: CorrelationPropertyText,
        correlationProperty,
      });
    }
  );
  return entries;
}

function CorrelationKeyTextField(props) {
  const { id, element, correlationKey, commandStack } = props;

  const debounce = useService('debounceInput');
  const setValue = (value) => {
    commandStack.execute('element.updateModdleProperties', {
      element,
      moddleElement: correlationKey,
      properties: {
        name: value,
      },
    });
  };

  const getValue = () => {
    return correlationKey.name;
  };

  return TextFieldEntry({
    element,
    id: `${id}-textField`,
    getValue,
    setValue,
    debounce,
  });
}

function CorrelationPropertyText(props) {
  const { id, parameter, correlationProperty } = props;
  const debounce = useService('debounceInput');

  const getValue = () => {
    return correlationProperty.id;
  };

  return SimpleEntry({
    element: parameter,
    id: `${id}-textField`,
    label: correlationProperty.id,
    getValue,
    disabled: true,
    debounce,
  });
}
