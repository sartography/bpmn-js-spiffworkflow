import React from 'react';
import { useService } from 'bpmn-js-properties-panel';
import { CheckboxEntry } from '@bpmn-io/properties-panel';
import {
  findCorrelationPropertiesByMessage,
  isMessageEvent,
} from '../../MessageHelpers';

/**
 * Enable matching and explicitly seed missing task-data expressions.
 */
export function MatchingCorrelationCheckboxEntry(props) {
  const { element, commandStack, moddle } = props;
  const { name, label, description } = props;
  const { businessObject } = element;

  const debounce = useService('debounceInput');

  const getValue = () => {
    const isMatchingCorrelation = businessObject.get(
      'spiffworkflow:isMatchingCorrelation'
    );
    const value =
      isMatchingCorrelation && isMatchingCorrelation !== 'false' ? true : false;
    return value;
  };

  const setValue = (value) => {
    const commands = [
      {
        cmd: 'element.updateProperties',
        context: {
          element,
          properties: { 'spiffworkflow:isMatchingCorrelation': value },
        },
      },
    ];

    // Only opt-in initializes defaults; importing or selecting a diagram never does.
    if (value && !getValue()) {
      const owner = isMessageEvent(element)
        ? businessObject.eventDefinitions[0]
        : businessObject;
      let extensions = owner.get('extensionElements');
      const values = extensions ? extensions.get('values') : [];
      const additions = [];
      for (const property of findCorrelationPropertiesByMessage(element) ||
        []) {
        const existing = values.find(
          (entry) =>
            entry.$instanceOf('spiffworkflow:ProcessVariableCorrelation') &&
            entry.propertyId === property.id
        );
        if (existing) {
          if (!existing.expression || !existing.expression.trim()) {
            commands.push({
              cmd: 'element.updateModdleProperties',
              context: {
                element,
                moddleElement: existing,
                properties: { expression: property.id },
              },
            });
          }
        } else {
          additions.push(
            moddle.create('spiffworkflow:ProcessVariableCorrelation', {
              propertyId: property.id,
              expression: property.id,
            })
          );
        }
      }
      if (additions.length) {
        if (!extensions) {
          extensions = moddle.create('bpmn:ExtensionElements');
          extensions.$parent = owner;
          commands.push({
            cmd: 'element.updateModdleProperties',
            context: {
              element,
              moddleElement: owner,
              properties: { extensionElements: extensions },
            },
          });
        }
        additions.forEach((entry) => {
          entry.$parent = extensions;
        });
        commands.push({
          cmd: 'element.updateModdleProperties',
          context: {
            element,
            moddleElement: extensions,
            properties: { values: [...values, ...additions] },
          },
        });
      }
    }

    // Keep the checkbox and its defaults in a single undoable operation.
    commandStack.execute('properties-panel.multi-command-executor', commands);
  };

  return (
    <CheckboxEntry
      id={'correlation_extension_' + name}
      element={element}
      description={description}
      label={label}
      getValue={getValue}
      setValue={setValue}
      debounce={debounce}
    />
  );
}
