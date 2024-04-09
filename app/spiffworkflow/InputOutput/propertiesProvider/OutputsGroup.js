import { ListGroup, DescriptionEntry } from '@bpmn-io/properties-panel';

export function createOutputsGroup(
  element,
  translate,
  moddle,
  commandStack,
  bpmnFactory
) {

  const { businessObject } = element;

  const group = {
    label: translate('Outputs'),
    id: 'outputs-properties',
    entries: [],
  };

  group.entries.push({
    id: `infos-input-textField`,
    component: DescriptionEntry,
    value: 'ℹ️ Default Access: When no specific outputs are defined, all process variables are accessible.',
    element,
    translate,
    commandStack,
  });

  // other custom properties as needed
  // group.entries.push({
  //   id: 'selectDataStore',
  //   element,
  //   component: DataStoreSelect,
  //   optionType: OPTION_TYPE.data_stores,
  //   moddle,
  //   commandStack,
  //   translate,
  //   name: 'dataStoreRef',
  //   label: translate('Select DataSource'),
  //   description,
  //   modeling,
  //   bpmnFactory,
  // });

  return group;
}