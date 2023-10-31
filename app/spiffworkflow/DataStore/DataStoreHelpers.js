/**
 * Returns the moddelElement if it is a process, otherwise, returns the
 *
 * @param container
 */

export function findDataStores(parent, dataStores) {
  if (typeof(dataStores) === 'undefined')
    dataStores = [];
  let process;
  if (!parent) {
    return [];
  }
  if (parent.processRef) {
    process = parent.processRef;
  } else {
    process = parent;
    if (process.$type === 'bpmn:SubProcess')
      findDataStores(process.$parent, dataStores);
  }
  if (typeof(process.flowElements) !== 'undefined') {
    for (const element of process.flowElements) {
      if (element.$type === 'bpmn:DataStore')
        dataStores.push(element);
    }
  }
  return dataStores;
}

export function findDataStore(process, id) {
  for (const dataObj of findDataStores(process)) {
    if (dataObj.id === id) {
      return dataObj;
    }
  }
}

export function findDataStoreReferences(children, dataStoreId) {
  if (children == null) {
    return [];
  }
  return children.flatMap((child) => {
    if (child.$type == 'bpmn:DataStoreReference' && child.dataStoreRef.id == dataStoreId)
      return [child];
    else if (child.$type == 'bpmn:SubProcess')
      return findDataStoreReferences(child.get('flowElements'), dataStoreId);
    else
      return [];
  });
}

export function findDataStoreReferenceShapes(children, dataStoreId) {
  return children.flatMap((child) => {
    if (child.type == 'bpmn:DataStoreReference' && child.businessObject.dataStoreRef.id == dataStoreId)
      return [child];
    else if (child.type == 'bpmn:SubProcess')
      return findDataStoreReferenceShapes(child.children, dataStoreId);
    else
      return [];
  });
}

export function idToHumanReadableName(id) {
  const words = id.match(/[A-Za-z][a-z]*|[0-9]+/g) || [id];
  return words.map(capitalize).join(' ');

  function capitalize(word) {
    return word.charAt(0).toUpperCase() + word.substring(1);
  }
}
