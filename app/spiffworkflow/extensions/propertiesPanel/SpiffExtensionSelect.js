import { SelectEntry } from '@bpmn-io/properties-panel';
import { useService } from 'bpmn-js-properties-panel';
import { getExtensionValue, setExtensionValue } from '../extensionHelpers';

export const spiffExtensionOptions = {};

export const OPTION_TYPE = {
  json_schema_files: 'json_schema_files',
  dmn_files: 'dmn_files',
};

/**
 * Allow selecting an option from a list of available options, and setting
 * the name and value of a SpiffWorkflow Property to the one selected in the
 * dropdown list.
 * The list of options must be provided by the containing library - by responding
 * to a request passed to the eventBus.
 * When needed, the event "spiff.${optionType}.requested" will be fired.
 * The response should be sent to "spiff.${optionType}.returned". The response
 * event should include an 'options' attribute that is list of labels and values:
 * [ { label: 'Product Prices DMN', value: 'Process_16xfaqc' } ]
 */
export function SpiffExtensionSelect(props) {
  const { element } = props;
  const { commandStack } = props;
  const { moddle } = props;
  const { label, description } = props;

  const { name } = props;
  const { optionType } = props;

  const debounce = useService('debounceInput');
  const eventBus = useService('eventBus');

  const getValue = () => {
    return getExtensionValue(element.businessObject, name);
  };

  const setValue = (value) => {
    setExtensionValue(element, name, value, moddle, commandStack);
  };

  const getOptions = () => {
    const optionList = [];
    optionList.push({
      label: '',
      value: '',
    });
    if (
      optionType in spiffExtensionOptions &&
      spiffExtensionOptions[optionType] !== null
    ) {
      spiffExtensionOptions[optionType].forEach((opt) => {
        optionList.push({
          label: opt.label,
          value: opt.value,
        });
      });
    }
    return optionList;
  };

  // always call this code and let the caller determine how to deal with it.
  // this is to avoid state loading issues with react where it doesn't clear out the variable.
  spiffExtensionOptions[optionType] = null;
  requestOptions(eventBus, element, commandStack, optionType);

  return SelectEntry({
    id: `extension_${name}`,
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
  // Little backwards, but you want to assure you are ready to catch, before you throw
  // or you risk a race condition.
  eventBus.on(`spiff.${optionType}.returned`, (event) => {
    spiffExtensionOptions[optionType] = event.options;
  });
  eventBus.fire(`spiff.${optionType}.requested`, { eventBus });
}
