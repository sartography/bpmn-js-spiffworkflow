import { is } from 'bpmn-js/lib/util/ModelUtil';
import { useService } from 'bpmn-js-properties-panel';
import {
  Group,
  TextFieldEntry,
  isTextFieldEntryEdited,
  CheckboxEntry,
  isCheckboxEntryEdited,
} from '@bpmn-io/properties-panel';

const LOW_PRIORITY = 500;

export default function AdHocSubProcessPropertiesProvider(propertiesPanel) {
  this.getGroups = function getGroups(element) {
    return function addGroup(groups)  {
      if (is(element, 'bpmn:AdHocSubProcess')) {
        groups.push({
          id: 'adHocSubProcessProperties',
          component: Group,
          label: 'SubProcess Completion',
          entries: AdHocSubProcessProps(element),
          shouldOpen: true,
        });
      }
      return groups;
    };
  };
  propertiesPanel.registerProvider(LOW_PRIORITY, this);
};

AdHocSubProcessPropertiesProvider.$inject = ['propertiesPanel'];

function AdHocSubProcessProps(props) {
  const { element } = props;
  return [
    {
      id: 'completionCondition',
      component: CompletionCondition,
      isEdited: isTextFieldEntryEdited,
    },
    {
      id: 'cancelRemaining',
      component: CancelRemaining,
      isEdited: isCheckboxEntryEdited,
    },
  ];
}

function CompletionCondition(props) {

  const { element } = props;
  const debounce = useService('debounceInput');
  const translate = useService('translate');
  const commandStack = useService('commandStack');
  const bpmnFactory = useService('bpmnFactory');

  const getValue = () => {
    const value = element.businessObject.get('completionCondition');
    return (typeof value !== 'undefined') ? value.body : '';
  };

  const setValue = (value) => {
    if (!value || value === '') {
      commandStack.execute('element.updateModdleProperties', {
        element,
        moddleElement: element.businessObject,
        properties: {
          completionCondition: null,
        },
      });
    } else {
      const condition = bpmnFactory.create('bpmn:Expression', {
        body: value,
      });
      commandStack.execute('element.updateModdleProperties', {
        element,
        moddleElement: element.businessObject,
        properties: {
          completionCondition: condition,
        },
      });
    }
  };

  return TextFieldEntry({
    element,
    id: 'completionCondition',
    label: translate('Completion Condition'),
    getValue,
    setValue,
    debounce,
    description: 'Stop executing when this condition is met.',
  });
}

function CancelRemaining(props) {

  const { element } = props;
  const translate = useService('translate');
  const commandStack = useService('commandStack');

  const getValue = () => {
    return element.businessObject.cancelRemainingInstances;
  };

  const setValue = (value) => {
    commandStack.execute('element.updateModdleProperties', {
      element,
      moddleElement: element.businessObject,
      properties: {
        cancelRemainingInstances: value,
      },
    });
  };

  return CheckboxEntry({
    element,
    id: 'cancelRemaining',
    label: translate('Cancel active tasks when complete'),
    getValue,
    setValue,
  });
}
