import { SelectEntry } from '@bpmn-io/properties-panel';
import { useService } from 'bpmn-js-properties-panel';
import {
  getExtensionValue,
  setExtensionProperty,
} from '../extensionHelpers';

const spiffExtensionOptions = {};

export const OPTION_TYPE = {
  json: 'json',
  dmn: 'dmn',
};

/**
 * Allow selecting an option from a list of available options, and setting
 * the name and value of a SpiffWorkflow Property to the one selected in the
 * dropdown list.
 * The list of options must be provided by the containing library - by responding
 * to a request passed to the eventBus.
 * When needed, the event "spiff.options.requested" will be fired. The event will include
 * a 'type' attribute that will be one of the following:
 *   * jsonFiles
 *   * dmnFiles
 * The response should be sent to "spiff.options.returned.___"  where the final
 * section is the name requested, ie "spiff.options.returned.jsonFiles" The response
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
    return getExtensionValue(element, name);
  };

  const setValue = (value) => {
    console.log(`Set Value called with ${ value}`);
    setExtensionProperty(element, name, value, moddle, commandStack);
  };

  if (
    !(optionType in spiffExtensionOptions) ||
    spiffExtensionOptions[optionType].length === 0
  ) {
    spiffExtensionOptions[optionType] = [];
    requestOptions(eventBus, element, commandStack, optionType);
  } else {
    console.log("Getting here.", spiffExtensionOptions)
  }
  const getOptions = () => {
    const optionList = [];
    if (optionType in spiffExtensionOptions) {
      spiffExtensionOptions[optionType].forEach((opt) => {
        optionList.push({
          label: opt.label,
          value: opt.value,
        });
      });
    }
    return optionList;
  };

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
  eventBus.once('spiff.options.returned.json', (event) => {
    spiffExtensionOptions[optionType] = event.options;
    commandStack.execute('element.updateProperties', {
      element,
      properties: {},
    });
  });
  eventBus.fire('spiff.options.requested', { eventBus, optionType });
}
