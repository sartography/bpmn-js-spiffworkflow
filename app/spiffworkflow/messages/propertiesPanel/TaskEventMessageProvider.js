import { useService } from "bpmn-js-properties-panel";
import { HeaderButton, ListGroup, isTextFieldEntryEdited } from '@bpmn-io/properties-panel';
import { canReceiveMessage, getMessageRefElement, getRoot } from "../MessageHelpers";
import { CorrelationPropertiesList } from './CorrelationPropertiesList';
import { MessageSelect } from './MessageSelect';
import { MessagePayload } from './MessagePayload';
import { CorrelationCheckboxEntry } from './CorrelationCheckbox';
import { MessageJsonSchemaSelect } from './MessageJsonSchemaSelect';
import { MessageVariable } from './MessageVariable';

/**
 * Adds a group to the properties panel for editing messages for the SendTask
 * @param element
 * @param translate
 * @returns The components to add to the properties panel. */
export function createMessageGroup(
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
        component: MessageJsonSchemaSelect,
        element,
        name: 'msgJsonSchema',
        label: translate('Json-schema input'),
        description: translate('Json-schema description'),
        moddle,
        commandStack
      },
      {
        component: LaunchJsonSchemaEditorButton,
        element,
        name: 'messageRef',
        label: translate('Launch Editor')
      }
    ]
  })

  return results;
}

function LaunchJsonSchemaEditorButton(props) {
  const { element } = props;
  const eventBus = useService('eventBus');
  return HeaderButton({
    id: 'spiffworkflow-search-call-activity-button',
    class: 'spiffworkflow-properties-panel-button',
    children: 'Launch Editor',
    onClick: () => {
      const { businessObject } = element;

      const msgRef = getMessageRefElement(element);
      if (!msgRef) {
        alert('Please select a message');
        return '';
      }

      let definitions = getRoot(businessObject);
      if (!definitions.get('rootElements')) {
        definitions.set('rootElements', []);
      }

      // Retrieve Message
      let bpmnMessage = definitions.get('rootElements').find(element =>
        element.$type === 'bpmn:Message' && (element.id === msgRef.id || element.name === msgRef.id)
      );

      if (!bpmnMessage) {
        alert('Error : Message not found!');
        return '';
      }

      eventBus.fire('spiff.msg_json_schema_editor.requested', {
        messageId: msgRef.name,
        schemaId: bpmnMessage.get('jsonSchemaId'),
        eventBus,
        element
      });
    }
  });
}