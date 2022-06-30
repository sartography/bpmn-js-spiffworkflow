import { HeaderButton, TextAreaEntry, TextFieldEntry, isTextFieldEntryEdited } from '@bpmn-io/properties-panel';
import { useService } from 'bpmn-js-properties-panel';

export const SCRIPT_TYPE = {
  bpmn: 'bpmn:script',
  pre: 'spiffworkflow:preScript',
  post: 'spiffworkflow:postScript'
};

/**
 * Generates a python script.
 * @param element The elemment that should get the script task.
 * @param scriptType The type of script -- can be a preScript, postScript or a BPMN:Script for script tags
 * @param moddle For updating the underlying xml document when needed.
 * @returns {[{component: (function(*)), isEdited: *, id: string, element},{component: (function(*)), isEdited: *, id: string, element}]}
 */
export default function(element, moddle, scriptType, label, description) {

  return [
    {
      id: 'pythonScript_' + scriptType,
      element,
      targetTag: scriptType,
      component: PythonScript,
      isEdited: isTextFieldEntryEdited,
      moddle: moddle,
      label: label,
      description: description
    },
    {
      id: 'launchEditorButton' + scriptType,
      target_tag: scriptType,
      element,
      component: LaunchEditorButton,
      isEdited: isTextFieldEntryEdited,
      moddle: moddle
    },
  ];
}

function PythonScript(props) {
  const { element, id } = props;
  const type = props.targetTag;
  const moddle = props.moddle;
  const label = props.label;
  const description = props.description;

  const modeling = useService('modeling');
  const translate = useService('translate');
  const debounce = useService('debounceInput');

  /**
   * Finds the value of the given type within the extensionElements
   * given a type of "spiff:preScript", would find it in this, and retnr
   * the object.
   *
   *  <bpmn:
   <bpmn:userTask id="123" name="My User Task!">
      <bpmn:extensionElements>
         <spiff:preScript>
           me = "100% awesome"
         </spiff:preScript>
      </bpmn:extensionElements>
   ...
   </bpmn:userTask>
   *
   * @returns {string|null|*}
   */
  const getScriptObject = () => {
    const bizObj = element.businessObject;
    if (type === SCRIPT_TYPE.bpmn) {
      return bizObj.script || '';
    } else {
      if (!bizObj.extensionElements) {
        return null;
      } else {
        return bizObj.extensionElements.values.filter(function(e) {
          return e.$instanceOf(type);
        })[0];
      }
    }
  };

  const getValue = () => {
    const script = getScriptObject();
    if (script) {
      return (script.text);
    } else {
      return ('');
    }
  };

  const setValue = value => {
    const businessObject = element.businessObject;
    if (type === SCRIPT_TYPE.bpmn) {
      return modeling.updateProperties(element, {
        scriptFormat: 'python',
        script: value
      });
    } else {
      let script = getScriptObject();
      if (!script) {
        script = moddle.create(type);
        if (!businessObject.extensionElements) {
          businessObject.extensionElements = moddle.create('bpmn:ExtensionElements');
        }
        businessObject.extensionElements.get('values').push(script);
      }
      script.text = value;
      return script;
    }
  };

  return <TextAreaEntry
    id={ id }
    element={ element }
    description={ translate(description) }
    label={ translate(label) }
    getValue={ getValue }
    setValue={ setValue }
    debounce={ debounce }
  />;
}

function LaunchEditorButton(props) {
  const { element, id, type } = props;
  const eventBus = useService('eventBus');
  const modeling = useService('modeling');
  // fixme: add a call up date as a property
  return <HeaderButton
    className="spiffworkflow-properties-panel-button"
    onClick={() => {
      eventBus.fire('launch.script.editor', { element: element , type});
    }}
  >Launch Editor</HeaderButton>;
}
