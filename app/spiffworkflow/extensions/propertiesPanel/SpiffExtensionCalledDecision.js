import {useService } from 'bpmn-js-properties-panel';
import { TextFieldEntry } from '@bpmn-io/properties-panel';

const SPIFF_PROP = "spiffworkflow:calledDecision"

/**
 * A generic properties' editor for text input.
 * Allows you to provide additional SpiffWorkflow extension properties.  Just
 * uses whatever name is provide on the property, and adds or updates it as
 * needed.
 *
 *
    <bpmn:businessRuleTask id="Activity_0t218za">
      <bpmn:extensionElements>
        <spiffworkflow:calledDecision>my_id</spiffworkflow:calledDecision>
      </bpmn:extensionElements>
    </bpmn:businessRuleTask>
 *
 * @returns {string|null|*}
 */
export function SpiffExtensionCalledDecision(props) {
  const element = props.element;
  const commandStack = props.commandStack, moddle = props.moddle;
  const label = props.label, description = props.description;
  const debounce = useService('debounceInput');

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
    const property = getPropertyObject()
    if (property) {
      return property.decisionId;
    }
    return ""
  }

  const setValue = value => {
    let property = getPropertyObject()
    let businessObject = element.businessObject;
    let extensions = businessObject.extensionElements;

    if (!property) {
      property = moddle.create(SPIFF_PROP);
      if (!extensions) {
        extensions = moddle.create('bpmn:ExtensionElements');
      }
      extensions.get('values').push(property);
    }
    property.decisionId = value;

    commandStack.execute('element.updateModdleProperties', {
      element,
      moddleElement: businessObject,
      properties: {
        "extensionElements": extensions
      }
    });
  };

  return <TextFieldEntry
    id='extension_called_decision'
    element={element}
    description={description}
    label={label}
    getValue={getValue}
    setValue={setValue}
    debounce={debounce}
  />;

}
