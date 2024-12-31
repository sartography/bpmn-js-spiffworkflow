import { useService } from 'bpmn-js-properties-panel';
import {
  isTextFieldEntryEdited,
  TextFieldEntry,
} from '@bpmn-io/properties-panel';
import { createSpecification, removeElementFromSpecification, updateElementProperties } from '../helpers';

export function OutputParametersArray(props) {

  const { element, moddle, translate, commandStack, bpmnFactory } = props;
  const { businessObject } = element;

  const ioSpecification = businessObject.ioSpecification;

  const outputsEntries = (ioSpecification) ? ioSpecification.dataOutputs : [];

  const items = (outputsEntries) ? outputsEntries.map((outputEntry, index) => {
    const id = `outputEntry-${index}`;
    return {
      id,
      label: translate(outputEntry.name),
      entries: OutputParamGroup({
        element,
        commandStack,
        moddle,
        translate,
        bpmnFactory,
        outputEntry
      }),
      autoFocusEntry: `output-focus-entry`,
      remove: removeFactory({
        element, moddle, commandStack, outputEntry
      }),
    };
  }) : [];

  function add(event) {
    const { businessObject } = element;

    const newOutputID = moddle.ids.nextPrefixed('DataOutput_');

    // Create a new DataOutput
    const newOutput = bpmnFactory.create('bpmn:DataOutput', { id: newOutputID, name: newOutputID });

    // Check if ioSpecification already exists
    createSpecification(bpmnFactory, businessObject, 'output', newOutput)

    // Update the element
    updateElementProperties(commandStack, element);

    event.stopPropagation();
  }

  return { items, add };
}

function removeFactory(props) {
  const { element, bpmnFactory, commandStack, outputEntry } = props;
  return function (event) {
    event.stopPropagation();
    removeElementFromSpecification(element, outputEntry, 'output');
    updateElementProperties(commandStack, element);
  };
}

function OutputParamGroup(props) {

  const { id, outputEntry, element, moddle, commandStack, translate, bpmnFactory } = props;

  return [
    {
      id,
      outputEntry,
      component: OutputParamTextField,
      isEdited: isTextFieldEntryEdited,
      element,
      moddle,
      commandStack,
      translate,
      bpmnFactory
    }
  ];
}

function OutputParamTextField(props) {

  const { id, element, outputEntry, moddle, commandStack, translate, bpmnFactory } = props;

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

      let existingInput = ioSpecification.dataOutputs.find(input => input.id === outputEntry.name || input.name === outputEntry.name);

      if (existingInput) {
        existingInput.name = value;
        existingInput.id = value;
      } else {
        console.error(`No DataOutput found :> ${outputEntry.name}`);
        return;
      }

      updateElementProperties(commandStack, element);

    } catch (error) {
      console.log('Setting Value Error : ', error);
    }
  };

  const getValue = () => {
    return outputEntry.name;
  };

  return TextFieldEntry({
    element,
    id: `${id}-output`,
    label: translate('Output Name'),
    getValue,
    setValue,
    debounce,
    isEdited: isTextAreaEntryEdited,
  });
}
