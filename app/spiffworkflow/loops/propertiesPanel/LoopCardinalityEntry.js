/* eslint-disable prettier/prettier */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable import/order */

import { useService } from "bpmn-js-properties-panel";
import { getLoopProperty, setLoopProperty } from "../helpers";
import { TextFieldEntry } from '@bpmn-io/properties-panel';

export function LoopCardinality(props) {
    const { element } = props;
    const debounce = useService('debounceInput');
    const translate = useService('translate');
    const commandStack = useService('commandStack');
    const bpmnFactory = useService('bpmnFactory');

    const getValue = () => {
        return getLoopProperty(element, 'loopCardinality');
    };

    const setValue = (value) => {
        const loopCardinality = bpmnFactory.create('bpmn:FormalExpression', {
            body: value,
        });
        setLoopProperty(element, 'loopCardinality', loopCardinality, commandStack);
    };

    return TextFieldEntry({
        element,
        id: 'loopCardinality',
        label: translate('Loop Cardinality'),
        getValue,
        setValue,
        debounce,
        description: 'Explicitly set the number of instances',
    });
}