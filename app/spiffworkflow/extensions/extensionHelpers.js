const SPIFF_PARENT_PROP = 'spiffworkflow:properties';
const SPIFF_PROP = 'spiffworkflow:property';

export function getExtensionProperties(element) {
  const bizObj = element.businessObject;
  if (!bizObj.extensionElements) {
    return null;
  }
  const extensionElements = bizObj.extensionElements.get('values');
  return extensionElements.filter(function (extensionElement) {
    if (extensionElement.$instanceOf(SPIFF_PARENT_PROP)) {
      return extensionElement;
    }
    return null;
  })[0];
}

export function getExtensionProperty(element, name) {
  const parentElement = getExtensionProperties(element);
  if (parentElement) {
    return parentElement.get('properties').filter(function (propertyElement) {
      return (
        propertyElement.$instanceOf(SPIFF_PROP) && propertyElement.name === name
      );
    })[0];
  }
  return null;
}

/**
 * Returns the string value of the extension properties value attribute, or ""
 * @param element
 * @param name
 */
export function getExtensionValue(element, name) {
  const property = getExtensionProperty(element, name);
  if (property) {
    return property.value;
  }
  return '';
}

export function setExtensionProperty(element, name, value, moddle, commandStack) {
  let properties = getExtensionProperties(element);
  let property = getExtensionProperty(element, name);
  const { businessObject } = element;
  let extensions = businessObject.extensionElements;

  if (!extensions) {
    extensions = moddle.create('bpmn:ExtensionElements');
  }
  if (!properties) {
    properties = moddle.create(SPIFF_PARENT_PROP);
    extensions.get('values').push(properties);
  }
  if (!property) {
    property = moddle.create(SPIFF_PROP);
    properties.get('properties').push(property);
  }
  property.value = value;
  property.name = name;

  commandStack.execute('element.updateModdleProperties', {
    element,
    moddleElement: businessObject,
    properties: {
      extensionElements: extensions,
    },
  });
}
