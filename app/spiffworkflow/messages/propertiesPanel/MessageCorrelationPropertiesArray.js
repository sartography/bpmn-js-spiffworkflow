import { useService } from 'bpmn-js-properties-panel';
import {
  SelectEntry,
  isTextFieldEntryEdited,
  TextFieldEntry,
} from '@bpmn-io/properties-panel';
import {
  findCorrelationPropertiesAndRetrievalExpressionsForMessage,
  getRoot,
  findCorrelationProperties,
  getMessageRefElement,
  findCorrelationKeys,
  findCorrelationKeyForCorrelationProperty,
} from '../MessageHelpers';
import { removeFirstInstanceOfItemFromArrayInPlace } from '../../helpers';

/**
 * Allows the creation, or editing of messageCorrelations at the bpmn:sendTask level of a BPMN document.
 */
export function MessageCorrelationPropertiesArray(props) {
  const { moddle } = props;
  const { element } = props;
  const { commandStack } = props;
  const { translate } = props;

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
      moddle,
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
    const newCorrelationPropertyElement = moddle.create(
      'bpmn:CorrelationProperty'
    );
    const newRetrievalExpressionElement = moddle.create(
      'bpmn:CorrelationPropertyRetrievalExpression'
    );
    const newFormalExpression = moddle.create('bpmn:FormalExpression');
    // const rootElement = getRoot(element.businessObject);
    // const { rootElements } = rootElement;
    // rootElements.push(newRetrievalExpressionElement);
    // commandStack.execute('element.updateProperties', {
    //   element,
    //   moddleElement: element.businessObject,
    // });
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
    moddle,
  } = props;
  return [
    {
      id: `${idPrefix}-correlation-key`,
      component: MessageCorrelationPropertySelect,
      isEdited: isTextFieldEntryEdited,
      idPrefix,
      correlationPropertyModdleElement,
      correlationPropertyRetrievalExpressionElement,
      translate,
      moddle,
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

function MessageCorrelationPropertySelect(props) {
  const {
    idPrefix,
    correlationPropertyModdleElement,
    correlationPropertyRetrievalExpressionElement,
    translate,
    parameter,
    moddle,
  } = props;
  const debounce = useService('debounceInput');

  const setValue = (value) => {
    const correlationPropertyElements = findCorrelationProperties(
      correlationPropertyModdleElement,
      moddle
    );
    const newCorrelationPropertyElement = correlationPropertyElements.find(
      (cpe) => cpe.id === value
    );

    if (!newCorrelationPropertyElement.correlationPropertyRetrievalExpression) {
      newCorrelationPropertyElement.correlationPropertyRetrievalExpression = [];
    }
    newCorrelationPropertyElement.correlationPropertyRetrievalExpression.push(
      correlationPropertyRetrievalExpressionElement
    );
    removeFirstInstanceOfItemFromArrayInPlace(
      correlationPropertyModdleElement.correlationPropertyRetrievalExpression,
      correlationPropertyRetrievalExpressionElement
    );
  };

  const getValue = () => {
    return correlationPropertyModdleElement.id;
  };

  const getOptions = () => {
    const correlationPropertyElements = findCorrelationProperties(
      correlationPropertyModdleElement,
      moddle
    );
    const options = [];
    for (const correlationPropertyElement of correlationPropertyElements) {
      options.push({
        label: correlationPropertyElement.name,
        value: correlationPropertyElement.id,
      });
    }
    return options;
  };

  return SelectEntry({
    id: `${idPrefix}-select`,
    element: parameter,
    label: translate('Correlation Property'),
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
