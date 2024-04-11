import { useService } from 'bpmn-js-properties-panel';
import {
  isTextFieldEntryEdited,
  TextFieldEntry,
} from '@bpmn-io/properties-panel';

export function InputParametersArray(props) {

  const { element, moddle, translate, commandStack, bpmnFactory } = props;
  const { businessObject } = element;

  const ioSpecification = businessObject.ioSpecification;
  
  const inputsEntries = (ioSpecification)? ioSpecification.dataInputs : [];

  const items = inputsEntries.map((inputEntry, index) => {
    console.log('inputEntry : ', inputEntry);
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
      autoFocusEntry: `sss-dataObject`,
      remove: removeFactory({
        element, moddle, commandStack, inputEntry
      }),
    };
  });

  function add(event) {
    const { businessObject } = element;

    const newInputID = moddle.ids.nextPrefixed('DataInput_');

    // Create a new DataInput
    const newInput = bpmnFactory.create('bpmn:DataInput', { id: newInputID, name: newInputID });

    // Check if ioSpecification already exists
    let ioSpecification = businessObject.ioSpecification;
    if (!ioSpecification) {

        ioSpecification = bpmnFactory.create('bpmn:InputOutputSpecification', {
            dataInputs: [newInput],
            dataOutputs: [],
            inputSets: [],
            outputSets: [],
        });

        let inputSet = bpmnFactory.create('bpmn:InputSet', { dataInputRefs: [newInput] });
        ioSpecification.inputSets = [inputSet];

        businessObject.ioSpecification = ioSpecification;
    } else {
        ioSpecification.dataInputs.push(newInput);

        // Assuming there is at least one inputSet, add the newInput to the first inputSet
        if (ioSpecification.inputSets && ioSpecification.inputSets.length > 0) {
            ioSpecification.inputSets[0].dataInputRefs.push(newInput);
        } else {
            // If no inputSet exists, create newone
            let inputSet = bpmnFactory.create('bpmn:InputSet', { dataInputRefs: [newInput] });
            ioSpecification.inputSets = [inputSet];
        }
    }

    // Update the element
    commandStack.execute('element.updateProperties', {
        element,
        moddleElement: businessObject,
        properties: {}
    });

    event.stopPropagation();
  }

  return { items, add };
}

function removeFactory(props) {
  const { element, bpmnFactory, commandStack, inputEntry } = props;
  return function (event) {
    event.stopPropagation();

    const ioSpecification = element.businessObject.ioSpecification;

    if (!ioSpecification) {
      console.error('No ioSpecification found for this element.');
      return;
    }

    const dataInputIndex = ioSpecification.dataInputs.findIndex(input => input.id === inputEntry.name);
    if (dataInputIndex > -1) {
      const [ removedInput ] = ioSpecification.dataInputs.splice(dataInputIndex, 1);

      // Removing the reference from the inputSet
      ioSpecification.inputSets.forEach(set => {
        const inputRefIndex = set.dataInputRefs.indexOf(removedInput);
        if (inputRefIndex > -1) {
          set.dataInputRefs.splice(inputRefIndex, 1);
        }
      });

      commandStack.execute('element.updateProperties', {
        element: element,
        moddleElement: element.businessObject,
        properties: {}
      });
    } else {
      console.error(`No DataInput found for id ${inputEntry.name}`);
    }
  };
}

function InputParamGroup(props) {

  const { id, inputEntry, element, moddle, commandStack, translate, bpmnFactory } = props;

  return [
    {
      id,
      inputEntry,
      component: InputParamTextField,
      isEdited: isTextFieldEntryEdited,
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

        if(!value || value == ''){
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

        commandStack.execute('element.updateProperties', {
            element: element,
            moddleElement: element.businessObject,
            properties: {}
        });

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
