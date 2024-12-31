import React from 'react';

import { CheckboxEntry, isCheckboxEntryEdited } from '@bpmn-io/properties-panel';
import { useService } from 'bpmn-js-properties-panel';
import { getExtensionValue, setExtensionValue } from '../extensionHelpers';

/**
 * A generic properties' editor for text area.
 */
export function SpiffExtensionCheckboxEntry(props) {
  const element = props.element;
  const commandStack = props.commandStack,
    moddle = props.moddle;
  const name = props.name,
    label = props.label,
    description = props.description;
  const debounce = useService('debounceInput');

  const getValue = () => {
    return getExtensionValue(element.businessObject, name);
  };

  const setValue = (value) => {
    setExtensionValue(element, name, value, moddle, commandStack);
  };

  return (
    <CheckboxEntry
      id={'extension_' + name}
      element={element}
      description={description}
      label={label}
      getValue={getValue}
      setValue={setValue}
      debounce={debounce}
      isEdited={isCheckboxEntryEdited}
    />
  );
}
