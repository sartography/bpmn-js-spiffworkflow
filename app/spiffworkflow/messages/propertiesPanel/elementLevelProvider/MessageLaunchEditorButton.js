import { HeaderButton } from '@bpmn-io/properties-panel';
import { useService } from 'bpmn-js-properties-panel';

/**
 * Sends a notification to the host application saying the user
 * would like to edit something.  Hosting application can then
 * update the value and send it back.
 */
export function MessageLaunchEditorButton(props) {
    const { element, name, event, listenEvent, listenFunction } = props;
    const eventBus = useService('eventBus');
    return HeaderButton({
        className: 'spiffworkflow-properties-panel-button',
        id: `message_launch_editor_button_${name}`,
        onClick: () => {
            alert("Open message editor")
        },
        children: 'Open message editor',
    });
}
