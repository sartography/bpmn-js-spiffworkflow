import { useService } from 'bpmn-js-properties-panel';
import {
  SelectEntry,
  isTextFieldEntryEdited,
  TextFieldEntry,
} from '@bpmn-io/properties-panel';
import {
  getRoot,
  findCorrelationKeys,
  findCorrelationProperties,
  findCorrelationKeyForCorrelationProperty,
  findCorrelationPropertyById,
} from '../MessageHelpers';
import { removeFirstInstanceOfItemFromArrayInPlace } from '../../helpers';

/**
 * Allows the creation, or editing of messageCorrelations at the bpmn:sendTask level of a BPMN document.
 */
export function CorrelationPropertiesList(props) {
  const { moddle } = props;
  const { element } = props;
  const { commandStack } = props;
  const { translate } = props;

  const correlationPropertyArray = findCorrelationProperties(
    element.businessObject
  );

  // console.log('correlationPropertyArray', correlationPropertyArray)

  const items = correlationPropertyArray.map(
    (correlationPropertyModdleElement, index) => {
      // console.log('correlationPropertyModdleElement', correlationPropertyModdleElement)

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
        // remove: removeFactory({
        //   element,
        //   correlationPropertyModdleElement,
        //   commandStack,
        //   moddle,
        // }),
      };
    }
  );

  function add(event) {
    event.stopPropagation();
    const newCorrelationPropertyElement = moddle.create(
      'bpmn:CorrelationProperty'
    );
    const correlationPropertyId = moddle.ids.nextPrefixed(
      'CorrelationProperty_'
    );
    newCorrelationPropertyElement.id = correlationPropertyId;
    newCorrelationPropertyElement.name = correlationPropertyId;
    const rootElement = getRoot(element.businessObject);
    const { rootElements } = rootElement;
    rootElements.push(newCorrelationPropertyElement);

    const correlationKeyElements = findCorrelationKeys(
      newCorrelationPropertyElement,
      moddle
    );
    const correlationKeyElement = correlationKeyElements[0];
    if (correlationKeyElement.correlationPropertyRef) {
      correlationKeyElement.correlationPropertyRef.push(
        newCorrelationPropertyElement
      );
    } else {
      correlationKeyElement.correlationPropertyRef = [
        newCorrelationPropertyElement,
      ];
    }

    commandStack.execute('element.updateProperties', {
      element,
      properties: {},
    });
  }

  // console.log({ items, add });
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
      id: `${idPrefix}-correlation-property-retrivial-expression`,
      component: CorrelationPropertyRetrivialExpressionTextField,
      isEdited: isTextFieldEntryEdited,
      idPrefix,
      element,
      correlationPropertyModdleElement,
      translate,
      commandStack
    },
  ];
}

function CorrelationPropertyRetrivialExpressionTextField(props) {
  const {
    id,
    element,
    correlationPropertyModdleElement,
    commandStack,
    translate,
    idPrefix
  } = props;

  const debounce = useService('debounceInput');
  
  const setValue = (value) => {

    const process = element.businessObject.$parent;
    const definitions = process.$parent;
    
    if (!definitions.get('rootElements')) {
      definitions.set('rootElements', []);
    }
    
    definitions.rootElements.forEach(rootElement => {
      if(rootElement.id == correlationPropertyModdleElement.id && rootElement.$type == 'bpmn:CorrelationProperty'){
        if (rootElement.correlationPropertyRetrievalExpression && rootElement.correlationPropertyRetrievalExpression.length > 0) {
          const correlationProperty = rootElement.correlationPropertyRetrievalExpression.find(cp => cp.messageRef === element.businessObject.messageRef);
          if(correlationProperty){
            correlationProperty.messagePath.body = value;
            commandStack.execute('element.updateProperties', {
              element,
              properties: {},
            });
            return;
          }
        }
      }
    });

  };

  const getValue = () => {
    return correlationPropertyModdleElement.correlationPropertyRetrievalExpression[0].messagePath.body;
  };

  return TextFieldEntry({
    element,
    id: `${id}-name-textField`,
    label: translate('Retrivial Expression'),
    getValue,
    setValue,
    debounce,
  });
}
