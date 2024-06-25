/* eslint-disable prettier/prettier */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable import/order */

import { useService } from "bpmn-js-properties-panel";
import { getLoopProperty, removeLoopProperty, setLoopProperty } from "../helpers";
import { TextFieldEntry } from '@bpmn-io/properties-panel';

export function CompletionCondition(props) {
    const { element } = props;
    const debounce = useService('debounceInput');
    const translate = useService('translate');
    const commandStack = useService('commandStack');
    const bpmnFactory = useService('bpmnFactory');
  
    const getValue = () => {
      return getLoopProperty(element, 'completionCondition');
    };
  
    const setValue = (value) => {
      if (!value || value === '') {
        // If value is empty, remove completionCondition from XML
        removeLoopProperty(element, 'completionCondition', commandStack);
        return;
      }
      const completionCondition = bpmnFactory.create('bpmn:FormalExpression', {
        body: value,
      });
      setLoopProperty(
        element,
        'completionCondition',
        completionCondition,
        commandStack
      );
    };
  
    return TextFieldEntry({
      element,
      id: 'completionCondition',
      label: translate('Completion Condition'),
      getValue,
      setValue,
      debounce,
      description: 'Stop executing this task when this condition is met',
    });
  }