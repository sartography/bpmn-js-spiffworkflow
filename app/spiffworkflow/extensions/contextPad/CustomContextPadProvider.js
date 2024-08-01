import { is } from 'bpmn-js/lib/util/ModelUtil';
import {
  getScriptString,
  updateScript,
} from '../propertiesPanel/SpiffScriptGroup';

const LOW_PRIORITY = 500;

export default function CustomContextPadProvider(
  contextPad,
  eventBus,
  commandStack,
  moddle,
) {
  contextPad.registerProvider(LOW_PRIORITY, this);

  this.getContextPadEntries = function (element) {
    return function (entries) {
      if (is(element, 'bpmn:ScriptTask')) {
        entries['trigger-script'] = {
          group: 'connect',
          className: 'bpmn-icon-script',
          title: 'Open Script Editor',
          action: {
            click: function (event, element) {
              triggerScript(
                element,
                'bpmn:script',
                eventBus,
                commandStack,
                moddle,
              );
            },
          },
        };
      } else if (hasPreAndPostScript(element)) {
        const PreScript = getScriptString(element, 'spiffworkflow:PreScript');
        if (PreScript && PreScript !== '') {
          entries['trigger-preScript'] = {
            group: 'connect',
            className: 'bpmn-icon-pre-script-trigger',
            title: 'Open PreScript Editor',
            action: {
              click: function (event, element) {
                triggerScript(
                  element,
                  'spiffworkflow:PreScript',
                  eventBus,
                  commandStack,
                  moddle,
                );
              },
            },
          };
        }

        const PostScript = getScriptString(element, 'spiffworkflow:PostScript');
        if (PostScript && PostScript !== '') {
          entries['trigger-postScript'] = {
            group: 'connect',
            className: 'bpmn-icon-post-script-trigger',
            title: 'Open PostScript Editor',
            action: {
              click: function (event, element) {
                triggerScript(
                  element,
                  'spiffworkflow:PostScript',
                  eventBus,
                  commandStack,
                  moddle,
                );
              },
            },
          };
        }
      }

      return entries;
    };
  };
}

CustomContextPadProvider.$inject = [
  'contextPad',
  'eventBus',
  'commandStack',
  'moddle',
];

function hasPreAndPostScript(element) {
  return (
    is(element, 'bpmn:Task') ||
    is(element, 'bpmn:UserTask') ||
    is(element, 'bpmn:ServiceTask') ||
    is(element, 'bpmn:SendTask') ||
    is(element, 'bpmn:ReceiveTask') ||
    is(element, 'bpmn:ManualTask') ||
    is(element, 'bpmn:CallActivity') ||
    is(element, 'bpmn:BusinessRuleTask') ||
    is(element, 'bpmn:SubProcess')
  );
}

function triggerScript(element, type, eventBus, commandStack, moddle) {
  const script = getScriptString(element, type);
  eventBus.fire('spiff.script.edit', {
    element,
    scriptType: type,
    script,
    eventBus,
  });
  eventBus.once('spiff.script.update', (event) => {
    updateScript(commandStack, moddle, element, event.scriptType, event.script);
  });
}
