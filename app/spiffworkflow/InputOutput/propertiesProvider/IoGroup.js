import { ListGroup, DescriptionEntry } from '@bpmn-io/properties-panel';
import { InputParametersArray } from './InputParametersArray.js';
import { OutputParametersArray } from './OutputParametersArray.js';

export function createIoGroup(
  element,
  translate,
  moddle,
  commandStack,
  bpmnFactory
) {

  const group = {
    label: translate('Input/Output Management'),
    id: 'ioProperties',
    entries: [],
  };

  // add description input
  group.entries.push({
    id: `infos-textField`,
    component: DescriptionEntry,
    value:
      'ℹ️ When no specific inputs/outputs are defined, all process variables are accessible.',
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

  // add output list component
  group.entries.push({
    id: 'outputParameters',
    label: translate('Outputs'),
    component: ListGroup,
    ...OutputParametersArray({
      element,
      moddle,
      translate,
      commandStack,
      bpmnFactory
    })
  });

  return group;
}
