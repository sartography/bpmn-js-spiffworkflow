import { useService } from 'bpmn-js-properties-panel';
import {
  isTextFieldEntryEdited,
  ListGroup,
  TextAreaEntry,
  TextFieldEntry,
} from '@bpmn-io/properties-panel';
import { findFormalExpressions } from '../MessageHelpers';

/**
 * Allows the creation, or editing of messageCorrelations at the bpmn:sendTask level of a BPMN document.
 */
export function MessageCorrelationsArray(props) {
  const { moddle } = props;
  const { element } = props;
  const { commandStack } = props;
  // const { elementRegistry } = props;

  const formalExpressions = findFormalExpressions(element.businessObject);
  const items = formalExpressions.map((formalExpression) => {
    const id = `correlation-${formalExpression.correlationId}`;
    const entries = MessageCorrelationGroup({
      idPrefix: id,
      formalExpression,
    });
    return {
      id,
      label: formalExpression.correlationId,
      entries,
      autoFocusEntry: id,
      // remove: removeFactory({ element, correlationProperty, commandStack, elementRegistry })
    };
  });

  function add(event) {
    event.stopPropagation();
    const newRetrievalExpression = moddle.create(
      'bpmn:CorrelationPropertyRetrievalExpression'
    );
    const newElements = formalExpressions;
    newRetrievalExpression.messageRef = element.businessObject.messageRef;
    newElements.push(newRetrievalExpression);
    commandStack.execute('element.updateModdleProperties', {
      element,
      moddleElement: element.businessObject,
    });
  }

  return { items, add };
}

function MessageCorrelationGroup(props) {
  const { idPrefix, formalExpression } = props;

  return [
    {
      id: `${idPrefix}-group`,
      component: MessageCorrelationTextField,
      isEdited: isTextFieldEntryEdited,
      idPrefix,
      formalExpression,
    },
  ];
}

function MessageCorrelationTextField(props) {
  const { idPrefix, element, parameter, formalExpression } = props;

  const commandStack = useService('commandStack');
  const debounce = useService('debounceInput');

  const setValue = (value) => {
    commandStack.execute('element.updateModdleProperties', {
      element,
      moddleElement: formalExpression,
      properties: {
        id: value,
      },
    });

    // Also update the label of all the references
    // const references = findDataReferenceShapes(element, correlationProperty.id);
    const references = ['hello1', 'hello2'];
    for (const ref of references) {
      commandStack.execute('element.updateProperties', {
        element: ref,
        moddleElement: ref.businessObject,
        properties: {
          name: value,
        },
        changed: [ref], // everything is already marked as changed, don't recalculate.
      });
    }
  };

  const getValue = (_parameter) => {
    return formalExpression.expression;
  };

  return TextFieldEntry({
    element: parameter,
    id: `${idPrefix}-textField`,
    label: 'Expression',
    getValue,
    setValue,
    debounce,
  });
}
