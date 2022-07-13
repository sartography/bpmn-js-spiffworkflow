
export function findDataObjects(process) {

  let dataObjects = [];
  if (! process.flowElements) {
    return dataObjects;
  }
  for (const element of process.flowElements) {
    if (element.$type === 'bpmn:DataObject') {
      dataObjects.push(element);
    }
  }
  return dataObjects;
}

export function findDataObject(process, id) {
  for (const dataObj of findDataObjects(process)) {
    if (dataObj.id === id) {
      return dataObj;
    }
  }
}

export function findDataReferences(process, id) {
  let refs = [];
  for (const element of process.children) {
    if (element.type === 'bpmn:DataObjectReference') {
      refs.push(element);
    }
  }
  return refs;
}
