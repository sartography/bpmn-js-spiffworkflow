import { useService } from 'bpmn-js-properties-panel';
import { SelectEntry } from '@bpmn-io/properties-panel';
import {
  getMessageRefElement,
  getRoot,
  getMessageSchemaFile,
  setMessageSchemaFile,
} from '../../MessageHelpers';

export const spiffExtensionOptions = {};

export function MessageJsonSchemaSelect(props) {
  const { id, label, description } = props;

  const { element } = props;
  const { commandStack } = props;

  const debounce = useService('debounceInput');
  const eventBus = useService('eventBus');
  const bpmnFactory = useService('bpmnFactory');
  const moddle = useService('moddle');

  const optionType = 'messages_schemas';

  const getValue = () => {
    const { businessObject } = element;

    const msgRef = getMessageRefElement(element);
    if (!msgRef) {
      return '';
    }

    let definitions = getRoot(businessObject);
    if (!definitions.get('rootElements')) {
      definitions.set('rootElements', []);
    }

    let bpmnMessage = definitions
      .get('rootElements')
      .find(
        (el) =>
          el.$type === 'bpmn:Message' &&
          (el.id === msgRef.id || el.name === msgRef.id)
      );

    if (!bpmnMessage) {
      return '';
    }

    return getMessageSchemaFile(bpmnMessage);
  };

  const setValue = (value) => {
    const { businessObject } = element;
    const msgRef = getMessageRefElement(element);

    if (!msgRef) {
      alert('Please select a message');
      return;
    }

    let definitions = getRoot(businessObject);
    if (!definitions.get('rootElements')) {
      definitions.set('rootElements', []);
    }

    // Retrieve Message
    let bpmnMessage = definitions
      .get('rootElements')
      .find(
        (el) =>
          el.$type === 'bpmn:Message' &&
          (el.id === msgRef.id || el.name === msgRef.id)
      );

    if (bpmnMessage) {
      setMessageSchemaFile(bpmnMessage, value, moddle);
    }
  };

  if (
    !(optionType in spiffExtensionOptions) ||
    spiffExtensionOptions[optionType] === null
  ) {
    spiffExtensionOptions[optionType] = null;
    requestOptions(eventBus, element, commandStack, optionType);
  }

  const getOptions = () => {
    const optionList = [];
    // optionList.push({
    //   label: '',
    //   value: '',
    // });
    if (
      optionType in spiffExtensionOptions &&
      spiffExtensionOptions[optionType] !== null
    ) {
      spiffExtensionOptions[optionType].forEach((opt) => {
        optionList.push({
          label: opt.schema_id,
          value: opt.schema_id,
        });
      });
    }
    return optionList;
  };

  return SelectEntry({
    id,
    element,
    label,
    description,
    getValue,
    setValue,
    getOptions,
    debounce,
  });
}

function requestOptions(eventBus, element, commandStack, optionType) {
  eventBus.on('spiff.message_schemas.returned', (event) => {
    spiffExtensionOptions[optionType] = event.options;
  });
  eventBus.fire(`spiff.message_schemas.requested`, { eventBus });
}
