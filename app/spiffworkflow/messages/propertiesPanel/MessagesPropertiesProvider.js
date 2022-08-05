import {
  TextAreaEntry,
  TextFieldEntry,
  isTextFieldEntryEdited,
} from '@bpmn-io/properties-panel';
import { useService } from 'bpmn-js-properties-panel';
import { is, isAny } from 'bpmn-js/lib/util/ModelUtil';

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
  this.getGroups = function (element) {
    return function (groups) {
      if (is(element, 'bpmn:Collaboration')) {
        groups.push(createCollaborationGroup(element, translate, moddle));
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

function MessageCollaboration(props) {
  const { element } = props;
  const debounce = useService('debounceInput');
  const getValue = () => {
    return '';
  };

  const setValue = (value) => {};

  return (
    <TextAreaEntry
      id="message_collaborations"
      element={element}
      description="description"
      label="label"
      getValue={getValue}
      setValue={setValue}
      debounce={debounce}
    />
  );
}

function messageCollaborationGroup(element, _moddle, _label, _description) {
  return [
    {
      component: MessageCollaboration,
      element,
    },
  ];
}

/**
 * Adds a group to the properties panel for the script task that allows you
 * to set the script.
 * @param element
 * @param translate
 * @returns The components to add to the properties panel. */
function createCollaborationGroup(element, translate, moddle, commandStack) {
  return {
    id: 'collaboration_id',
    label: translate('Message Collaboration'),
    entries: messageCollaborationGroup(
      element,
      moddle,
      'Collab',
      'More Collabor'
    ),
  };
}
