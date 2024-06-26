/* eslint-disable prettier/prettier */
/* eslint-disable no-param-reassign */
/* eslint-disable import/no-extraneous-dependencies */
import { is } from 'bpmn-js/lib/util/ModelUtil';
import { isTextFieldEntryEdited, isCheckboxEntryEdited } from '@bpmn-io/properties-panel';
import { InputItem } from './propertiesPanel/InputItemEntry';
import { LoopCardinality } from './propertiesPanel/LoopCardinalityEntry';
import { InputCollection } from './propertiesPanel/InputCollectionEntry';
import { OutputItem } from './propertiesPanel/OutputItemEntry';
import { OutputCollection } from './propertiesPanel/OutputCollectionEntry';
import { CompletionCondition } from './propertiesPanel/CompletionConditionEntry';
import { IsOutputElSync } from './propertiesPanel/IsIOSyncEntry';

const LOW_PRIORITY = 500;

export default function MultiInstancePropertiesProvider(propertiesPanel) {
  this.getGroups = function getGroupsCallback(element) {
    return function pushGroup(groups) {
      if (
        is(element, 'bpmn:Task') ||
        is(element, 'bpmn:CallActivity') ||
        is(element, 'bpmn:SubProcess')
      ) {
        const group = groups.filter((g) => g.id === 'multiInstance');
        if (group.length === 1) updateMultiInstanceGroup(element, group[0]);
      }
      return groups;
    };
  };
  propertiesPanel.registerProvider(LOW_PRIORITY, this);
}

MultiInstancePropertiesProvider.$inject = ['propertiesPanel'];

function updateMultiInstanceGroup(element, group) {
  group.entries = MultiInstanceProps({ element });
  group.shouldOpen = true;
}

function MultiInstanceProps(props) {
  const { element } = props;
  const { businessObject } = element;

  return [
    {
      id: 'loopCardinality',
      component: LoopCardinality,
      isEdited: isTextFieldEntryEdited,
    },
    {
      id: 'loopDataInputRef',
      component: InputCollection,
      isEdited: isTextFieldEntryEdited,
    },
    {
      id: 'dataInputItem',
      component: InputItem,
      isEdited: isTextFieldEntryEdited,
    },
    {
      id: 'isOutputElSynchronized',
      component: IsOutputElSync,
      isEdited: isCheckboxEntryEdited,
    },
    {
      id: 'loopDataOutputRef',
      component: OutputCollection,
      isEdited: isTextFieldEntryEdited,
    },
    !businessObject.get('spiffworkflow:isOutputSynced')
      ? {
          id: 'dataOutputItem',
          component: OutputItem,
          isEdited: isTextFieldEntryEdited,
        }
      : {},
    {
      id: 'completionCondition',
      component: CompletionCondition,
      isEdited: isTextFieldEntryEdited,
    },
  ];
}
