import { useService } from 'bpmn-js-properties-panel';
import {
  isTextFieldEntryEdited,
  TextFieldEntry,
} from '@bpmn-io/properties-panel';
import { without } from 'min-dash';
import { is } from 'bpmn-js/lib/util/ModelUtil';
import {
  findDataStores,
  findDataStoreReferenceShapes,
  idToHumanReadableName,
} from '../DataStoreHelpers';

/**
 * Provides a list of data objects, and allows you to add / remove data objects, and change their ids.
 * @param props
 * @constructor
 */
export function DataStoreArray(props) {
  const { moddle } = props;
  const { element } = props;
  const { commandStack } = props;
  const { elementRegistry } = props;
  let process;

  // This element might be a process, or something that will reference a process.
  if (is(element.businessObject, 'bpmn:Process') || is(element.businessObject, 'bpmn:SubProcess')) {
    process = element.businessObject;
  } else if (element.businessObject.processRef) {
    process = element.businessObject.processRef;
  }

  const dataStores = findDataStores(process);
  const items = dataStores.map((dataStore, index) => {
    const id = `${process.id}-dataObj-${index}`;
    return {
      id,
      label: dataStore.id,
      entries: DataStoreGroup({
        idPrefix: id,
        element,
        dataStore,
      }),
      autoFocusEntry: `${id}-dataStore`,
      remove: removeFactory({
        element,
        dataStore,
        process,
        commandStack,
        elementRegistry,
      }),
    };
  });

  function add(event) {
    event.stopPropagation();
    const newDataStore = moddle.create('bpmn:DataStore');
    const newElements = process.get('flowElements');
    newDataStore.id = moddle.ids.nextPrefixed('DataStore_');
    newDataStore.$parent = process;
    newElements.push(newDataStore);
    commandStack.execute('element.updateModdleProperties', {
      element,
      moddleElement: process,
      properties: {
        flowElements: newElements,
      },
    });
  }

  return { items, add };
}

function removeFactory(props) {
  const { element, dataStore, process, commandStack } = props;

  return function (event) {
    event.stopPropagation();
    commandStack.execute('element.updateModdleProperties', {
      element,
      moddleElement: process,
      properties: {
        flowElements: without(process.get('flowElements'), dataStore),
      },
    });
    // When a data object is removed, remove all references as well.
    const references = findDataStoreReferenceShapes(element.children, dataStore.id);
    for (const ref of references) {
      commandStack.execute('shape.delete', { shape: ref });
    }
  };
}

function DataStoreGroup(props) {
  const { idPrefix, dataStore } = props;

  return [
    {
      id: `${idPrefix}-dataStore`,
      component: DataStoreTextField,
      isEdited: isTextFieldEntryEdited,
      idPrefix,
      dataStore,
    },
  ];
}

function DataStoreTextField(props) {
  const { idPrefix, element, parameter, dataStore } = props;

  const commandStack = useService('commandStack');
  const debounce = useService('debounceInput');

  const setValue = (value) => {
    commandStack.execute('element.updateModdleProperties', {
      element,
      moddleElement: dataStore,
      properties: {
        id: value,
      },
    });

    // Also update the label of all the references
    const references = findDataStoreReferenceShapes(element.children, dataStore.id);
    for (const ref of references) {
      commandStack.execute('element.updateProperties', {
        element: ref,
        moddleElement: ref.businessObject,
        properties: {
          name: idToHumanReadableName(value),
        },
        changed: [ref], // everything is already marked as changed, don't recalculate.
      });
    }
  };

  const getValue = () => {
    return dataStore.id;
  };

  return TextFieldEntry({
    element: parameter,
    id: `${idPrefix}-id`,
    label: 'Data Store Id',
    getValue,
    setValue,
    debounce,
  });
}
