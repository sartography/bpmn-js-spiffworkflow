
export function createSpecification(bpmnFactory, businessObject, type, newElement) {
    let ioSpecification = businessObject.ioSpecification;
    if (!ioSpecification) {
        ioSpecification = bpmnFactory.create('bpmn:InputOutputSpecification', {
            dataInputs: [],
            dataOutputs: [],
            inputSets: [],
            outputSets: [],
        });

        businessObject.ioSpecification = ioSpecification;
    }

    if (type === 'input') {
        ioSpecification.dataInputs.push(newElement);
        if (!ioSpecification.inputSets.length) {
            ioSpecification.inputSets.push(bpmnFactory.create('bpmn:InputSet', { dataInputRefs: [newElement] }));
        } else {
            ioSpecification.inputSets[0].dataInputRefs.push(newElement);
        }
    } else if (type === 'output') {
        ioSpecification.dataOutputs.push(newElement);
        if (!ioSpecification.outputSets.length) {
            ioSpecification.outputSets.push(bpmnFactory.create('bpmn:OutputSet', { dataOutputRefs: [newElement] }));
        } else {
            ioSpecification.outputSets[0].dataOutputRefs.push(newElement);
        }
    }

    return ioSpecification;
}

export function removeElementFromSpecification(element, entry, type) {
    const ioSpecification = element.businessObject.ioSpecification;
    if (!ioSpecification) {
        console.error('No ioSpecification found for this element.');
        return;
    }

    const collection = type === 'input' ? ioSpecification.dataInputs : ioSpecification.dataOutputs;
    const setCollection = type === 'input' ? ioSpecification.inputSets : ioSpecification.outputSets;
    const index = collection.findIndex(item => item.id === entry.id);

    if (index > -1) {
        const [removedElement] = collection.splice(index, 1);
        setCollection.forEach(set => {
            const refIndex = set[type === 'input' ? 'dataInputRefs' : 'dataOutputRefs'].indexOf(removedElement);
            if (refIndex > -1) {
                set[type === 'input' ? 'dataInputRefs' : 'dataOutputRefs'].splice(refIndex, 1);
            }
        });
    } else {
        console.error(`No ${type === 'input' ? 'DataInput' : 'DataOutput'} found for id ${entry.id}`);
    }
}

export function updateElementProperties(commandStack, element) {
    commandStack.execute('element.updateProperties', {
        element: element,
        moddleElement: element.businessObject,
        properties: {}
    });
}
