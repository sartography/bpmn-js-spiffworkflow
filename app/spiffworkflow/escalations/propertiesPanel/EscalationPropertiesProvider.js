import { is } from 'bpmn-js/lib/util/ModelUtil';
import { getRoot } from '../../helpers';
import { getArrayForType, getListGroupForType } from '../../eventList.js';
import { hasEventType,
  replaceGroup,
  getSelectorForType,
  getConfigureGroupForType
} from '../../eventSelect.js';

const LOW_PRIORITY = 500;

const eventDetails = {
  'eventType': 'bpmn:Escalation',
  'eventDefType': 'bpmn:EscalationEventDefinition',
  'referenceType': 'errorRef',
  'idPrefix': 'error',
};

export default function EscalationPropertiesProvider(
  propertiesPanel,
  translate,
  moddle,
  commandStack,
) {

  this.getGroups = function (element) {
    return function (groups) {
      if (is(element, 'bpmn:Process') || is(element, 'bpmn:Collaboration')) {
        const getEscalationArray = getArrayForType('bpmn:Escalation', 'errorRef', 'Escalation');
        const errorGroup = getListGroupForType('escalations', 'Escalations', getEscalationArray);
        groups.push(errorGroup({ element, translate, moddle, commandStack }));
      } else if (hasEventType(element, 'bpmn:EscalationEventDefinition')) {
        const getEscalationSelector = getSelectorForType(eventDetails);
        const errorGroup = getConfigureGroupForType(eventDetails, 'Escalation', true, getEscalationSelector);
        const group = errorGroup({ element, translate, moddle, commandStack });
        replaceGroup('error', groups, group);
      }
      return groups;
    };
  };
  propertiesPanel.registerProvider(LOW_PRIORITY, this);
}

EscalationPropertiesProvider.$inject = [
  'propertiesPanel',
  'translate',
  'moddle',
  'commandStack',
];
