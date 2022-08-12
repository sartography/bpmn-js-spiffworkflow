import {
  ListGroup,
  TextAreaEntry,
  TextFieldEntry,
  isTextFieldEntryEdited,
} from '@bpmn-io/properties-panel';
import { useService } from 'bpmn-js-properties-panel';
import { is, isAny } from 'bpmn-js/lib/util/ModelUtil';
import { CorrelationKeysArray } from './CorrelationKeysArray';
import {DataObjectSelect} from '../../DataObject/propertiesPanel/DataObjectSelect';
import {MessageSelect} from './MessageSelect';
import {MessagePayload} from './MessagePayload';
import { MessageCorrelations, MessageCorrelationsArray } from './MessageCorrelationsArray';

// import { SpiffExtensionCalledDecision } from './SpiffExtensionCalledDecision';
// import { SpiffExtensionTextInput } from './SpiffExtensionTextInput';
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
      if (is(element, 'bpmn:Collaboration')) {
        groups.push(createCollaborationGroup(element, translate, moddle, commandStack, elementRegistry));
      }
      if (is(element, 'bpmn:SendTask')) {
        groups.push(createMessageGroup(element, translate, moddle, commandStack, elementRegistry));
      }
      return groups;
    };
  };
  propertiesPanel.registerProvider(LOW_PRIORITY, this);
}

MessagesPropertiesProvider.$inject = [
  'propertiesPanel',
  'translate',
  'moddle',
  'commandStack',
  'elementRegistry',
];

// function CorrelationKeysComponent(props) {
//   const { element } = props;
//   const debounce = useService('debounceInput');
//   const getValue = () => {
//     return '';
//   };
//
//   const setValue = (value) => {};
//
//   return (
//     <TextAreaEntry
//       id="message_collaborations"
//       element={element}
//       description="description"
//       label="label"
//       getValue={getValue}
//       setValue={setValue}
//       debounce={debounce}
//     />
//   );
// }
//
// function CorrelationKeyNew() {
//
// }
//
// function CorrelationKeyAddButton(props) {
//   const { element } = props;
//   const debounce = useService('debounceInput');
//   const getValue = () => {
//     return '';
//   };
//
//   const setValue = (value) => {};
//
//   // return (
//   //   <TextAreaEntry
//   //     id="message_collaborations"
//   //     element={element}
//   //     description="description"
//   //     label="label"
//   //     getValue={getValue}
//   //     setValue={setValue}
//   //     debounce={debounce}
//   //   />
//   // );
//   return (
//     <HeaderButton
//       className="spiffworkflow-properties-panel-button"
//       onClick={CorrelationKeyNew}
//     >
//       Add Correlation Key
//     </HeaderButton>
//   )
// }
//
// function correlationKeysEntries(element, moddle, _label, _description, commandStack, elementRegistry) {
//   return [
//     {
//       component: ListGroup,
//       element,
//       id: 'editStuffs',
//       label: 'The Stuffs',
//       commandStack,
//       elementRegistry,
//       element,
//       moddle,
//       ...CorrelationKeysArray({ element, moddle, commandStack, elementRegistry }),
//     },
//   ];
// }

/**
 * Adds a group to the properties panel for the script task that allows you
 * to set the script.
 * @param element
 * @param translate
 * @returns The components to add to the properties panel. */
function createCollaborationGroup(element, translate, moddle, commandStack, elementRegistry) {
  return {
    id: 'correlation_keys',
    label: translate('Correlation Keys'),
    component: ListGroup,
    ...CorrelationKeysArray({ element, moddle, commandStack, elementRegistry }),
  };
}

/**
 * Adds a group to the properties panel for editing messages for the SendTask
 * @param element
 * @param translate
 * @returns The components to add to the properties panel. */
function createMessageGroup(element, translate, moddle, commandStack, elementRegistry) {
  return {
    id: 'messages',
    label: translate('Message'),
    entries: [
      {
        id: 'selectMessage',
        element,
        component: MessageSelect,
        isEdited: isTextFieldEntryEdited,
        moddle,
        commandStack,
      },
      {
        id: 'messagePayload',
        element,
        component: MessagePayload,
        isEdited: isTextFieldEntryEdited,
        moddle,
        commandStack,
      },
      {
        id: 'messageCorrelations',
        label: translate("Message Correlations"),
        component: ListGroup,
        ...MessageCorrelationsArray({ element, moddle, commandStack, elementRegistry }),
      },
    ],
  };
}

