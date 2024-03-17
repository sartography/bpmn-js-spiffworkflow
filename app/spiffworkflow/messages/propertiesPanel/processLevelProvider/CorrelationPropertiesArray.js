import { useService } from 'bpmn-js-properties-panel';
import {
  isTextFieldEntryEdited,
  TextFieldEntry,
} from '@bpmn-io/properties-panel';
import {
  getRoot,
  findCorrelationProperties,
  findCorrelationKeyForCorrelationProperty,
  createNewCorrelationProperty,
} from '../../MessageHelpers';
import { removeFirstInstanceOfItemFromArrayInPlace } from '../../../helpers';

/**
 * Allows the creation, or editing of messageCorrelations at the bpmn:sendTask level of a BPMN document.
 */
export function CorrelationPropertiesArray(props) {
  const { moddle } = props;
  const { element } = props;
  const { commandStack } = props;
  const { translate } = props;

  const correlationPropertyArray = findCorrelationProperties(
    element.businessObject
  );

  const items = correlationPropertyArray.map(
    (correlationPropertyModdleElement, index) => {
      const id = `correlation-${index}`;
      const entries = MessageCorrelationPropertyGroup({
        idPrefix: id,
        correlationPropertyModdleElement,
        translate,
        element,
        commandStack,
        moddle,
      });
      return {
        id,
        label: correlationPropertyModdleElement.name,
        entries,
        autoFocusEntry: id,
        remove: removeFactory({
          element,
          correlationPropertyModdleElement,
          commandStack,
          moddle,
        }),
      };
    }
  );

  function add(event) {
    event.stopPropagation();
    createNewCorrelationProperty(element, moddle, commandStack);
  }

  return { items, add };
}

function removeFactory(props) {
  const { element, correlationPropertyModdleElement, moddle, commandStack } =
    props;

  return function (event) {
    event.stopPropagation();
    const rootElement = getRoot(element.businessObject);
    const { rootElements } = rootElement;

    const oldCorrelationKeyElement = findCorrelationKeyForCorrelationProperty(
      correlationPropertyModdleElement,
      moddle
    );
    if (oldCorrelationKeyElement) {
      removeFirstInstanceOfItemFromArrayInPlace(
        oldCorrelationKeyElement.correlationPropertyRef,
        correlationPropertyModdleElement
      );
    }

    removeFirstInstanceOfItemFromArrayInPlace(
      rootElements,
      correlationPropertyModdleElement
    );
    commandStack.execute('element.updateProperties', {
      element,
      properties: {
        messages: rootElements,
      },
    });
  };
}

function MessageCorrelationPropertyGroup(props) {
  const {
    idPrefix,
    correlationPropertyModdleElement,
    translate,
    element,
    commandStack,
    moddle,
  } = props;
  return [
    {
      id: `${idPrefix}-correlation-property-name`,
      component: CorrelationPropertyNameTextField,
      isEdited: isTextFieldEntryEdited,
      idPrefix,
      element,
      correlationPropertyModdleElement,
      translate,
      commandStack,
    },
  ];
}

function CorrelationPropertyNameTextField(props) {
  const {
    id,
    element,
    correlationPropertyModdleElement,
    commandStack,
    translate,
  } = props;

  const debounce = useService('debounceInput');
  const setValue = (value) => {
    commandStack.execute('element.updateModdleProperties', {
      element,
      moddleElement: correlationPropertyModdleElement,
      properties: {
        name: value,
        id: value,
      },
    });
  };

  const getValue = () => {
    return correlationPropertyModdleElement.name;
  };

  return TextFieldEntry({
    element,
    id: `${id}-name-textField`,
    label: translate('Name'),
    getValue,
    setValue,
    debounce,
  });
}
