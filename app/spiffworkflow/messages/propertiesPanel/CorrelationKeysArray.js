import { useService } from 'bpmn-js-properties-panel';
import { SimpleEntry, TextFieldEntry } from '@bpmn-io/properties-panel';
import { createNewCorrelationKey, findCorrelationKeys, getRoot } from '../MessageHelpers';
import { removeFirstInstanceOfItemFromArrayInPlace } from '../../helpers';

/**
 * Provides a list of data objects, and allows you to add / remove data objects, and change their ids.
 * @param props
 * @constructor
 */
export function CorrelationKeysArray(props) {
  const { element, moddle, commandStack } = props;

  const correlationKeyElements = findCorrelationKeys(element.businessObject);
  
  const items = correlationKeyElements.map((correlationKeyElement, index) => {
    const id = `correlationGroup-${index}`;
    return {
      id,
      label: correlationKeyElement.name,
      entries: correlationGroup({
        idPrefix: id,
        element,
        correlationKeyElement,
        commandStack,
      }),
      remove: removeFactory({
        element,
        correlationKeyElement,
        commandStack,
        moddle,
      }),
      autoFocusEntry: id,
    };
  });

  function add(event) {
    event.stopPropagation();
    createNewCorrelationKey(element, moddle, commandStack);
  }

  return { items, add };
}

function removeFactory(props) {
  const { element, correlationKeyElement, moddle, commandStack } = props;

  return function (event) {
    event.stopPropagation();
    const currentCorrelationKeyElements =
      element.businessObject.get('correlationKeys');
    removeFirstInstanceOfItemFromArrayInPlace(
      currentCorrelationKeyElements,
      correlationKeyElement
    );
    commandStack.execute('element.updateProperties', {
      element,
      properties: {},
    });
  };
}

function correlationGroup(props) {
  const { idPrefix, correlationKeyElement, commandStack } = props;
  const entries = [
    {
      id: `${idPrefix}-key`,
      component: CorrelationKeyTextField,
      correlationKeyElement,
      commandStack,
    },
  ];
  (correlationKeyElement.correlationPropertyRef || []).forEach(
    (correlationProperty, index) => {
      entries.push({
        id: `${idPrefix}-${index}-text`,
        component: CorrelationPropertyText,
        correlationProperty,
      });
    }
  );
  return entries;
}

function CorrelationKeyTextField(props) {
  const { id, element, correlationKeyElement, commandStack } = props;

  const debounce = useService('debounceInput');
  const setValue = (value) => {
    commandStack.execute('element.updateModdleProperties', {
      element,
      moddleElement: correlationKeyElement,
      properties: {
        name: value,
      },
    });
  };

  const getValue = () => {
    return correlationKeyElement.name;
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
