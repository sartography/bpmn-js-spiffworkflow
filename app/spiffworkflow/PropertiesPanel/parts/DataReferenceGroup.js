import { ListGroup, isTextFieldEntryEdited } from '@bpmn-io/properties-panel';
import { DataObjectSelect } from './DataObjectSelect';
import { DataObjectArray } from './DataObjectArray';

/**
 * Allows you to associate the selected Data Reference to a
 * data object.  Many references can point to the same data object.
 * Also allows you to select which Data Objects are available
 * in the system overall.
 * @param dataElement The selected Data Object Reference
 * @param moddle For updating the underlying xml object
 * @returns {[{component: (function(*)), isEdited: *, id: string, element},{component:
 * (function(*)), isEdited: *, id: string, element}]}
 */
export default function(dataElement, moddle) {

  const groupSections = [];

  groupSections.push({
    id: 'selectDataObject',
    dataElement,
    component: DataObjectSelect,
    isEdited: isTextFieldEntryEdited,
    moddle: moddle,
  });

  const dataObjectArray = {
    id: 'editDataObjects',
    dataElement,
    label: 'Available Data Objects',
    component: ListGroup,
    ...DataObjectArray({ dataElement, moddle })
  };

  console.log('The Data Objects Array is ', dataObjectArray);

  if (dataObjectArray.items) {
    groupSections.push(dataObjectArray);
  }

  return groupSections;
}


