/* eslint-disable prettier/prettier */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable import/order */

import { useService } from "bpmn-js-properties-panel";
import { getLoopProperty, removeLoopProperty, setIsIOValue, setLoopProperty } from "../helpers";
import { CheckboxEntry } from '@bpmn-io/properties-panel';

export function IsOutputElSync(props) {
    const { element } = props;
    const translate = useService('translate');
    const commandStack = useService('commandStack');
    const bpmnFactory = useService('bpmnFactory');

    const getValue = () => {
        const { businessObject } = element;
        return businessObject.get('spiffworkflow:isOutputSynced')
            ? businessObject.get('spiffworkflow:isOutputSynced')
            : false;
    };

    const setValue = (value) => {
        if (value) {
            const valIn = getLoopProperty(element, 'inputDataItem');
            const item =
                typeof valIn !== 'undefined' && valIn !== ''
                    ? bpmnFactory.create('bpmn:DataOutput', { id: valIn, name: valIn })
                    : undefined;
            if(item){
                // If DataInput Item is found and set, add new DataOut with same value
                setLoopProperty(element, 'outputDataItem', item, commandStack);
            }
        } else {
            // Remove DataOutput value when isIoSync is disabled
            removeLoopProperty(element, 'outputDataItem', commandStack);
        }

        setIsIOValue(element, value, commandStack);
    };

    return CheckboxEntry({
        element,
        id: 'testBefore',
        label: translate('Output Element is Synchronized with Input Element'),
        getValue,
        setValue,
    });
}
