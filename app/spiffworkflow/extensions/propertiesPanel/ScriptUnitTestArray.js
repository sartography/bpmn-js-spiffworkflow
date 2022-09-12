import { useService } from 'bpmn-js-properties-panel';
import { TextAreaEntry } from '@bpmn-io/properties-panel';
// import { findCorrelationKeys, getRoot } from '../MessageHelpers';
// import { removeFirstInstanceOfItemFromArrayInPlace } from '../../helpers';

const getScriptUnitTestModdleElements = (shapeElement) => {
  const bizObj = shapeElement.businessObject;
  if (!bizObj.extensionElements) {
    return null;
  }
  if (!bizObj.extensionElements.values) {
    return [];
  }
  const unitTestsModdleElement = bizObj.extensionElements
    .get('values')
    .filter(function getInstanceOfType(e) {
      return e.$instanceOf('spiffworkflow:unitTests');
    })[0];
  return unitTestsModdleElement.unitTests;
};

/**
 * Provides a list of data objects, and allows you to add / remove data objects, and change their ids.
 * @param props
 * @constructor
 */
export function ScriptUnitTestArray(props) {
  const { element, moddle, commandStack } = props;

  const scriptUnitTestModdleElements = getScriptUnitTestModdleElements(element);
  console.log('scriptUnitTestModdleElements', scriptUnitTestModdleElements);
  const items = scriptUnitTestModdleElements.map(
    (scriptUnitTestModdleElement, index) => {
      const id = `scriptUnitTest-${index}`;
      return {
        id,
        label: scriptUnitTestModdleElement.id,
        entries: scriptUnitTestGroup({
          idPrefix: id,
          element,
          scriptUnitTestModdleElement,
          commandStack,
        }),
        // remove: removeFactory({
        //   element,
        //   correlationKeyElement,
        //   commandStack,
        //   moddle,
        // }),
        autoFocusEntry: id,
      };
    }
  );

  // function add(event) {
  //   event.stopPropagation();
  //   if (element.type === 'bpmn:Collaboration') {
  //     const newCorrelationKeyElement = moddle.create('bpmn:CorrelationKey');
  //     newCorrelationKeyElement.name =
  //       moddle.ids.nextPrefixed('CorrelationKey_');
  //     const currentCorrelationKeyElements =
  //       element.businessObject.get('correlationKeys');
  //     currentCorrelationKeyElements.push(newCorrelationKeyElement);
  //     commandStack.execute('element.updateProperties', {
  //       element,
  //       properties: {},
  //     });
  //   }
  // }

  console.log('items', items);
  // return { items, add };
  return { items };
}

// function removeFactory(props) {
//   const { element, correlationKeyElement, moddle, commandStack } = props;
//
//   return function (event) {
//     event.stopPropagation();
//     const currentCorrelationKeyElements =
//       element.businessObject.get('correlationKeys');
//     removeFirstInstanceOfItemFromArrayInPlace(
//       currentCorrelationKeyElements,
//       correlationKeyElement
//     );
//     commandStack.execute('element.updateProperties', {
//       element,
//       properties: {
//         correlationKey: currentCorrelationKeyElements,
//       },
//     });
//   };
// }
//
// <bpmn:correlationKey name="lover"> <--- The correlationGroup
//   <bpmn:correlationPropertyRef>lover_name</bpmn:correlationPropertyRef>
//   <bpmn:correlationPropertyRef>lover_instrument</bpmn:correlationPropertyRef>
// </bpmn:correlationKey>
// <bpmn:correlationKey name="singer" />
function scriptUnitTestGroup(props) {
  const { idPrefix, element, scriptUnitTestModdleElement, commandStack } =
    props;
  // const entries = [
  //   {
  //     id: `${idPrefix}-key`,
  //     component: CorrelationKeyTextField,
  //     scriptUnitTestModdleElement,
  //     commandStack,
  //   },
  // ];
  // (scriptUnitTestModdleElement.correlationPropertyRef || []).forEach(
  //   (correlationProperty, index) => {
  //     entries.push({
  //       id: `${idPrefix}-${index}-text`,
  //       component: CorrelationPropertyText,
  //       correlationProperty,
  //     });
  //   }
  // );
  // return entries;
  return [
    {
      id: `${idPrefix}-input`,
      element,
      component: ScriptUnitTestJsonTextArea,
      scriptUnitTestJsonModdleElement: scriptUnitTestModdleElement.inputJson,
      commandStack,
    },
  ];
}

function ScriptUnitTestJsonTextArea(props) {
  const { id, element, scriptUnitTestJsonModdleElement, commandStack } = props;

  const debounce = useService('debounceInput');
  const setValue = (value) => {
    commandStack.execute('element.updateModdleProperties', {
      element,
      moddleElement: scriptUnitTestJsonModdleElement,
      properties: {
        name: value,
      },
    });
  };

  const getValue = () => {
    console.log(
      'scriptUnitTestJsonModdleElement',
      scriptUnitTestJsonModdleElement
    );
    return scriptUnitTestJsonModdleElement.value;
  };

  return TextAreaEntry({
    element,
    id: `${id}-textArea`,
    getValue,
    setValue,
    debounce,
  });
}

// function CorrelationPropertyText(props) {
//   const { id, parameter, correlationProperty } = props;
//   const debounce = useService('debounceInput');
//
//   const getValue = () => {
//     return correlationProperty.id;
//   };
//
//   return SimpleEntry({
//     element: parameter,
//     id: `${id}-textField`,
//     label: correlationProperty.id,
//     getValue,
//     disabled: true,
//     debounce,
//   });
// }
