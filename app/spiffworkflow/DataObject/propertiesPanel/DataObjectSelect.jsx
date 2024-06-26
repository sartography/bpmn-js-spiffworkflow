import React from 'react';
import { useService } from 'bpmn-js-properties-panel';
import { SelectEntry } from '@bpmn-io/properties-panel';
import { findDataObjects } from '../DataObjectHelpers';

/**
 * Finds the value of the given type within the extensionElements
 * given a type of "spiff:preScript", would find it in this, and return
 * the object.
 *
 *  <bpmn:
 <bpmn:userTask id="123" name="My User Task!">
 <bpmn:extensionElements>
 <spiffworkflow:preScript>
 me = "100% awesome"
 </spiffworkflow:preScript>
 </bpmn:extensionElements>
 ...
 </bpmn:userTask>
 *
 * @returns {string|null|*}
 */
export function DataObjectSelect(props) {
  const element = props.element;
  const commandStack = props.commandStack;
  const debounce = useService('debounceInput');

  const getValue = () => {
    return element.businessObject.dataObjectRef.id;
  };

  const setValue = (value) => {
    const businessObject = element.businessObject;
    const dataObjects = findDataObjects(businessObject.$parent);
    for (const dataObject of dataObjects) {
      if (dataObject.$type === 'bpmn:DataObject' && dataObject.id === value) {
        commandStack.execute('element.updateModdleProperties', {
          element: element,
          moddleElement: businessObject,
          properties: {
            dataObjectRef: dataObject,
          },
        });

        // Construct the new name by : the dataObject name and the current state
        const stateName =
          businessObject.dataState && businessObject.dataState.name
            ? businessObject.dataState.name
            : '';
        const newName = stateName
          ? `${dataObject.name} [${stateName}]`
          : dataObject.name;
        // Update the name property of the DataObjectReference
        commandStack.execute('element.updateProperties', {
          element: element,
          properties: {
            name: newName,
          },
        });
      }
    }
  };

  const getOptions = (value) => {
    const businessObject = element.businessObject;
    const parent = businessObject.$parent;
    let dataObjects = findDataObjects(parent);
    let options = [];
    dataObjects.forEach((dataObj) => {
      options.push({ label: dataObj.id, value: dataObj.id });
    });
    return options;
  };

  return (
    <SelectEntry
      id={'selectDataObject'}
      element={element}
      description={'Select the Data Object this represents.'}
      label={'Which Data Object does this reference?'}
      getValue={getValue}
      setValue={setValue}
      getOptions={getOptions}
      debounce={debounce}
    />
  );
}
