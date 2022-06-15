import scriptProps from './parts/ScriptProps';
import { is } from 'bpmn-js/lib/util/ModelUtil';

const LOW_PRIORITY = 500;

export default function SpiffWorkflowPropertiesProvider(propertiesPanel, translate) {

  this.getGroups = function(element) {
    return function(groups) {
      if (is(element, 'bpmn:ScriptTask')) {
        groups.push(createScriptGroup(element, translate));
      }
      return groups;
    };
  };

  propertiesPanel.registerProvider(LOW_PRIORITY, this);
}

SpiffWorkflowPropertiesProvider.$inject = [ 'propertiesPanel', 'translate' ];

function createScriptGroup(element, translate) {
  const spiffGroup = {
    id: 'spiff',
    label: translate('SpiffWorkflow Properties'),
    entries: scriptProps(element)
  };

  return spiffGroup;
}
