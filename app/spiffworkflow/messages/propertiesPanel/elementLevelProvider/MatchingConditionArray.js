import { useService } from 'bpmn-js-properties-panel';
import {
    TextFieldEntry,
    DescriptionEntry
} from '@bpmn-io/properties-panel';
import {
    findCorrelationPropertiesByMessage, isMessageEvent,
} from '../../MessageHelpers';

/**
 * Matching correlation conditions
 */
export function MatchingCorrelationEntries(props) {
    const {
        idPrefix,
        translate,
        element,
        commandStack,
        moddle,
    } = props;

    const correlationPropertyArray = findCorrelationPropertiesByMessage(
        element
    );

    const entries = (correlationPropertyArray && correlationPropertyArray.length !== 0) ? correlationPropertyArray.map(
        (correlationPropertyModdleElement, index) => {
            return {
                id: `${idPrefix}-correlation-property-`,
                component: MatchingConditionTextField,
                correlationPropertyModdleElement,
                element,
                translate,
                commandStack,
                moddle
            };
        }
    ) : [{
        id: `${idPrefix}-name-textField`,
        component: DescriptionEntry,
        value: 'ℹ️ No matching conditions can be established since the selected message has no correlation properties',
        element,
        translate,
        commandStack,
    }];

    return { entries };
}

function MatchingConditionTextField(props) {
    const {
        id,
        element,
        commandStack,
        translate,
        correlationPropertyModdleElement,
        moddle
    } = props;

    const debounce = useService('debounceInput');

    const getVariableCorrelationObject = () => {
        if (element) {
            const { extensionElements } = (isMessageEvent(element)) ? element.businessObject.eventDefinitions[0] : element.businessObject;
            if (extensionElements) {
                return extensionElements
                    .get('values')
                    .filter(function getInstanceOfType(e) {
                        return e.$instanceOf('spiffworkflow:ProcessVariableCorrelation') &&
                            e.propertyId === correlationPropertyModdleElement.id;
                    })[0];
            }
        }
        return null;
    };

    const setValue = (value) => {
        
        const trimmedValue = (value) ? value.trim() : value;

        var extensions = (isMessageEvent(element)) ?
            element.businessObject.eventDefinitions[0].get('extensionElements') || moddle.create('bpmn:ExtensionElements') :
            element.businessObject.get('extensionElements') || moddle.create('bpmn:ExtensionElements');

        let variableCorrelationObject = getVariableCorrelationObject();

        if (trimmedValue === '' || !trimmedValue) {
            // remove the object if it exists
            if (variableCorrelationObject) {
                const index = extensions.get('values').indexOf(variableCorrelationObject);
                if (index > -1) {
                    extensions.get('values').splice(index, 1);
                }
            }
        } else {
            // create or update the object
            if (!variableCorrelationObject) {
                variableCorrelationObject = moddle.create('spiffworkflow:ProcessVariableCorrelation', {
                    propertyId: correlationPropertyModdleElement.id,
                    expression: trimmedValue
                });
                extensions.get('values').push(variableCorrelationObject);
            } else {
                variableCorrelationObject.expression = trimmedValue;
            }
        }

        (isMessageEvent(element)) ? element.businessObject.eventDefinitions[0].set('extensionElements', extensions) : element.businessObject.set('extensionElements', extensions);
        commandStack.execute('element.updateProperties', {
            element,
            properties: {},
        });
    };

    const getValue = () => {
        const variableCorrelationObject = getVariableCorrelationObject();
        if (variableCorrelationObject && variableCorrelationObject.propertyId === correlationPropertyModdleElement.id) {
            return variableCorrelationObject.expression;
        }
        return '';
    };

    return TextFieldEntry({
        element,
        id: `${id}-name-textField`,
        label: translate(correlationPropertyModdleElement.id),
        getValue,
        setValue,
        debounce,
    });
}
