import React from 'react';
import { useService } from 'bpmn-js-properties-panel';
import { CheckboxEntry } from '@bpmn-io/properties-panel';

/**
 * A generic properties' editor for text area.
 */
export function MatchingCorrelationCheckboxEntry(props) {
  const { element, commandStack, moddle } = props;
  const { name, label, description } = props;
  const { businessObject } = element;

  const debounce = useService('debounceInput');

  const getValue = () => {
    const isMatchingCorrelation = businessObject.get('spiffworkflow:isMatchingCorrelation');
    const value = isMatchingCorrelation && isMatchingCorrelation !== 'false'
      ? true
      : false;
    return value;
  };

  const setValue = (value) => {
    commandStack.execute('element.updateProperties', {
      element,
      properties: {
        'spiffworkflow:isMatchingCorrelation': value,
      },
    });
  };

  return (
    <CheckboxEntry
      id={'correlation_extension_' + name}
      element={element}
      description={description}
      label={label}
      getValue={getValue}
      setValue={setValue}
      debounce={debounce}
    />
  );
}
