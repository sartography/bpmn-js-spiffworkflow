import { is } from 'bpmn-js/lib/util/ModelUtil';
import { isMessageElement } from '../MessageHelpers';

import { createCollaborationGroup } from './processLevelProvider/CollaborationPropertiesProvider';
import { createMessageGroup } from './elementLevelProvider/TaskEventMessageProvider';

const LOW_PRIORITY = 500;

export default function MessagesPropertiesProvider(
  propertiesPanel,
  translate,
  moddle,
  commandStack,
  elementRegistry
) {
  this.getGroups = function getGroupsCallback(element) {
    return function pushGroup(groups) {
      // if (is(element, 'bpmn:Collaboration') || is(element, 'bpmn:Process')) {
      //   groups.push(
      //     ...createCollaborationGroup(
      //       element,
      //       translate,
      //       moddle,
      //       commandStack,
      //       elementRegistry
      //     )
      //   );
      // } else 
      if (isMessageElement(element)) {
        const messageIndex = findEntry(groups, 'message');
        if (messageIndex) {
          groups.splice(messageIndex, 1);
        }
        groups.push(
          ...createMessageGroup(
            element,
            translate,
            moddle,
            commandStack,
            elementRegistry
          )
        );
      }
      return groups;
    };
  };

  function findEntry(entries, entryId) {
    let entryIndex = null;
    entries.forEach(function (value, index) {
      if (value.id === entryId) {
        entryIndex = index;
      }
    });
    return entryIndex;
  }

  propertiesPanel.registerProvider(LOW_PRIORITY, this);
}

MessagesPropertiesProvider.$inject = [
  'propertiesPanel',
  'translate',
  'moddle',
  'commandStack',
  'elementRegistry',
];