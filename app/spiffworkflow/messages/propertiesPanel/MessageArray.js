import { useService } from 'bpmn-js-properties-panel';
import { TextFieldEntry } from '@bpmn-io/properties-panel';
import {
  findCorrelationKeys,
  getRoot,
  findMessageModdleElements,
} from '../MessageHelpers';

/**
 * Provides a list of data objects, and allows you to add / remove data objects, and change their ids.
 * @param props
 * @constructor
 */
export function MessageArray(props) {
  const { element, moddle, commandStack, translate } = props;

  const messageElements = findMessageModdleElements(element.businessObject);
  const items = messageElements.map((messageElement, index) => {
    const id = `messageElement-${index}`;
    return {
      id,
      label: messageElement.name,
      entries: messageGroup({
        id,
        element,
        messageElement,
        commandStack,
        translate,
      }),
      autoFocusEntry: id,
    };
  });

  function add(event) {
    event.stopPropagation();
    if (element.type === 'bpmn:Collaboration') {
      const newMessageElement = moddle.create('bpmn:Message');
      const messageId = moddle.ids.nextPrefixed('Message_');
      newMessageElement.id = messageId;
      newMessageElement.name = messageId;
      const rootElement = getRoot(element.businessObject);
      const { rootElements } = rootElement;
      rootElements.push(newMessageElement);
      commandStack.execute('element.updateProperties', {
        element,
        moddleElement: moddle,
        properties: {
          messages: rootElements,
        },
      });
    }
  }

  return { items, add };
}

function messageGroup(props) {
  const { messageElement, commandStack, translate } = props;
  const id = `message-${messageElement.name}`;
  return [
    {
      id: `${id}-${messageElement.name}-key`,
      component: MessageIdTextField,
      messageElement,
      commandStack,
      translate,
    },
    {
      id: `${id}-${messageElement.name}-key`,
      component: MessageNameTextField,
      messageElement,
      commandStack,
      translate,
    },
  ];
}

function MessageIdTextField(props) {
  const { id, element, messageElement, commandStack, translate } = props;

  const debounce = useService('debounceInput');
  const setValue = (value) => {
    commandStack.execute('element.updateModdleProperties', {
      element,
      moddleElement: messageElement,
      properties: {
        id: value,
      },
    });
  };

  const getValue = () => {
    return messageElement.id;
  };

  return TextFieldEntry({
    element,
    id: `${id}-id-textField`,
    label: translate('ID'),
    getValue,
    setValue,
    debounce,
  });
}

function MessageNameTextField(props) {
  const { id, element, messageElement, commandStack, translate } = props;

  const debounce = useService('debounceInput');
  const setValue = (value) => {
    commandStack.execute('element.updateModdleProperties', {
      element,
      moddleElement: messageElement,
      properties: {
        name: value,
      },
    });
  };

  const getValue = () => {
    return messageElement.name;
  };

  return TextFieldEntry({
    element,
    id: `${id}-name-textField`,
    label: translate('Name'),
    getValue,
    setValue,
    debounce,
  });
}
