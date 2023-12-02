import { is, isAny } from 'bpmn-js/lib/util/ModelUtil';
import { ListGroup, isTextFieldEntryEdited, TextFieldEntry } from '@bpmn-io/properties-panel';
import { useService } from 'bpmn-js-properties-panel';

const LOW_PRIORITY = 500;

export default function DataObjectLabelEditingProvider(eventBus, canvas, directEditing, commandStack, modeling) {

    console.log('DataObjectLabelEditingProvider', eventBus, canvas, directEditing, commandStack, modeling, this);

    directEditing.registerProvider(LOW_PRIORITY, this);

    let el;

    // listen to dblclick on non-root elements
    eventBus.on('element.dblclick', function (event) {
        const { element } = event;
        if (is(element.businessObject, 'bpmn:DataObjectReference')) {
            let label = element.businessObject.name;
            label = label.replace(/\s*\[.*?\]\s*$/, '');
            modeling.updateLabel(element, label);
            directEditing.activate(element);
            el = element;
            console.log('IS ACTIVE', directEditing.isActive(element))

        }
    });

    eventBus.on('directEditing.activate', async function (event) {
        console.log('directEditing.activate', event);
        const { element } = event.active;
        if (is(element.businessObject, 'bpmn:DataObjectReference')) {
            console.log('directEditing.activate bpmn:DataObjectReference', element, directEditing);
            // modeling.updateLabel(element, 'newLabel');
            // directEditing.activate(element);
        }
    });

    eventBus.on('directEditing.complete', function (event) {
        const element = el;
        if (element && is(element.businessObject, 'bpmn:DataObjectReference')) {
            const dataState = element.businessObject.dataState && element.businessObject.dataState.name;
            let newLabel = element.businessObject.name;

            // Append the data state if it exists
            if (dataState) {
                newLabel += ` [${dataState}]`;
            }

            // Update the label with the data state
            modeling.updateLabel(element, newLabel);

            el = undefined;
        }
    });

}

DataObjectLabelEditingProvider.$inject = [
    'eventBus',
    'canvas',
    'directEditing',
    'commandStack',
    'modeling'
];