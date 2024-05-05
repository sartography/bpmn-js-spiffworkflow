/* eslint-disable prettier/prettier */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable import/order */

import { useService } from "bpmn-js-properties-panel";
import { getLoopProperty, setLoopProperty } from "../helpers";
import { TextFieldEntry } from '@bpmn-io/properties-panel';

export function InputCollection(props) {
    const { element } = props;
    const debounce = useService('debounceInput');
    const translate = useService('translate');
    const commandStack = useService('commandStack');
    const bpmnFactory = useService('bpmnFactory');

    const getValue = () => {
        return getLoopProperty(element, 'loopDataInputRef');
    };

    const setValue = (value) => {
        const collection = bpmnFactory.create('bpmn:ItemAwareElement', {
            id: value,
        });
        setLoopProperty(element, 'loopDataInputRef', collection, commandStack);
    };

    return TextFieldEntry({
        element,
        id: 'loopDataInputRef',
        label: translate('Input Collection'),
        getValue,
        setValue,
        debounce,
        description: 'Create an instance for each item in this collection',
    });
}