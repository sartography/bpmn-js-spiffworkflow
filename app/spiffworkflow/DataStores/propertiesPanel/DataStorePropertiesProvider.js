import { is, isAny } from 'bpmn-js/lib/util/ModelUtil';
import { ListGroup, isTextFieldEntryEdited } from '@bpmn-io/properties-panel';
import { DataStoreSelect } from './DataStoreSelect';
import { DataStoreArray } from './DataStoreArray';

const LOW_PRIORITY = 500;

export default function DataStorePropertiesProvider(
  propertiesPanel,
  translate,
  moddle,
  commandStack,
  elementRegistry
) {
  this.getGroups = function (element) {
    return function (groups) {
      if (is(element, 'bpmn:DataStoreReference')) {
        groups.push(
          createDataStoreSelector(element, translate, moddle, commandStack)
        );
      }
      if (
        isAny(element, ['bpmn:Process', 'bpmn:Participant']) ||
        (is(element, 'bpmn:SubProcess') && !element.collapsed)
      ) {
        groups.push(
          createDataStoreEditor(
            element,
            translate,
            moddle,
            commandStack,
            elementRegistry
          )
        );
      }
      return groups;
    };
  };
  propertiesPanel.registerProvider(LOW_PRIORITY, this);
}

DataStorePropertiesProvider.$inject = [
  'propertiesPanel',
  'translate',
  'moddle',
  'commandStack',
  'elementRegistry',
];

/**
 * Create a group on the main panel with a select box (for choosing the Data Object to connect)
 * @param element
 * @param translate
 * @param moddle
 * @returns entries
 */
function createDataStoreSelector(element, translate, moddle, commandStack) {
  return {
    id: 'data_object_properties',
    label: translate('Data Object Properties'),
    entries: [
      {
        id: 'selectDataStore',
        element,
        component: DataStoreSelect,
        isEdited: isTextFieldEntryEdited,
        moddle,
        commandStack,
      },
    ],
  };
}

/**
 * Create a group on the main panel with a select box (for choosing the Data Object to connect) AND a
 * full Data Object Array for modifying all the data objects.
 * @param element
 * @param translate
 * @param moddle
 * @returns entries
 */
function createDataStoreEditor(
  element,
  translate,
  moddle,
  commandStack,
  elementRegistry
) {
  const dataStoreArray = {
    id: 'editDataStores',
    element,
    label: 'Data Objects',
    component: ListGroup,
    ...DataStoreArray({ element, moddle, commandStack, elementRegistry }),
  };

  if (dataStoreArray.items) {
    return dataStoreArray;
  }
}
