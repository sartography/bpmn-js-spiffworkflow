import { HeaderButton, TextAreaEntry, TextFieldEntry, isTextFieldEntryEdited } from '@bpmn-io/properties-panel';
import { useService } from 'bpmn-js-properties-panel';

export default function(element) {

  return [
    {
      id: 'pythonScript',
      element,
      component: PythonScript,
      isEdited: isTextFieldEntryEdited
    },
    {
      id: 'launchEditorButton',
      element,
      component: LaunchEditorButton,
      isEdited: isTextFieldEntryEdited
    },
  ]
}

function PythonScript(props) {
  const { element, id } = props;

  const modeling = useService('modeling');
  const translate = useService('translate');
  const debounce = useService('debounceInput');

  const getValue = () => {
    return element.businessObject.script || '';
  };

  const setValue = value => {
    return modeling.updateProperties(element, {
      scriptFormat: "python",
      script: value
    });
  };

  return <TextAreaEntry
    id={ id }
    element={ element }
    description={ translate('Python script to execute') }
    label={ translate('Python Script') }
    getValue={ getValue }
    setValue={ setValue }
    debounce={ debounce }
  />
}

function LaunchEditorButton(props) {
  const { element, id } = props;
  const eventBus = useService('eventBus');
  const modeling = useService('modeling');
  return <HeaderButton
  className="spiffworkflow-properties-panel-button"
  onClick={() => {
    eventBus.fire('launch.script.editor', { element: element })
  }}
  >Launch Editor</HeaderButton>
}
