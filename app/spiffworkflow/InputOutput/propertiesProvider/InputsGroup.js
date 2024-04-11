import { ListGroup, DescriptionEntry } from '@bpmn-io/properties-panel';
import { InputParametersArray } from './InputParametersArray.js';

export function createInputsGroup(
  element,
  translate,
  moddle,
  commandStack,
  bpmnFactory
) {

  const { businessObject } = element;

  const group = {
    label: translate('Input/Output Management'),
    id: 'inputs-properties',
    entries: [],
  };

  // add description input
  group.entries.push({
    id: `infos-input-textField`,
    component: DescriptionEntry,
    value:
      'ℹ️ When no specific inputs/ouputs entry is defined, all process variables are accessible.',
    element,
    translate,
    commandStack,
  });

  // add input list component
  group.entries.push({
    id: 'inputParameters',
    label: translate('Inputs'),
    component: ListGroup,
    ...InputParametersArray({
      element,
      moddle,
      translate,
      commandStack,
      bpmnFactory
    }),
  });

  return group;
}
