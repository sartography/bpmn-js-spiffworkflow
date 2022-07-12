import {useService } from 'bpmn-js-properties-panel';
import { TextFieldEntry } from '@bpmn-io/properties-panel';

const SPIFF_PROP = "spiffworkflow:property"

/**
 * A generic properties' editor for text input.
 * Allows you to provide additional SpiffWorkflow extension properties.  Just
 * uses whatever name is provide on the property, and adds or updates it as
 * needed.
 *
       <bpmn:extensionElements>
           <spiffworkflow:properties>
               <spiffworkflow:property name="formJsonSchemaFilename" value="json_schema.json" />
               <spiffworkflow:property name="formUiSchemaFilename" value="ui_schema.json" />
           </spiffworkflow:properties>
       </bpmn:extensionElements>
 *
 * @returns {string|null|*}
 */
export function SpiffExtensionTextInput(props) {
  const element = props.element;
  const commandStack = props.commandStack, moddle = props.moddle;
  const name = props.name, label = props.label, description = props.description;
  const debounce = useService('debounceInput');

  const getPropertyObject = () => {
    const bizObj = element.businessObject;
    if (!bizObj.extensionElements) {
      return null;
    } else {
      return bizObj.extensionElements.values.filter(function (e) {
        return e.$instanceOf(SPIFF_PROP) && e.name === name;
      })[0];
    }
  }

  const getValue = () => {
    const property = getPropertyObject()
    if (property) {
      return property.value;
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
    property.value = value;
    property.name = name;

    commandStack.execute('element.updateModdleProperties', {
      element,
      moddleElement: businessObject,
      properties: {
        "extensionElements": extensions
      }
    });
  };

  return <TextFieldEntry
    id={'extension_' + name}
    element={element}
    description={description}
    label={label}
    getValue={getValue}
    setValue={setValue}
    debounce={debounce}
  />;

}
