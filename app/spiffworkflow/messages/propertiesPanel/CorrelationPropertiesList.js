import { useService } from 'bpmn-js-properties-panel';
import {
  SelectEntry,
  isTextFieldEntryEdited,
  TextFieldEntry,
} from '@bpmn-io/properties-panel';
import {
  getRoot,
  findCorrelationKeys,
  findCorrelationKeyForCorrelationProperty,
  findCorrelationPropertiesByMessage,
  isMessageEvent,
  isMessageElement
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

  const correlationPropertyArray = findCorrelationPropertiesByMessage(
    element
  );

  const items = (correlationPropertyArray) ? correlationPropertyArray.map(
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
        // remove: removeFactory({
        //   element,
        //   correlationPropertyModdleElement,
        //   commandStack,
        //   moddle,
        // }),
      };
    }
  ): [];

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

  return { items, add };
}

function removeFactory(props) {
  const { element, correlationPropertyModdleElement, moddle, commandStack } = props;

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

    const message = (isMessageEvent(element)) ? element.businessObject.eventDefinitions[0].messageRef : element.businessObject.messageRef;
    const process = element.businessObject.$parent;
    const definitions = process.$parent;
    
    if (!definitions.get('rootElements')) {
      definitions.set('rootElements', []);
    }
    definitions.rootElements.forEach(rootElement => {
      if(rootElement.id == correlationPropertyModdleElement.id && rootElement.$type == 'bpmn:CorrelationProperty'){
        const matchingRetrievalExpression = rootElement.correlationPropertyRetrievalExpression.find(expr => 
          expr.messageRef && expr.messageRef === message
        );
        if(matchingRetrievalExpression){
          matchingRetrievalExpression.messagePath.body = value;
          commandStack.execute('element.updateProperties', {
            element,
            properties: {},
          });
          return;
        }
      }
    });

  };

  const getValue = () => {

    const message = (isMessageEvent(element)) ? element.businessObject.eventDefinitions[0].messageRef : element.businessObject.messageRef;
    
    const matchingRetrievalExpression = correlationPropertyModdleElement.correlationPropertyRetrievalExpression.find(expr => 
      expr.messageRef && expr.messageRef === message
    );
    
    return (matchingRetrievalExpression) ? matchingRetrievalExpression.messagePath.body : '' ;
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
