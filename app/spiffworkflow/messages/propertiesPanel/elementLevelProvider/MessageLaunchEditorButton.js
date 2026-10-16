import { HeaderButton } from '@bpmn-io/properties-panel';
import { useService } from 'bpmn-js-properties-panel';
import {
  findCorrelationPropertiesAndRetrievalExpressionsForMessage,
  getMessageRefElement,
} from '../../MessageHelpers';

/**
 * Sends a notification to the host application saying the user
 * would like to edit something.  Hosting application can then
 * update the value and send it back.
 */
export function MessageLaunchEditorButton(props) {
  const { element, commandStack } = props;

  const sendEvent = 'spiff.message.edit';
  const listenEvent = 'spiff.message.update';

  const eventBus = useService('eventBus');

  const messageRef = getMessageRefElement(element);
  const correlationProperties =
    findCorrelationPropertiesAndRetrievalExpressionsForMessage(element);
  const parsedCorrelationProperties = correlationProperties.map((item) => ({
    id: item.correlationPropertyModdleElement.id,
    retrievalExpression:
      item.correlationPropertyRetrievalExpressionModdleElement.messagePath.body,
  }));

  let messageId = null;
  if (messageRef && messageRef.id) {
    messageId = messageRef.id;
  }
  if (messageRef && messageRef.name && messageRef.name !== messageId) {
    messageId = messageRef.name;
  }
  return HeaderButton({
    className: 'spiffworkflow-properties-panel-button',
    id: `message_launch_message_editor_button`,
    onClick: () => {
      // eventBus.fire('spiff.add_message.requested', { eventBus });

      eventBus.fire(sendEvent, {
        value: {
          elementId: element.id,
          messageId,
          correlation_properties: parsedCorrelationProperties,
        },
        eventBus,
        listenEvent,
      });

      // Listen for a response, to update the message name. The BPMN id is
      // the stable correlation identity (see the bpmn_id rename contract)
      // and must not be rewritten here; the change goes through the command
      // stack so the id index stays intact and the edit is undoable.
      eventBus.once(listenEvent, (response) => {
        const nextName = response && response.value;
        if (!messageRef || nextName == null || nextName === '') {
          return;
        }
        commandStack.execute('spiff.message.update', {
          update: (set) => {
            set(messageRef, 'name', nextName);
          },
        });
      });
    },
    children: 'Open message editor',
  });
}
