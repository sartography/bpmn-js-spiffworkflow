import { ListGroup } from '@bpmn-io/properties-panel';
import { DataStoreArray } from './DataStoreArray';

/**
 * Also allows you to select which Data Objects are available
 * in the process element.
 * @param element The selected process
 * @param moddle For updating the underlying xml object
 * @returns {[{component: (function(*)), isEdited: *, id: string, element},{component:
 * (function(*)), isEdited: *, id: string, element}]}
 */
export default function(element, moddle) {

  const groupSections = [];
  const dataStoreArray = {
    id: 'editDataStores',
    element,
    label: 'Available Data Objects',
    component: ListGroup,
    ...DataStoreArray({ element, moddle })
  };

  if (dataStoreArray.items) {
    groupSections.push(dataStoreArray);
  }

  return groupSections;
}


