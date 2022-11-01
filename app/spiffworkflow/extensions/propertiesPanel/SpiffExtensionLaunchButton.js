import { HeaderButton } from '@bpmn-io/properties-panel';
import { useService } from 'bpmn-js-properties-panel';
import { getExtensionValue } from '../extensionHelpers';

/**
 * Sends a notification to the host application saying the user
 * would like to edit an external file.  Hosting application
 * would need to handle saving the file.
 */
export function SpiffExtensionLaunchButton(props) {
  const { element, name, event } = props;
  const eventBus = useService('eventBus');
  return HeaderButton({
    className: 'spiffworkflow-properties-panel-button',
    onClick: () => {
      const value = getExtensionValue(element, name);
      eventBus.fire(event, {
        value,
      });
    },
    children: 'Launch Editor',
  });
}
