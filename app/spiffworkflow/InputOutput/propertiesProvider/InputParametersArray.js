import { useService } from 'bpmn-js-properties-panel';
import {
  isTextFieldEntryEdited,
  TextFieldEntry,
} from '@bpmn-io/properties-panel';
import { createSpecification, removeElementFromSpecification, updateElementProperties } from '../helpers';

export function InputParametersArray(props) {

  const { element, moddle, translate, commandStack, bpmnFactory } = props;
  const { businessObject } = element;

  const ioSpecification = businessObject.ioSpecification;

  const inputsEntries = (ioSpecification) ? ioSpecification.dataInputs : [];

  const items = (inputsEntries) ? inputsEntries.map((inputEntry, index) => {
    const id = `inputEntry-${index}`;
    return {
      id,
      label: translate(inputEntry.name),
      entries: InputParamGroup({
        element,
        commandStack,
        moddle,
        translate,
        bpmnFactory,
        inputEntry
      }),
      autoFocusEntry: `input-focus-entry`,
      remove: removeFactory({
        element, moddle, commandStack, inputEntry
      }),
    };
  }) : [];

  function add(event) {
    const { businessObject } = element;

    const newInputID = moddle.ids.nextPrefixed('DataInput_');

    // Create a new DataInput
    const newInput = bpmnFactory.create('bpmn:DataInput', { id: newInputID, name: newInputID });

    // Check if ioSpecification already exists
    createSpecification(bpmnFactory, businessObject, 'input', newInput)

    // Update the element
    updateElementProperties(commandStack, element);

    event.stopPropagation();
  }

  return { items, add };
}

function removeFactory(props) {
  const { element, bpmnFactory, commandStack, inputEntry } = props;
  return function (event) {
    event.stopPropagation();
    removeElementFromSpecification(element, inputEntry, 'input');
    updateElementProperties(commandStack, element);
  };
}

function InputParamGroup(props) {

  const { id, inputEntry, element, moddle, commandStack, translate, bpmnFactory } = props;

  return [
    {
      id,
      inputEntry,
      component: InputParamTextField,
      element,
      moddle,
      commandStack,
      translate,
      bpmnFactory
    }
  ];
}

function InputParamTextField(props) {

  const { id, element, inputEntry, moddle, commandStack, translate, bpmnFactory } = props;

  const debounce = useService('debounceInput');

  const setValue = (value) => {
    try {
      const ioSpecification = element.businessObject.ioSpecification;

      if (!value || value == '') {
        console.error('No value provided for this input.');
        return;
      }

      if (!ioSpecification) {
        console.error('No ioSpecification found for this element.');
        return;
      }

      let existingInput = ioSpecification.dataInputs.find(input => input.id === inputEntry.name || input.name === inputEntry.name);

      if (existingInput) {
        existingInput.name = value;
        existingInput.id = value;
      } else {
        console.error(`No DataInput found :> ${inputEntry.name}`);
        return;
      }

      updateElementProperties(commandStack, element);

    } catch (error) {
      console.log('Setting Value Error : ', error);
    }
  };

  const getValue = () => {
    return inputEntry.name;
  };

  return TextFieldEntry({
    element,
    id: `${id}-input`,
    label: translate('Input Name'),
    getValue,
    setValue,
    debounce,
  });
}
