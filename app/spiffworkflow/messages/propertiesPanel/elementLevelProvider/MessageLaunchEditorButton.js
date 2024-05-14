import { HeaderButton } from '@bpmn-io/properties-panel';
import { useService } from 'bpmn-js-properties-panel';
import {getMessageRefElement} from "../../MessageHelpers";

/**
 * Sends a notification to the host application saying the user
 * would like to edit something.  Hosting application can then
 * update the value and send it back.
 */
export function MessageLaunchEditorButton(props) {
  const { element } = props;

  const sendEvent = 'spiff.message.edit';
  const listenEvent = 'spiff.message.update';

  const eventBus = useService('eventBus');

  const messageRef = getMessageRefElement(element);
  let messageId = null;
  if (messageRef && messageRef.id) {
    messageId = messageRef.id;
  }
  return HeaderButton({
    className: 'spiffworkflow-properties-panel-button',
    id: `message_launch_message_editor_button`,
    onClick: () => {
      eventBus.fire(sendEvent, {
        value: messageId,
        eventBus,
        listenEvent,
      });
      // Listen for a response, to update the script.
      eventBus.once(listenEvent, (response) => {
        messageRef.id = response.value;
      });
    },
    children: 'Open message editor',
  });
}