import { useService } from 'bpmn-js-properties-panel';
import { isTextFieldEntryEdited, TextFieldEntry } from '@bpmn-io/properties-panel';
import { useCallback } from '@bpmn-io/properties-panel/preact/hooks';
import { validateDataId } from '../../helpers';

const LOW_PRIORITY = 500;

export default function DataInputOutputPropertiesProvider(
  propertiesPanel,
  translate,
  moddle,
  commandStack,
  elementRegistry,
  bpmnFactory
) {
  this.getGroups = function getGroupsCallback(element) {
    return function pushGroup(groups) {
      if (['bpmn:DataInput', 'bpmn:DataOutput'].includes(element.type)) {
        const general = groups.find(group => group.id == 'general');
        general.entries = general.entries.filter(entry => entry.id != 'id');
        general.entries.unshift({
          component: DataTextField,
          isEdited: isTextFieldEntryEdited,
          inputOrOutput: element.businessObject,
        });
        console.log();
      }
      return groups;
    };
  };
  propertiesPanel.registerProvider(LOW_PRIORITY, this);
}

DataInputOutputPropertiesProvider.$inject = [
  'propertiesPanel',
  'translate',
  'moddle',
  'commandStack',
  'elementRegistry',
  'bpmnFactory',
];

function DataTextField(props) {
  const { element, inputOrOutput } = props;

  const commandStack = useService('commandStack');
  const debounce = useService('debounceInput');

  const setValue = (value, error) => {
    if (error)
      return;

    commandStack.execute('element.updateModdleProperties', {
      element,
      moddleElement: inputOrOutput,
      properties: {
        id: value,
      },
    });
  };

  const getValue = () => {
    return inputOrOutput.id;
  };

  const validate = useCallback(value => validateDataId(value), [element]);

  return TextFieldEntry({
    element: element,
    id: 'id',
    label: 'ID',
    getValue,
    setValue,
    debounce,
    validate
  });
}
