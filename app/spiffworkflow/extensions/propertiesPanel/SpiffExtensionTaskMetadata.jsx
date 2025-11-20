import React, { useEffect, useState } from 'react';
import { TextFieldEntry } from '@bpmn-io/properties-panel';
import { useService } from 'bpmn-js-properties-panel';

import { OPTION_TYPE } from './SpiffExtensionSelect';

export function SpiffExtensionTaskMetadata(props) {
    const { element, commandStack, moddle } = props;
    const eventBus = useService('eventBus');
    const debounce = useService('debounceInput');
    const [metadataKeys, setMetadataKeys] = useState([]);

    useEffect(() => {
        const onKeysReturned = (event) => {
            setMetadataKeys(event.keys || []);
        };
        eventBus.on(`spiff.${OPTION_TYPE.task_metadata_keys}.returned`, onKeysReturned);
        eventBus.fire(`spiff.${OPTION_TYPE.task_metadata_keys}.requested`, { eventBus });
        return () => {
            eventBus.off(`spiff.${OPTION_TYPE.task_metadata_keys}.returned`, onKeysReturned);
        };
    }, [eventBus]);

    const getMetadataValues = () => {
        const extensionElements = element.businessObject.extensionElements;
        if (!extensionElements) return [];
        const metadataValues = extensionElements.values.find(
            (value) => value.$type === 'spiffworkflow:TaskMetadataValues'
        );
        return metadataValues ? metadataValues.values : [];
    };

    const getMetadataValue = (key) => {
        const values = getMetadataValues();
        const entry = values.find((v) => v.name === key);
        return entry ? entry.value : '';
    };

    const setMetadataValue = (key, value) => {
        let extensionElements = element.businessObject.extensionElements;
        if (!extensionElements) {
            extensionElements = moddle.create('bpmn:ExtensionElements');
            extensionElements.values = [];
            commandStack.execute('element.updateModdleProperties', {
                element,
                moddleElement: element.businessObject,
                properties: { extensionElements },
            });
        }

        let metadataValues = extensionElements.values.find(
            (val) => val.$type === 'spiffworkflow:TaskMetadataValues'
        );

        if (!metadataValues) {
            metadataValues = moddle.create('spiffworkflow:TaskMetadataValues');
            metadataValues.values = [];
            extensionElements.values.push(metadataValues);
        }

        let entry = metadataValues.values.find((v) => v.name === key);
        if (!entry) {
            entry = moddle.create('spiffworkflow:TaskMetadataValue');
            entry.name = key;
            metadataValues.values.push(entry);
        }
        entry.value = value;

        commandStack.execute('element.updateModdleProperties', {
            element,
            moddleElement: element.businessObject,
            properties: { extensionElements },
        });
    };

    return (
        <>
            {metadataKeys.map((key) => (
                <TextFieldEntry
                    key={key}
                    id={`extension_task_metadata_${key}`}
                    element={element}
                    label={key}
                    getValue={() => getMetadataValue(key)}
                    setValue={(value) => setMetadataValue(key, value)}
                    debounce={debounce}
                />
            ))}
        </>
    );
}
