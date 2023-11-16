import { useService } from 'bpmn-js-properties-panel';
import { SelectEntry } from '@bpmn-io/properties-panel';

export const OPTION_TYPE = {
  data_stores: 'data_stores',
};

export const spiffExtensionOptions = {};

export function DataStoreSelect(props) {
  const { element } = props;
  const { commandStack } = props;
  const { modeling, bpmnFactory } = props;
  const { id, label, description, optionType } = props;

  const debounce = useService('debounceInput');
  const eventBus = useService('eventBus');

  const getValue = () => {
    const value = (element.businessObject.dataStoreRef) ? element.businessObject.dataStoreRef.id : '';
    return value;
  };

  const setValue = (value) => {
    if(!value || value == ''){
      modeling.updateProperties(element, {
        dataStoreRef: null
      });
      return;
    }
    const dataStore = bpmnFactory.create('bpmn:DataStore', {
      id: value,
      name: 'DataStore_' + value
    });
    modeling.updateProperties(element, {
      dataStoreRef: dataStore
    });
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
          label: opt.name,
          value: opt.name,
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
  eventBus.on(`spiff.${optionType}.returned`, (event) => {
    spiffExtensionOptions[optionType] = event.options;
  });
  eventBus.fire(`spiff.${optionType}.requested`, { eventBus });
}

