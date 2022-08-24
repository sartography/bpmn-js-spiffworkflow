import { is } from 'bpmn-js/lib/util/ModelUtil';
import {
  isTextFieldEntryEdited,
  TextFieldEntry,
} from '@bpmn-io/properties-panel';
import { useService } from 'bpmn-js-properties-panel';

const LOW_PRIORITY = 500;

export default function ConditionsPropertiesProvider(
  propertiesPanel,
  translate,
  moddle,
  commandStack,
  _elementRegistry
) {
  this.getGroups = function getGroupsCallback(element) {
    return function pushGroup(groups) {
      if (is(element, 'bpmn:SequenceFlow')) {
        const { source } = element;
        if (is(source, 'bpmn:ExclusiveGateway')) {
          groups.push(
            createConditionsGroup(element, translate, moddle, commandStack)
          );
        }
      }
      return groups;
    };
  };
  propertiesPanel.registerProvider(LOW_PRIORITY, this);
}

ConditionsPropertiesProvider.$inject = [
  'propertiesPanel',
  'translate',
  'moddle',
  'commandStack',
  'elementRegistry',
];

function createConditionsGroup(element, translate, moddle, commandStack) {
  return {
    id: 'conditions',
    label: translate('Conditions'),
    entries: conditionGroup(
      element,
      moddle,
      'Condition Expression',
      'Expression to Execute',
      commandStack
    ),
  };
}

function conditionGroup(element, moddle, label, description, commandStack) {
  return [
    {
      id: `condition_expression`,
      element,
      component: ConditionExpressionTextField,
      moddle,
      label,
      description,
      commandStack,
    },
  ];
}

function ConditionExpressionTextField(props) {
  const { element } = props;
  const { moddle } = props;
  const { label } = props;
  console.log('props', props);
  debugger;

  const debounce = useService('debounceInput');
  const getValue = () => {
    const { conditionExpression } = element.businessObject;
    if (conditionExpression) {
      return conditionExpression.body;
    }
    return '';
  };

  const setValue = (value, event) => {
    const { conditionExpression } = element.businessObject;
    if (!conditionExpression) {
      const newDataObject = moddle.create('bpmn:DataObject');

      // FIXME: bpmn-io doesn't support this element and doesn't allow us
      // to add items to the bpmn prefix. We need to find a way around this.
      const conditionExpressionElement = moddle.create(
        'bpmn:conditionExpression'
      );
      element.businessObject.push(conditionExpressionElement);
    }
    // const { businessObject } = element;
    // let scriptObj = getScriptObject();
    // // Create the script object if needed.
    // if (!scriptObj) {
    //   scriptObj = moddle.create(type);
    //   if (type !== SCRIPT_TYPE.bpmn) {
    //     if (!businessObject.extensionElements) {
    //       businessObject.extensionElements = moddle.create(
    //         'bpmn:ExtensionElements'
    //       );
    //     }
    //     businessObject.extensionElements.get('values').push(scriptObj);
    //   }
    // }
    // scriptObj.script = value;
  };

  return TextFieldEntry({
    element,
    id: `the-id`,
    label,
    getValue,
    setValue,
    debounce,
  });
}
