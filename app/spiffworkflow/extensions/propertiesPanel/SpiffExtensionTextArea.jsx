import React from 'react';
import { useService } from 'bpmn-js-properties-panel';
import { TextAreaEntry, TextFieldEntry } from '@bpmn-io/properties-panel';
import { getExtensionValue, setExtensionValue } from '../extensionHelpers';

/**
 * A generic properties' editor for text area.
 */
export function SpiffExtensionTextArea(props) {
  const element = props.element;
  const commandStack = props.commandStack,
    moddle = props.moddle;
  const name = props.name,
    label = props.label,
    description = props.description,
    id = props.id;
  const debounce = useService('debounceInput');

  const getValue = () => {
    return getExtensionValue(element.businessObject, name);
  };

  const setValue = (value) => {
    setExtensionValue(element, name, value, moddle, commandStack);
  };

  return (
    <TextAreaEntry
      id={(id !== undefined) ? id : 'extension_' + name}
      element={element}
      description={description}
      label={label}
      getValue={getValue}
      setValue={setValue}
      debounce={debounce}
    />
  );
}
