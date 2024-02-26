import { ListGroup, isTextFieldEntryEdited } from '@bpmn-io/properties-panel';
import { is } from 'bpmn-js/lib/util/ModelUtil';
import { CorrelationKeysArray } from './CorrelationKeysArray';
import { MessageSelect } from './MessageSelect';
import { MessagePayload } from './MessagePayload';
import { MessageVariable } from './MessageVariable';
import { CorrelationPropertiesArray } from './CorrelationPropertiesArray';
import { CorrelationPropertiesList } from './CorrelationPropertiesList';
import { MessageArray } from './MessageArray';
import { isMessageElement, canReceiveMessage } from '../MessageHelpers';
import { CorrelationCheckboxEntry } from './CorrelationCheckbox';
import { OPTION_TYPE, SpiffExtensionSelect } from '../../extensions/propertiesPanel/SpiffExtensionSelect';
import { SpiffExtensionLaunchButton } from '../../extensions/propertiesPanel/SpiffExtensionLaunchButton';

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
      if (is(element, 'bpmn:Collaboration') || is(element, 'bpmn:Process')) {
        groups.push(
          ...createCollaborationGroup(
            element,
            translate,
            moddle,
            commandStack,
            elementRegistry
          )
        );
      } else if (isMessageElement(element)) {
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

/**
 * Adds a group to the properties panel for the script task that allows you
 * to set the script.
 * @param element
 * @param translate
 * @returns The components to add to the properties panel. */
function createCollaborationGroup(
  element,
  translate,
  moddle,
  commandStack,
  elementRegistry
) {

  const results = [
    {
      id: 'messages',
      label: translate('Messages'),
      isDefault: true,
      component: ListGroup,
      ...MessageArray({
        element,
        moddle,
        commandStack,
        elementRegistry,
        translate,
      }),
    },
    {
      id: 'correlation_properties',
      label: translate('Correlation Properties'),
      isDefault: true,
      component: ListGroup,
      ...CorrelationPropertiesArray({
        element,
        moddle,
        commandStack,
        elementRegistry,
        translate,
      }),
    }
  ];

  if (element.type === 'bpmn:Collaboration') {
    results.push({
      id: 'correlation_keys',
      label: translate('Correlation Keys'),
      isDefault: true,
      component: ListGroup,
      ...CorrelationKeysArray({
        element,
        moddle,
        commandStack,
        elementRegistry,
        translate,
      }),
    })
  }
  
  return results;
}

/**
 * Adds a group to the properties panel for editing messages for the SendTask
 * @param element
 * @param translate
 * @returns The components to add to the properties panel. */
function createMessageGroup(
  element,
  translate,
  moddle,
  commandStack,
  elementRegistry
) {

  const entries = [
    {
      id: 'selectMessage',
      element,
      component: MessageSelect,
      isEdited: isTextFieldEntryEdited,
      moddle,
      commandStack,
    },
  ];

  if (canReceiveMessage(element)) {
    entries.push({
      id: 'messageVariable',
      element,
      component: MessageVariable,
      isEdited: isTextFieldEntryEdited,
      moddle,
      commandStack,
    });
  } else {
    entries.push({
      id: 'messagePayload',
      element,
      component: MessagePayload,
      isEdited: isTextFieldEntryEdited,
      moddle,
      commandStack,
    });
  }

  // entries.push({
  //   id: 'correlationProperties',
  //   label: translate('Correlation'),
  //   component: ListGroup,
  //   ...MessageCorrelationPropertiesArray({
  //     element,
  //     moddle,
  //     commandStack,
  //     elementRegistry,
  //     translate,
  //   }),
  // });

  entries.push({
    id: 'isCorrelated',
    element,
    moddle,
    commandStack,
    component: CorrelationCheckboxEntry,
    name: 'enable.correlation',
    label: 'Enable Correlation',
    description: 'Enable Correlation desc',
  });

  var results = [
    {
      id: 'messages',
      label: translate('Message'),
      isDefault: true,
      entries,
    }
  ]

  const { businessObject } = element;

  if (businessObject.get('isCorrelated')) {
    results.push({
      id: 'correlation_properties',
      label: translate('Correlation Properties'),
      isDefault: true,
      component: ListGroup,
      ...CorrelationPropertiesList({
        element,
        moddle,
        commandStack,
        elementRegistry,
        translate,
      }),
    })
  }

  results.push({
    id: 'messageSchema',
    label: translate('Json-Schema'),
    entries: [
      {
        element,
        moddle,
        commandStack,
        component: SpiffExtensionSelect,
        optionType: OPTION_TYPE.json_schema_files,
        name: 'formJsonSchemaFilename',
        label: translate('JSON Schema Filename'),
        description: translate('Form Description (RSJF)'),
      },
      {
        component: SpiffExtensionLaunchButton,
        element,
        moddle,
        commandStack,
        name: 'msgJsonSchema',
        label: translate('Launch Editor'),
        event: 'spiff.msg_json_schema_files.requested',
        listenEvent: 'spiff.msg_json_schema_files.requested',
        description: translate('Edit the form schema')
      }
    ]
  })

  return results;
}
