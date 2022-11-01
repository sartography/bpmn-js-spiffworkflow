import { useService } from 'bpmn-js-properties-panel';
import { SelectEntry } from '@bpmn-io/properties-panel';

const SPIFF_PROP = 'spiffworkflow:calledDecisionId';
let DMN_OPTIONS = [];

/**
 * Allow selecting a DMN Table from a list of known tables provided through the Event bux.

 <bpmn:businessRuleTask id="Activity_0t218za">
   <bpmn:extensionElements>
     <spiffworkflow:calledDecisionId>my_id</spiffworkflow:calledDecisionId>
   </bpmn:extensionElements>
 </bpmn:businessRuleTask>

 */
export function SiffExtensionCalledDecision(props) {
  const { element } = props;
  const { commandStack } = props;
  const { moddle } = props;
  const { label, description } = props;

  const { name } = props;
  const { optionType } = props;

  const debounce = useService('debounceInput');
  const eventBus = useService('eventBus');

  const getPropertyObject = () => {
    const bizObj = element.businessObject;
    if (!bizObj.extensionElements) {
      return null;
    }
    return bizObj.extensionElements.get('values').filter(function (e) {
      return e.$instanceOf(SPIFF_PROP);
    })[0];
  };

  const getValue = () => {
    const property = getPropertyObject();
    if (property) {
      return property.calledDecisionId;
    }
    return '';
  };

  const setValue = (value) => {
    let property = getPropertyObject();
    const { businessObject } = element;
    let extensions = businessObject.extensionElements;

    if (!property) {
      property = moddle.create(SPIFF_PROP);
      if (!extensions) {
        extensions = moddle.create('bpmn:ExtensionElements');
      }
      extensions.get('values').push(property);
    }
    property.calledDecisionId = value;

    commandStack.execute('element.updateModdleProperties', {
      element,
      moddleElement: businessObject,
      properties: {
        extensionElements: extensions,
      },
    });
  };

  if (DMN_OPTIONS.length === 0) {
    requestDmnOptions(eventBus, element, commandStack, optionType);
  }
  const getOptions = () => {
    const optionList = [];
    DMN_OPTIONS.forEach((opt) => {
      optionList.push({
        label: opt.label,
        value: opt.value,
      });
    });
    return optionList;
  };

  return SelectEntry({
    id: `extension_${name}`,
    element,
    label,
    description,
    getValue,
    setValue,
    getOptions,
    debounce,
  });
}

function requestDmnOptions(eventBus, element, commandStack, optionType) {
  // Little backwards, but you want to assure you are ready to catch, before you throw
  // or you risk a race condition.
  eventBus.once(`spiff.options.returned.dmn`, (event) => {
    DMN_OPTIONS = event.options;
    commandStack.execute('element.updateProperties', {
      element,
      properties: {},
    });
  });
  eventBus.fire('spiff.options.requested', { eventBus, optionType });
}
