/* eslint-disable prettier/prettier */
/* eslint-disable no-param-reassign */

export function getLoopProperty(element, propertyName) {
  const { loopCharacteristics } = element.businessObject;
  const prop = loopCharacteristics.get(propertyName);
  let value = '';
  if (typeof (prop) !== 'object') {
    value = prop;
  } else if (typeof (prop) !== 'undefined') {
    if (prop.$type === 'bpmn:FormalExpression')
      value = prop.get('body');
    else
      value = prop.get('id');
  }
  return value;
}

export function setLoopProperty(element, propertyName, value, commandStack) {
  const { loopCharacteristics } = element.businessObject;

  if (typeof (value) === 'object') {
    value.$parent = loopCharacteristics;
  }

  const properties = { [propertyName]: value };
  if (propertyName === 'loopCardinality') properties.loopDataInputRef = undefined;
  if (propertyName === 'loopDataInputRef') properties.loopCardinality = undefined;

  commandStack.execute('element.updateModdleProperties', {
    element,
    moddleElement: loopCharacteristics,
    properties,
  });
}

export function removeLoopProperty(element, propertyName, commandStack) {
  const { loopCharacteristics } = element.businessObject;
  const properties = { [propertyName]: undefined };
  commandStack.execute('element.updateModdleProperties', {
    element,
    moddleElement: loopCharacteristics,
    properties,
  });
}

export function setIsIOValue(element, value, commandStack) {
  commandStack.execute('element.updateProperties', {
    element,
    properties: {
      'spiffworkflow:isOutputSynced': value,
    },
  });
}
