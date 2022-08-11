import { useService } from 'bpmn-js-properties-panel';
import { ListGroup, TextAreaEntry } from '@bpmn-io/properties-panel';
import { findFormalExpressions, getRoot } from '../MessageHelpers';
import { findCorrelationKeys } from '../MessageHelpers';
import { CorrelationKeysArray } from './CorrelationKeysArray';
import translate from 'diagram-js/lib/i18n/translate';

/**
 * Allows the creation, or editing of messageCorrelations at the bpmn:sendTask level of a BPMN document.
 */
export function MessageCorrelations(props) {
  const shapeElement = props.element;
  const { commandStack } = props;
  const debounce = useService('debounceInput');
  const translate = useService('translate');

  const getValue = () => {
    const formalExpressions = findFormalExpressions(shapeElement.businessObject)
    return formalExpressions
  };

  const setValue = (value) => {
    return;
  };


  return (
    <TextAreaEntry
      id="messageCorrelations"
      element={shapeElement}
      description="The message correlations"
      label="Correlations"
      getValue={getValue}
      setValue={setValue}
      debounce={debounce}
    />
  );

}
