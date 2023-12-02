import { is, isAny } from 'bpmn-js/lib/util/ModelUtil';
import { ListGroup, isTextFieldEntryEdited, TextFieldEntry } from '@bpmn-io/properties-panel';
import { DataObjectSelect } from './DataObjectSelect';
import { DataObjectArray } from './DataObjectArray';
import { useService } from 'bpmn-js-properties-panel';

const LOW_PRIORITY = 500;

export default function DataObjectPropertiesProvider(
  propertiesPanel,
  translate,
  moddle,
  commandStack,
  elementRegistry,
  modeling,
  bpmnFactory,
  eventBus
) {
  this.getGroups = function (element) {
    return function (groups) {
      if (is(element, 'bpmn:DataObjectReference')) {

        eventBus.on('element.dblclick', 1000, function (event) {
          console.log('element.dblclick', event);
          // const element = event.element;
          // modeling.updateLabel(element, 'newLabel');
          // // eventBus.fire('directEditing.activate', element);
          // eventBus.fire('directEditing.activate', {
          //   element: element
          // });
        });

        eventBus.on('directEditing.activate', async function (event) {
          console.log('directEditing.activate', event);
          const { element, provider, context } = event.active;
          // console.log('element', element);
          // console.log('provider', provider);
          // console.log('context', context);
          // console.log('modeling', modeling);

          await modeling.updateLabel(element, 'newLabel');
          // provider.update(element, 'newLabel', context);
          provider.activate(element);
        });

        eventBus.on('directEditing.complete', function (event) {
          console.log('directEditing.complete', event);
        });

        // eventBus.on('directEditing.activate', function (event) {
        //   // Direct editing started
        //   console.log('directEditing.activate', event);
        //   event.active.context.text = 'elele'
        //   const element = event.active.element;
        //   // event.active.element.label = "jeje";
        //   // event.active.element.set('label', 'jke');
        //   event.active.element.name = "jeje";
        //   element.businessObject.name = "jeje";
        //   element.businessObject.dataObjectRef.name = "jeje";
        //   const originalLabel = element.businessObject.name;
        //   const labelWithoutState = originalLabel.split(' [')[0];
        //   // modeling.updateProperties(element, { name: labelWithoutState });
        //   // storeOriginalLabel(element, originalLabel);
        // });



        // Remove Name Input from default group entries
        const generalGroup = groups.find(group => group.id === 'general');
        if (generalGroup) {
          generalGroup.entries = generalGroup.entries.filter(entry => entry.id !== 'name');
        }

        groups.push(
          createDataObjectSelector(element, translate, moddle, commandStack, modeling, bpmnFactory)
        );
      }
      if (
        isAny(element, ['bpmn:Process', 'bpmn:Participant']) ||
        (is(element, 'bpmn:SubProcess') && !element.collapsed)
      ) {
        groups.push(
          createDataObjectEditor(
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

DataObjectPropertiesProvider.$inject = [
  'propertiesPanel',
  'translate',
  'moddle',
  'commandStack',
  'elementRegistry',
  'modeling',
  'bpmnFactory',
  'eventBus'
];

/**
 * Create a group on the main panel with a select box (for choosing the Data Object to connect)
 * @param element
 * @param translate
 * @param moddle
 * @returns entries
 */
function createDataObjectSelector(element, translate, moddle, commandStack, modeling, bpmnFactory) {
  return {
    id: 'data_object_properties',
    label: translate('Data Object Properties'),
    entries: [
      {
        id: 'selectDataObject',
        element,
        component: DataObjectSelect,
        isEdited: isTextFieldEntryEdited,
        moddle,
        commandStack,
      },
      {
        id: 'selectDataState',
        element,
        component: createDataStateTextField,
        moddle,
        commandStack,
        modeling,
        bpmnFactory
      }
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
function createDataObjectEditor(
  element,
  translate,
  moddle,
  commandStack,
  elementRegistry
) {
  const dataObjectArray = {
    id: 'editDataObjects',
    element,
    label: 'Data Objects',
    component: ListGroup,
    ...DataObjectArray({ element, moddle, commandStack, elementRegistry }),
  };

  if (dataObjectArray.items) {
    return dataObjectArray;
  }
}

function createDataStateTextField(props) {
  const { id, element, commandStack, modeling, bpmnFactory } = props;

  const debounce = useService('debounceInput');

  const setValue = (value) => {
    const businessObject = element.businessObject;

    // Check if the element is a DataObjectReference
    if (!is(businessObject, 'bpmn:DataObjectReference')) {
      console.error('The element is not a DataObjectReference.');
      return;
    }

    // Create a new DataState or update the existing one
    let dataState = businessObject.dataState;
    if (!dataState) {
      dataState = bpmnFactory.create('bpmn:DataState', {
        id: 'DataState_' + businessObject.id,
        name: value
      });
    } else {
      dataState.name = value;
    }

    // Update the DataObjectReference with new or updated DataState
    modeling.updateProperties(element, {
      dataState: dataState
    });

    // Extract the original name
    const originalName = businessObject.name.split(' [')[0];

    // Update the label of the DataObjectReference
    const newName = (value) ? originalName + ' [' + value + ']' : originalName;

    modeling.updateProperties(element, {
      name: newName
    });
  };

  const getValue = () => {
    const businessObject = element.businessObject;
    return businessObject.dataState ? businessObject.dataState.name : '';
  };

  return TextFieldEntry({
    element,
    id: `${id}-textField`,
    name: 'spiffworkflow:DataStateLabel',
    label: 'Which Data State does this reference?',
    description: 'Select the Data State this represents.',
    getValue,
    setValue,
    debounce,
  });
}