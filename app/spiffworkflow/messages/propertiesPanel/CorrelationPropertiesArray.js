import { useService } from 'bpmn-js-properties-panel';
import {
  SelectEntry,
  isTextFieldEntryEdited,
  TextFieldEntry,
} from '@bpmn-io/properties-panel';
import {
  findCorrelationPropertiesAndRetrievalExpressionsForMessage,
  getRoot,
  findCorrelationKeys,
  findCorrelationKeyForCorrelationProperty,
} from '../MessageHelpers';
import { removeFirstInstanceOfItemFromArrayInPlace } from '../../helpers';

/**
 * Allows the creation, or editing of messageCorrelations at the bpmn:sendTask level of a BPMN document.
 */
export function CorrelationPropertiesArray(props) {
  const { moddle } = props;
  const { element } = props;
  const { commandStack } = props;
  const { translate } = props;

  // const { elementRegistry } = props;

  const correlationPropertyArray =
    findCorrelationPropertiesAndRetrievalExpressionsForMessage(element);
  const items = correlationPropertyArray.map((correlationPropertyObject) => {
    const {
      correlationPropertyModdleElement,
      correlationPropertyRetrievalExpressionElement,
    } = correlationPropertyObject;
    const id = `correlation-${correlationPropertyModdleElement.id}`;
    const entries = MessageCorrelationPropertyGroup({
      idPrefix: id,
      correlationPropertyModdleElement,
      correlationPropertyRetrievalExpressionElement,
      translate,
    });
    return {
      id,
      label: correlationPropertyModdleElement.id,
      entries,
      autoFocusEntry: id,
      // remove: removeFactory({ element, correlationProperty, commandStack, elementRegistry })
    };
  });

  function add(event) {
    event.stopPropagation();
    const newRetrievalExpressionElement = moddle.create(
      'bpmn:CorrelationPropertyRetrievalExpression'
    );
    const rootElement = getRoot(element.businessObject);
    const { rootElements } = rootElement;
    rootElements.push(newRe);
    commandStack.execute('element.updateProperties', {
      element,
      moddleElement: element.businessObject,
    });
  }

  return { items, add };
}
//
// function removeFactory(props) {
//   const { element, messageElement, moddle, commandStack } = props;
//
//   return function (event) {
//     event.stopPropagation();
//     const rootElement = getRoot(element.businessObject);
//     const { rootElements } = rootElement;
//     removeFirstInstanceOfItemFromArrayInPlace(rootElements, messageElement);
//     commandStack.execute('element.updateProperties', {
//       element,
//       moddleElement: moddle,
//       properties: {
//         messages: rootElements,
//       },
//     });
//   };
// }

function MessageCorrelationPropertyGroup(props) {
  const {
    idPrefix,
    correlationPropertyModdleElement,
    correlationPropertyRetrievalExpressionElement,
    translate,
  } = props;
  return [
    {
      id: `${idPrefix}-correlation-key`,
      component: MessageCorrelationKeySelect,
      isEdited: isTextFieldEntryEdited,
      idPrefix,
      correlationPropertyModdleElement,
      translate,
    },
    {
      id: `${idPrefix}-expression`,
      component: MessageCorrelationExpressionTextField,
      isEdited: isTextFieldEntryEdited,
      idPrefix,
      correlationPropertyRetrievalExpressionElement,
      translate,
    },
  ];
}

function MessageCorrelationKeySelect(props) {
  const { idPrefix, correlationPropertyModdleElement, translate, parameter } =
    props;
  const debounce = useService('debounceInput');

  const setValue = (value) => {
    const correlationKeyElements = findCorrelationKeys(
      correlationPropertyModdleElement
    );
    let newCorrelationKeyElement;
    for (const cke of correlationKeyElements) {
      if (cke.name === value) {
        newCorrelationKeyElement = cke;
      }
    }
    const oldCorrelationKeyElement = findCorrelationKeyForCorrelationProperty(
      correlationPropertyModdleElement
    );

    if (newCorrelationKeyElement.correlationPropertyRef) {
      newCorrelationKeyElement.correlationPropertyRef.push(
        correlationPropertyModdleElement
      );
    } else {
      newCorrelationKeyElement.correlationPropertyRef = [
        correlationPropertyModdleElement,
      ];
    }

    if (oldCorrelationKeyElement) {
      removeFirstInstanceOfItemFromArrayInPlace(
        oldCorrelationKeyElement.correlationPropertyRef,
        correlationPropertyModdleElement
      );
    }
  };

  const getValue = () => {
    const correlationKeyElement = findCorrelationKeyForCorrelationProperty(
      correlationPropertyModdleElement
    );
    if (correlationKeyElement) {
      return correlationKeyElement.name;
    }
    return null;
  };

  const getOptions = () => {
    const correlationKeyElements = findCorrelationKeys(
      correlationPropertyModdleElement
    );
    const options = [];
    for (const correlationKeyElement of correlationKeyElements) {
      options.push({
        label: correlationKeyElement.name,
        value: correlationKeyElement.name,
      });
    }
    return options;
  };

  return SelectEntry({
    id: `${idPrefix}-select`,
    element: parameter,
    label: translate('Correlation Key'),
    getValue,
    setValue,
    getOptions,
    debounce,
  });
}

function MessageCorrelationExpressionTextField(props) {
  const {
    idPrefix,
    parameter,
    correlationPropertyRetrievalExpressionElement,
    translate,
  } = props;

  const debounce = useService('debounceInput');

  const setValue = (value) => {
    correlationPropertyRetrievalExpressionElement.messagePath.body = value;
  };

  const getValue = (_parameter) => {
    return correlationPropertyRetrievalExpressionElement.messagePath.body;
  };

  return TextFieldEntry({
    element: parameter,
    id: `${idPrefix}-textField`,
    label: translate('Expression'),
    getValue,
    setValue,
    debounce,
  });
}
