/* eslint-disable prettier/prettier */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable import/order */

import { useService } from "bpmn-js-properties-panel";
import { getLoopProperty, removeLoopProperty, setLoopProperty } from "../helpers";
import { SelectEntry } from '@bpmn-io/properties-panel';
import { findDataObjects } from '../../DataObject/DataObjectHelpers';

export function OutputCollection(props) {
    const { element } = props;
    const debounce = useService('debounceInput');
    const translate = useService('translate');
    const commandStack = useService('commandStack');
    const bpmnFactory = useService('bpmnFactory');

    const getValue = () => {
        return getLoopProperty(element, 'loopDataOutputRef');
    };

    const setValue = (value) => {
        if (!value || value === '') {
            // If value is empty or undefined, remove loopDataOutputRef from XML
            removeLoopProperty(element, 'loopDataOutputRef', commandStack);
            return;
        }
        const collection = bpmnFactory.create('bpmn:ItemAwareElement', {
            id: value,
        });
        setLoopProperty(element, 'loopDataOutputRef', collection, commandStack);
    };

    const getOptions = () => {
        const businessObject = element.businessObject;
        const parent = businessObject.$parent;
        const dataObjects = findDataObjects(parent);
        
        const options = [
            { label: '', value: '' }  // Empty option to allow clearing
        ];
        
        dataObjects.forEach((dataObj) => {
            options.push({ 
                label: dataObj.name || dataObj.id, 
                value: dataObj.id 
            });
        });
        
        return options;
    };

    return SelectEntry({
        element,
        id: 'loopDataOutputRef',
        label: translate('Output Collection'),
        getValue,
        setValue,
        getOptions,
        debounce,
        description: 'Create or update this collection with the instance results',
    });
}