import { HeaderButton } from '@bpmn-io/properties-panel';
import { useService } from 'bpmn-js-properties-panel';
import { getExtensionValue } from '../extensionHelpers';

/**
 * Sends a notification to the host application saying the user
 * would like to edit an external file.  Hosting application
 * would need to handle saving the file.
 */
export function SpiffExtensionLaunchFileEditor(props) {
  const { element, name } = props;
  const eventBus = useService('eventBus');
  return HeaderButton({
    className: 'spiffworkflow-properties-panel-button',
    onClick: () => {
      const fileName = getExtensionValue(element, name);
      eventBus.fire('file.editor.launch', {
        fileName,
      });
    },
    children: 'Launch Editor',
  });
}
