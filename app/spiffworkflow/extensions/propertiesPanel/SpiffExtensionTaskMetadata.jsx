import React from 'react';
import { useEffect, useState } from '@bpmn-io/properties-panel/preact/hooks';
import { TextFieldEntry } from '@bpmn-io/properties-panel';
import { useService } from 'bpmn-js-properties-panel';

import { OPTION_TYPE } from './SpiffExtensionSelect';

export function SpiffExtensionTaskMetadata(props) {
  const { element, commandStack, moddle } = props;
  const eventBus = useService('eventBus');
  const debounce = useService('debounceInput');
  const [metadataKeys, setMetadataKeys] = useState(null);

  useEffect(() => {
    const onKeysReturned = (event) => {
      setMetadataKeys(event.keys || []);
    };
    eventBus.on(
      `spiff.${OPTION_TYPE.task_metadata_keys}.returned`,
      onKeysReturned
    );
    eventBus.fire(`spiff.${OPTION_TYPE.task_metadata_keys}.requested`, {
      eventBus,
    });
    return () => {
      eventBus.off(
        `spiff.${OPTION_TYPE.task_metadata_keys}.returned`,
        onKeysReturned
      );
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

    if (value === undefined || value === '') {
      if (entry) {
        // Remove the entry
        const index = metadataValues.values.indexOf(entry);
        metadataValues.values.splice(index, 1);
      }
    } else {
      if (!entry) {
        entry = moddle.create('spiffworkflow:TaskMetadataValue');
        entry.name = key;
        metadataValues.values.push(entry);
      }
      entry.value = value;
    }

    // If metadataValues is empty, we could remove it, but let's keep it simple for now.
    // Actually, if we don't remove it, we might end up with empty <spiffworkflow:taskMetadataValues /> tag.
    // Let's check if values is empty and remove the container if so.
    if (metadataValues.values.length === 0) {
      const containerIndex = extensionElements.values.indexOf(metadataValues);
      if (containerIndex > -1) {
        extensionElements.values.splice(containerIndex, 1);
      }
    }

    commandStack.execute('element.updateModdleProperties', {
      element,
      moddleElement: element.businessObject,
      properties: { extensionElements },
    });
  };

  const translate = useService('translate');

  const existingKeys = getMetadataValues().map((v) => v.name);
  const configuredKeys = metadataKeys || [];
  const configuredKeyNames = configuredKeys.map((k) =>
    typeof k === 'string' ? k : k.name
  );

  // Merge configured keys with existing keys from XML
  const allKeys = [...new Set([...configuredKeyNames, ...existingKeys])];

  if (allKeys.length === 0) {
    return (
      <style>{`[data-group-id="group-task_metadata_properties"] { display: none !important; }`}</style>
    );
  }

  return (
    <>
      {allKeys.map((key) => {
        const isConfigured = configuredKeyNames.includes(key);
        const keyEntry = configuredKeys.find(
          (k) => (typeof k === 'string' ? k : k.name) === key
        );

        const label = isConfigured
          ? typeof keyEntry === 'string'
            ? keyEntry
            : keyEntry.label || key
          : key;

        let description = isConfigured
          ? typeof keyEntry === 'string'
            ? undefined
            : keyEntry.description
          : translate('This key is not defined in the configuration.');

        if (!isConfigured) {
          description = (
            <>
              {description}{' '}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setMetadataValue(key, undefined);
                }}
                style={{ color: 'red' }}
              >
                Remove
              </a>
            </>
          );
        }

        return (
          <TextFieldEntry
            key={key}
            id={`extension_task_metadata_${key}`}
            element={element}
            label={label ? translate(label) : key}
            description={description}
            getValue={() => getMetadataValue(key)}
            setValue={(value) => {
              setMetadataValue(key, value);
            }}
            debounce={debounce}
          />
        );
      })}
    </>
  );
}
