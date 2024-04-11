import { is } from 'bpmn-js/lib/util/ModelUtil';
import { createIoGroup } from './IoGroup.js';

const LOW_PRIORITY = 500;

export default function IoPropertiesProvider(
  propertiesPanel,
  translate,
  moddle,
  commandStack,
  elementRegistry,
  bpmnFactory
) {
  this.getGroups = function getGroupsCallback(element) {
    return function pushGroup(groups) {
      if (isBpmnTask(element)) {
        groups.push(
          createIoGroup(
            element,
            translate,
            moddle,
            commandStack,
            bpmnFactory
          )
        );
      }
      return groups;
    };
  };

  propertiesPanel.registerProvider(LOW_PRIORITY, this);
}

IoPropertiesProvider.$inject = [
  'propertiesPanel',
  'translate',
  'moddle',
  'commandStack',
  'elementRegistry',
  'bpmnFactory',
];

function isBpmnTask(element) {
  if (!element) {
    return false;
  }
  return (
    is(element, 'bpmn:UserTask') ||
    is(element, 'bpmn:ScriptTask') ||
    is(element, 'bpmn:ServiceTask') ||
    is(element, 'bpmn:SendTask') ||
    is(element, 'bpmn:ReceiveTask') ||
    is(element, 'bpmn:ManualTask')
  );
}
