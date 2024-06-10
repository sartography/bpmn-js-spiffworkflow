import { MessageArray } from './MessageArray';
import { CorrelationKeysArray } from './CorrelationKeysArray';
import { CorrelationPropertiesArray } from './CorrelationPropertiesArray';
import { ListGroup } from '@bpmn-io/properties-panel';

/**
 * Adds a group to the properties panel for the script task that allows you
 * to set the script.
 * @param element
 * @param translate
 * @returns The components to add to the properties panel. */
export function createCollaborationGroup(
  element,
  translate,
  moddle,
  commandStack,
  elementRegistry
) {

  const results = [
    {
      id: 'messages',
      label: translate('Messages'),
      isDefault: true,
      component: ListGroup,
      ...MessageArray({
        element,
        moddle,
        commandStack,
        elementRegistry,
        translate,
      }),
    },
    {
      id: 'correlation_properties',
      class: 'correlation_properties',
      className: 'correlation_properties',
      label: translate('Correlation Properties'),
      isDefault: true,
      component: ListGroup,
      ...CorrelationPropertiesArray({
        element,
        moddle,
        commandStack,
        elementRegistry,
        translate,
      }),
    }
  ];

  // Hide Correlation Keys
  // if (element.type === 'bpmn:Collaboration') {
  //   results.push({
  //     id: 'correlation_keys',
  //     label: translate('Correlation Keys'),
  //     isDefault: true,
  //     component: ListGroup,
  //     ...CorrelationKeysArray({
  //       element,
  //       moddle,
  //       commandStack,
  //       elementRegistry,
  //       translate,
  //     }),
  //   })
  // }

  return results;
}