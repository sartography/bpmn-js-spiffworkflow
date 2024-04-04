import { HeaderButton } from '@bpmn-io/properties-panel';

/**
 * Sends a notification to the host application saying the user
 * would like to edit something.  Hosting application can then
 * update the value and send it back.
 */
export function MessageLaunchEditorButton(props) {

    const { element, name, translate } = props;

    const openEditorLabel = (element.businessObject && !element.businessObject.messageRef) ? 'Create message' : 'Edit message'

    return HeaderButton({
        className: 'spiffworkflow-properties-panel-button',
        id: 'message_launch_editor_button',
        onClick: () => {
            alert(openEditorLabel)
        },
        children: translate(openEditorLabel),
    });
}
