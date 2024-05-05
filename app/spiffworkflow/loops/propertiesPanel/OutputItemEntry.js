/* eslint-disable prettier/prettier */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable import/order */
import { useService } from "bpmn-js-properties-panel";
import { getLoopProperty, setLoopProperty } from "../helpers";
import { TextFieldEntry } from '@bpmn-io/properties-panel';


export function OutputItem(props) {
    const { element } = props;
    const debounce = useService('debounceInput');
    const translate = useService('translate');
    const commandStack = useService('commandStack');
    const bpmnFactory = useService('bpmnFactory');
  
    const getValue = () => {
      return getLoopProperty(element, 'outputDataItem');
    };
  
    const setValue = (value) => {
      try {
        const inVal = getLoopProperty(element, 'inputDataItem');
        if (inVal === value) {
          alert( 'You have entered the same value for both Input and Output elements without enabling synchronization. Please confirm if this is intended.' );
          return;
        }
      } catch (error) {
        console.log('Error caught while Set Value OutputItem', error);
      }
  
      const item =
        typeof value !== 'undefined' && value !== ''
          ? bpmnFactory.create('bpmn:DataOutput', { id: value, name: value })
          : undefined;
      setLoopProperty(element, 'outputDataItem', item, commandStack);
    };
  
    return TextFieldEntry({
      element,
      id: 'outputDataItem',
      label: translate('Output Element'),
      getValue,
      setValue,
      debounce,
      description:
        'The value of this variable will be added to the output collection',
    });
  }