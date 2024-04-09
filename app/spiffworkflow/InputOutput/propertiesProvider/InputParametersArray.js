import { useService } from 'bpmn-js-properties-panel';
import {
  isTextFieldEntryEdited,
  TextFieldEntry,
} from '@bpmn-io/properties-panel';

export function InputParametersArray(props) {

  const { element, moddle, translate, commandStack } = props;

  const items = [
    {
      id: 'sssdd',
      label: 'sss',
      entries: InputParamGroup({
        idPrefix: 'sssdd',
        element,
        commandStack,
        moddle,
      }),
      autoFocusEntry: `sss-dataObject`,
      remove: removeFactory({
        element, moddle, commandStack
      }),
    }
  ];

  console.log('items', items);

  function add(event) {
    console.log('add', event);
    event.stopPropagation();
  }

  return { items, add };
}

function removeFactory(props) {
  const { element, moddle, commandStack } = props;
  return function (event) {
    console.log('removeFactory', props);
    event.stopPropagation();
  };
}

function InputParamGroup(props) {

  console.log('InputParamGroup', props);

  const { idPrefix, dataObject, element, moddle, commandStack } = props;

  return [
    {
      id: `dddd-dataObject`,
      component: InputParamTextField
    }
  ];
}


function InputParamTextField(props) {

  console.log('InputParamTextField', props);

  const { element } = props;

  const debounce = useService('debounceInput');

  const setValue = (value) => {
    try {
      console.log('Set Value : ', value);
    } catch (error) {
      console.log('Set Value Error : ', error);
    }
  };

  const getValue = () => {
    return 'VALUE';
  };

  return TextFieldEntry({
    element,
    id: `Prop-id`,
    label: 'sss',
    getValue,
    setValue,
    debounce,
  });
}
