/* eslint-disable prettier/prettier */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable import/order */

import { useService } from "bpmn-js-properties-panel";
import { getLoopProperty, setLoopProperty } from "../helpers";
import { TextFieldEntry } from '@bpmn-io/properties-panel';

export function InputItem(props) {
    const { element } = props;
    const debounce = useService('debounceInput');
    const translate = useService('translate');
    const commandStack = useService('commandStack');
    const bpmnFactory = useService('bpmnFactory');

    const getValue = () => {
        return getLoopProperty(element, 'inputDataItem');
    };

    const setValue = (value) => {
        const item =
            typeof value !== 'undefined' && value !== ''
                ? bpmnFactory.create('bpmn:DataInput', { id: value, name: value })
                : undefined;
        setLoopProperty(element, 'inputDataItem', item, commandStack);

        try {
            const { businessObject } = element;
            if (businessObject.get('spiffworkflow:isOutputSynced')) {
                setLoopProperty(element, 'outputDataItem', item, commandStack);
            }
        } catch (error) {
            console.log('Error caught while set value Input item', error);
        }
    };

    return TextFieldEntry({
        element,
        id: 'inputDataItem',
        label: translate('Input Element'),
        getValue,
        setValue,
        debounce,
        description: 'Each item in the collection will be copied to this variable',
    });
}