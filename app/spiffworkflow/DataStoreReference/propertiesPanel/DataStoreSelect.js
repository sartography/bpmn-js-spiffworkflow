import { useService } from 'bpmn-js-properties-panel';
import { SelectEntry } from '@bpmn-io/properties-panel';
import { isDataStoreReferenced, removeDataStore } from '../DataStoreHelpers';
import { getRoot } from '../../helpers';

export const OPTION_TYPE = {
  data_stores: 'data_stores',
};

export const spiffExtensionOptions = {};

export function DataStoreSelect(props) {

  const { id, label, description, optionType } = props;

  const { element } = props;
  const { commandStack } = props;
  const { modeling } = props;

  const debounce = useService('debounceInput');
  const eventBus = useService('eventBus');
  const bpmnFactory = useService('bpmnFactory');

  const getValue = () => {
    const dtRef = element.businessObject.dataStoreRef;
    return dtRef
      ? dtRef.id
      : '';
  };

  const setValue = (value) => {

    const { businessObject } = element;

    const process = businessObject.$parent;
    
    const definitions = getRoot(businessObject);
    if (!definitions.get('rootElements')) {
      definitions.set('rootElements', []);
    }
    
    const valId = value

    if (!valId || valId == '') {
      const oldDataStoreId = businessObject.dataStoreRef.id;
      modeling.updateProperties(element, {
        name: '',
        dataStoreRef: null,
        type: ''
      });
      // If previous datastore is not used, delete it
      if (!isDataStoreReferenced(process, oldDataStoreId)) {
        const rootElements = definitions.get('rootElements');
        const oldMessageIndex = rootElements.findIndex(element => element.$type === 'bpmn:DataStore' && element.id === oldDataStoreId);
        if (oldMessageIndex !== -1) {
          rootElements.splice(oldMessageIndex, 1);
          definitions.rootElements = rootElements;
        }
      }
      return;
    }

    const valClz = GetDataStoreAttrById('clz', value);
    const valName = GetDataStoreAttrById('name', value);
    const valType = GetDataStoreAttrById('type', value);

    // Persist Current DataStore Ref
    const currentDataStoreRef = element.businessObject.dataStoreRef;

    // Create DataStore
    let dataStore = definitions.get('rootElements').find(element =>
      element.$type === 'bpmn:DataStore' && element.id === valId
    );

    // If the DataStore doesn't exist, create new one
    if (!dataStore) {
      dataStore = bpmnFactory.create('bpmn:DataStore', {
        id: valId,
        name: valClz
      });
      definitions.get('rootElements').push(dataStore);
    }

    modeling.updateProperties(element, {
      name: valName,
      dataStoreRef: dataStore,
      type: valType
    });

    // Remove the old DataStore if it's no longer referenced
    if (currentDataStoreRef && !isDataStoreReferenced(process, currentDataStoreRef.id)) {
      removeDataStore(definitions, currentDataStoreRef.id);
    }
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
          label: opt.name,
          value: opt.id,
        });
      });
    }
    return optionList;
  };

  
  if (
    !(optionType in spiffExtensionOptions) ||
    spiffExtensionOptions[optionType] === null
  ) {
    spiffExtensionOptions[optionType] = null;
    requestOptions(eventBus, element, commandStack, optionType);
  }

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

function GetDataStoreAttrById(prop, id) {
  const arr = spiffExtensionOptions['data_stores'];
  const item = arr.find(obj => obj.id === id);
  return item ? item[prop] : null;
}

