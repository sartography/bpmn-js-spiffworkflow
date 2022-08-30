import {useService } from 'bpmn-js-properties-panel';
import { TextFieldEntry } from '@bpmn-io/properties-panel';
import { SelectEntry } from '@bpmn-io/properties-panel';

const SPIFF_PROP = "spiffworkflow:calledDecisionId"
// let optionList = [{label: 'hello1', value: "hello1"}, {label: 'hello2', value: "hello3"}]
// let optionList = []
let serviceTaskOperators = []
const LOW_PRIORITY = 500;

/**
 * A generic properties' editor for text input.
 * Allows you to provide additional SpiffWorkflow extension properties.  Just
 * uses whatever name is provide on the property, and adds or updates it as
 * needed.
 *
 *
    <bpmn:businessRuleTask id="Activity_0t218za">
      <bpmn:extensionElements>
        <spiffworkflow:calledDecisionId>my_id</spiffworkflow:calledDecisionId>
      </bpmn:extensionElements>
    </bpmn:businessRuleTask>
 *
 * @returns {string|null|*}
 */

function testFiring(eventBus, element, commandStack) {
  eventBus.fire('spiff.service_tasks.requested', { eventBus });
  eventBus.on('spiff.service_tasks.returned', ( event ) => {
    serviceTaskOperators = event.serviceTaskOperators;
    commandStack.execute('element.updateProperties', {
      element,
      properties: {}
    });
  });
}
// export function SpiffExtensionServiceProperties(
//   propertiesPanel,
//   translate,
//   moddle,
//   commandStack,
//   _elementRegistry
// ) {
//   this.getGroups = function getGroupsCallback(element) {
//     return function pushGroup(groups) {
//       if (is(element, 'bpmn:ServiceTask')) {
//         groups.push(
//           createServicesGroup(element, translate, moddle, commandStack)
//         );
//       }
//       return groups;
//     };
//   };
//   propertiesPanel.registerProvider(LOW_PRIORITY, this);
// }
//
// SpiffExtensionServiceProperties.$inject = [
//   'propertiesPanel',
//   'translate',
//   'moddle',
//   'commandStack',
//   'elementRegistry',
// ];

// // export function SpiffExtensionServiceProperties(element, translate, moddle, commandStack) {
// export function SpiffExtensionServiceProperties(props) {
//   const {element, translate, moddle, commandStack } = props
//   return {
//     id: 'conditions',
//     label: translate('Conditions'),
//     entries: serviceGroupEntries(
//       element,
//       moddle,
//       'Condition Expression',
//       'Expression to Execute',
//       commandStack
//     ),
//   };
// }
//
// function serviceGroupEntries(element, moddle, label, description, commandStack) {
//   console.log("WE HERE1")
//   return [
//     {
//       id: 'service_task_operator_select',
//       element,
//       component: ConditionExpressionTextField,
//       moddle,
//       label,
//       description,
//       commandStack,
//     },
//   ];
// }
// function ConditionExpressionTextField(props) {
//   const { element } = props;
//   const { moddle } = props;
//   const { label } = props;
//
//   const debounce = useService('debounceInput');
//   const getValue = () => {
//     // const { conditionExpression } = element.businessObject;
//     // if (conditionExpression) {
//     //   return conditionExpression.body;
//     // }
//     return '';
//   };
//
//   const setValue = (value) => {
//     // let { conditionExpressionModdleElement } = element.businessObject;
//     // if (!conditionExpressionModdleElement) {
//     //   conditionExpressionModdleElement = moddle.create('bpmn:Expression');
//     // }
//     // conditionExpressionModdleElement.body = value;
//     // element.businessObject.conditionExpression =
//     //   conditionExpressionModdleElement;
//   };
//
//   return TextFieldEntry({
//     element,
//     id: `the-id`,
//     label,
//     getValue,
//     setValue,
//     debounce,
//   });
// }

export function ServiceTaskOperatorSelect(props) {
  console.log("WE HERE")
  const element = props.element;
  const commandStack = props.commandStack, moddle = props.moddle;
  const label = props.label, description = props.description;

  const debounce = useService('debounceInput');
  const eventBus = useService('eventBus');

  if (serviceTaskOperators.length === 0) {
    testFiring(eventBus, element, commandStack)
  }

  const getPropertyObject = () => {
    const bizObj = element.businessObject;
    if (!bizObj.extensionElements) {
      return null;
    } else {
      return bizObj.extensionElements.get("values").filter(function (e) {
        return e.$instanceOf(SPIFF_PROP)
      })[0];
    }
  }

  const getValue = () => {
    // const property = getPropertyObject()
    // if (property) {
    //   return property.decisionId;
    // }
    // debugger
    return ""
  }

  const setValue = value => {
    // let property = getPropertyObject()
    // let businessObject = element.businessObject;
    // let extensions = businessObject.extensionElements;
    //
    // if (!property) {
    //   property = moddle.create(SPIFF_PROP);
    //   if (!extensions) {
    //     extensions = moddle.create('bpmn:ExtensionElements');
    //   }
    //   extensions.get('values').push(property);
    // }
    // property.decisionId = value;
    //
    // commandStack.execute('element.updateModdleProperties', {
    //   element,
    //   moddleElement: businessObject,
    //   properties: {
    //     "extensionElements": extensions
    //   }
    // });
  };

  const getOptions = () => {
    const optionList = [];
    if (serviceTaskOperators) {
      serviceTaskOperators.forEach((sto) => {
        optionList.push({
          label: sto.name,
          value: sto.name,
        })
      })
    }
    return optionList
  }

  // return <TextFieldEntry
  //   id='extension_service_task_property'
  //   element={element}
  //   description='descrition'
  //   label='lable'
  //   getValue={getValue}
  //   setValue={setValue}
  //   debounce={debounce}
  // />;
  return SelectEntry({
      id: "selectOperatorId",
      element,
      description: "Select the operator id.",
      label: "Which one?",
      getValue,
      setValue,
      getOptions,
      debounce,
  });

}
