import { useService } from 'bpmn-js-properties-panel';
import { SelectEntry } from '@bpmn-io/properties-panel';

export const spiffExtensionOptions = {};

export function MessageJsonSchemaSelect(props) {

  const { id, label, description } = props;

  const { element } = props;
  const { commandStack } = props;
  const { modeling } = props;

  const debounce = useService('debounceInput');
  const eventBus = useService('eventBus');
  const bpmnFactory = useService('bpmnFactory');

  const optionType = "messages_schemas"

  const getValue = () => {
    console.log('Get Value');
    return '';
  };

  const setValue = (value) => {
    const { businessObject } = element;
    console.log('Set Value', businessObject);
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
