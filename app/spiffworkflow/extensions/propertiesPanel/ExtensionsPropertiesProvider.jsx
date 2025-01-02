import React from 'react';
import {
  ListGroup,
  CheckboxEntry,
  isTextAreaEntryEdited,
  isCheckboxEntryEdited,
  TextAreaEntry,
  isTextFieldEntryEdited,
  HeaderButton,
  SelectEntry,
  isSelectEntryEdited,
} from '@bpmn-io/properties-panel';
import { is, isAny } from 'bpmn-js/lib/util/ModelUtil';
import {
  ServiceTaskParameterArray,
  ServiceTaskOperatorSelect,
  ServiceTaskResultTextInput,
} from './SpiffExtensionServiceProperties';
import {
  OPTION_TYPE,
  spiffExtensionOptions,
  SpiffExtensionSelect,
} from './SpiffExtensionSelect';
import { SpiffExtensionLaunchButton } from './SpiffExtensionLaunchButton';
import { SpiffExtensionTextArea } from './SpiffExtensionTextArea';
import { SpiffExtensionTextInput } from './SpiffExtensionTextInput';
import { SpiffExtensionCheckboxEntry } from './SpiffExtensionCheckboxEntry';
import { hasEventDefinition } from 'bpmn-js/lib/util/DiUtil';
import { setExtensionValue } from '../extensionHelpers';
import { useService } from 'bpmn-js-properties-panel';

const LOW_PRIORITY = 500;

export const SCRIPT_TYPE = {
  bpmn: 'bpmn:script',
  pre: 'spiffworkflow:PreScript',
  post: 'spiffworkflow:PostScript',
};

function PythonScript(props) {
  const { element, id } = props;
  const { type } = props;
  const { moddle, commandStack } = props;
  const { label } = props;
  const { description } = props;

  const translate = useService('translate');
  const debounce = useService('debounceInput');

  const getValue = () => {
    return getScriptString(element, type);
  };

  const setValue = (value) => {
    console.log('hammered script setValue');
    updateScript(commandStack, moddle, element, type, value);
  };

  return TextAreaEntry({
    id,
    element,
    description: translate(description),
    label: translate(label),
    getValue,
    setValue,
    debounce,
    isEdited: isTextFieldEntryEdited,
  });
}

function LaunchEditorButton(props) {
  const { element, type, moddle, commandStack } = props;
  const eventBus = useService('eventBus');
  return HeaderButton({
    className: 'spiffworkflow-properties-panel-button',
    onClick: () => {
      const script = getScriptString(element, type);
      eventBus.fire('spiff.script.edit', {
        element,
        scriptType: type,
        script,
        eventBus,
      });
      // Listen for a response, to update the script.
      eventBus.once('spiff.script.update', (event) => {
        console.log(
          'calling script from spiff.script.update (never happens here)'
        );
        updateScript(
          commandStack,
          moddle,
          element,
          event.scriptType,
          event.script
        );
      });
    },
    children: 'Launch Editor',
  });
}

function getScriptObject(element, scriptType) {
  const bizObj = element.businessObject;
  if (scriptType === SCRIPT_TYPE.bpmn) {
    return bizObj;
  }
  if (!bizObj.extensionElements) {
    return null;
  }

  return bizObj.extensionElements
    .get('values')
    .filter(function getInstanceOfType(e) {
      return e.$instanceOf(scriptType);
    })[0];
}

export function updateScript(
  commandStack,
  moddle,
  element,
  scriptType,
  newValue
) {
  const { businessObject } = element;
  let scriptObj = getScriptObject(element, scriptType);
  if (!newValue && scriptObj && scriptType !== SCRIPT_TYPE.bpmn) {
    let { extensionElements } = businessObject;
    if (!extensionElements) {
      extensionElements = moddle.create('bpmn:ExtensionElements');
    }
    if (extensionElements && extensionElements.get) {
      const values = extensionElements
        .get('values')
        .filter((e) => e !== scriptObj);
      extensionElements.values = values;
      businessObject.extensionElements = extensionElements;
      console.log('script 1');
      commandStack.execute('element.updateModdleProperties', {
        element,
        moddleElement: businessObject,
        properties: {},
      });
      return;
    }
  }
  if (!scriptObj) {
    scriptObj = moddle.create(scriptType);
    if (scriptType !== SCRIPT_TYPE.bpmn) {
      let { extensionElements } = businessObject;
      if (!extensionElements) {
        extensionElements = moddle.create('bpmn:ExtensionElements');
      }
      scriptObj.value = newValue;
      extensionElements.get('values').push(scriptObj);
      console.log('script 2 (this is the one)');
      commandStack.execute('element.updateModdleProperties', {
        element,
        moddleElement: businessObject,
        properties: {
          extensionElements,
        },
      });
    }
  } else {
    let newProps = { value: newValue };
    if (scriptType === SCRIPT_TYPE.bpmn) {
      newProps = { script: newValue };
    }
    console.log('script 3');
    commandStack.execute('element.updateModdleProperties', {
      element,
      moddleElement: scriptObj,
      properties: newProps,
    });
  }
}

export function getScriptString(element, scriptType) {
  const scriptObj = getScriptObject(element, scriptType);
  if (scriptObj && scriptObj.value) {
    return scriptObj.value;
  }
  if (scriptObj && scriptObj.script) {
    return scriptObj.script;
  }
  return '';
}

export default function ExtensionsPropertiesProvider(
  propertiesPanel,
  translate,
  moddle,
  commandStack,
  elementRegistry
) {
  this.getGroups = function (element) {
    return function (groups) {
      if (is(element, 'bpmn:ScriptTask')) {
        groups.push(
          createScriptGroup(element, translate, moddle, commandStack)
        );
      } else if (
        isAny(element, ['bpmn:Task', 'bpmn:CallActivity', 'bpmn:SubProcess'])
      ) {
        groups.push(
          preScriptPostScriptGroup(element, translate, moddle, commandStack)
        );
      }
      if (is(element, 'bpmn:UserTask')) {
        groups.push(createUserGroup(element, translate, moddle, commandStack));
      }

      if (is(element, 'bpmn:BusinessRuleTask')) {
        groups.push(
          createBusinessRuleGroup(element, translate, moddle, commandStack)
        );
      }
      if (
        isAny(element, [
          'bpmn:ManualTask',
          'bpmn:UserTask',
          'bpmn:ServiceTask',
          'bpmn:EndEvent',
          'bpmn:ScriptTask',
          'bpmn:IntermediateCatchEvent',
          'bpmn:CallActivity',
          'bpmn:SubProcess',
        ])
      ) {
        groups.push(
          createUserInstructionsGroup(element, translate, moddle, commandStack)
        );
      }
      if (isAny(element, ['bpmn:ManualTask', 'bpmn:UserTask'])) {
        groups.push(
          createAllowGuestGroup(element, translate, moddle, commandStack)
        );
      }
      if (
        is(element, 'bpmn:BoundaryEvent') &&
        hasEventDefinition(element, 'bpmn:SignalEventDefinition') &&
        isAny(element.businessObject.attachedToRef, [
          'bpmn:ManualTask',
          'bpmn:UserTask',
        ])
      ) {
        groups.push(
          createSignalButtonGroup(element, translate, moddle, commandStack)
        );
      }

      if (is(element, 'bpmn:ServiceTask')) {
        groups.push(
          createServiceGroup(element, translate, moddle, commandStack)
        );
      }

      return groups;
    };
  };
  propertiesPanel.registerProvider(LOW_PRIORITY, this);
}

ExtensionsPropertiesProvider.$inject = [
  'propertiesPanel',
  'translate',
  'moddle',
  'commandStack',
  'elementRegistry',
];

function createScriptGroup(element, translate, moddle, commandStack) {
  return {
    id: 'spiff_script',
    label: translate('Script'),
    entries: getEntries({
      element,
      moddle,
      scriptType: SCRIPT_TYPE.bpmn,
      label: 'Script',
      description: 'Code to execute.',
      translate,
      commandStack,
    }),
  };
}

function preScriptPostScriptGroup(element, translate, moddle, commandStack) {
  const entries = [
    ...getEntries({
      element,
      moddle,
      commandStack,
      translate,
      scriptType: SCRIPT_TYPE.pre,
      label: 'Pre-Script',
      description: 'code to execute prior to this task.',
    }),
    ...getEntries({
      element,
      moddle,
      commandStack,
      translate,
      scriptType: SCRIPT_TYPE.post,
      label: 'Post-Script',
      description: 'code to execute after this task.',
    }),
  ];
  return {
    id: 'spiff_pre_post_scripts',
    label: translate('Pre/Post Scripts'),
    entries: entries,
  };
}

function getEntries(props) {
  const {
    element,
    moddle,
    scriptType,
    label,
    description,
    translate,
    commandStack,
  } = props;

  const entries = [
    {
      id: `pythonScript_${scriptType}`,
      element,
      type: scriptType,
      component: PythonScript,
      isEdited: isTextFieldEntryEdited,
      moddle,
      commandStack,
      label,
      description,
    },
    {
      id: `launchEditorButton${scriptType}`,
      type: scriptType,
      element,
      component: LaunchEditorButton,
      moddle,
      commandStack,
    },
  ];

  return entries;
}

/**
 * Create a group on the main panel with a select box (for choosing the Data Object to connect)
 * @param element
 * @param translate
 * @param moddle
 * @returns entries
 */
function createUserGroup(element, translate, moddle, commandStack) {
  const updateExtensionProperties = (
    element,
    name,
    value,
    moddle,
    commandStack
  ) => {
    const uiName = value.replace('schema.json', 'uischema.json');
    setExtensionValue(
      element,
      'formJsonSchemaFilename',
      value,
      moddle,
      commandStack
    );
    setExtensionValue(
      element,
      'formUiSchemaFilename',
      uiName,
      moddle,
      commandStack
    );
    const matches = spiffExtensionOptions[OPTION_TYPE.json_schema_files].filter(
      (opt) => opt.value === value
    );
    if (matches.length === 0) {
      spiffExtensionOptions[OPTION_TYPE.json_schema_files].push({
        label: value,
        value: value,
      });
    }
  };

  return {
    id: 'user_task_properties',
    label: translate('Web Form (with Json Schemas)'),
    entries: [
      {
        element,
        moddle,
        commandStack,
        component: SpiffExtensionSelect,
        optionType: OPTION_TYPE.json_schema_files,
        name: 'formJsonSchemaFilename',
        label: translate('JSON Schema Filename'),
        description: translate('Form Description (RSJF)'),
        isEdited: isSelectEntryEdited,
      },
      {
        component: SpiffExtensionLaunchButton,
        element,
        moddle,
        commandStack,
        name: 'formJsonSchemaFilename',
        label: translate('Launch Editor'),
        event: 'spiff.file.edit',
        listenEvent: 'spiff.jsonSchema.update',
        listenFunction: updateExtensionProperties,
        description: translate('Edit the form schema'),
      },
    ],
  };
}

/**
 * Select and launch for Business Rules
 *
 * @param element
 * @param translate
 * @param moddle
 * @param commandStack
 * @returns {{entries: [{moddle, component: ((function(*): preact.VNode<any>)|*), name: string, description, label, commandStack, element},{component: ((function(*): preact.VNode<any>)|*), name: string, description, label, event: string, element}], id: string, label}}
 */
function createBusinessRuleGroup(element, translate, moddle, commandStack) {
  return {
    id: 'business_rule_properties',
    label: translate('Business Rule Properties'),
    entries: [
      {
        element,
        moddle,
        commandStack,
        component: SpiffExtensionSelect,
        optionType: OPTION_TYPE.dmn_files,
        name: 'spiffworkflow:CalledDecisionId',
        label: translate('Select Decision Table'),
        description: translate('Select a decision table from the list'),
        isEdited: isSelectEntryEdited,
      },
      {
        element,
        component: SpiffExtensionLaunchButton,
        name: 'spiffworkflow:CalledDecisionId',
        label: translate('Launch Editor'),
        event: 'spiff.dmn.edit',
        description: translate('Modify the Decision Table'),
      },
    ],
  };
}

/**
 * Create a group on the main panel with a text box (for choosing the information to display to the user)
 * @param element
 * @param translate
 * @param moddle
 * @returns entries
 */
function createUserInstructionsGroup(element, translate, moddle, commandStack) {
  return {
    id: 'instructions',
    label: translate('Instructions'),
    entries: [
      {
        element,
        moddle,
        commandStack,
        component: InstructionsTextArea, // Use the new component
        id: 'instructions_text_area',
        name: 'spiffworkflow:InstructionsForEndUser',
        label: 'Instructions',
        description:
          'IS Displayed above user forms or when this task is executing.',
      },
      {
        element,
        moddle,
        commandStack,
        component: SpiffExtensionLaunchButton,
        name: 'spiffworkflow:InstructionsForEndUser',
        label: translate('Launch Editor'),
        event: 'spiff.markdown.edit',
        listenEvent: 'spiff.markdown.update',
        description: translate('Edit the form schema'),
      },
    ],
  };
}

function InstructionsTextArea(props) {
  const { element, moddle, commandStack, label, description } = props;
  const translate = useService('translate');
  const debounce = useService('debounceInput');

  const getValue = () => {
    return getScriptString(element, 'spiffworkflow:InstructionsForEndUser');
  };

  const setValue = (value) => {
    console.log('setValue: started');
    setExtensionValue(
      element,
      'spiffworkflow:InstructionsForEndUser',
      value,
      moddle,
      commandStack
    );
    console.log(
      'setValue: about to call commandStack element.updateModdleProperties'
    );
    commandStack.execute('element.updateModdleProperties', {
      element,
      moddleElement: element.businessObject,
      properties: {},
    });
    console.log('setValue: called element.updateModdleProperties');
  };

  return TextAreaEntry({
    id: 'instructionsTextArea',
    element,
    description: translate(description),
    label: translate(label),
    getValue,
    setValue,
    debounce,
    isEdited: isTextFieldEntryEdited,
  });
}

/**
 * Create a group on the main panel with a text box (for choosing the information to display to the user)
 * @param element
 * @param translate
 * @param moddle
 * @returns entries
 */
function createAllowGuestGroup(element, translate, moddle, commandStack) {
  return {
    id: 'allow_guest_user',
    label: translate('Guest options'),
    entries: [
      {
        element,
        moddle,
        commandStack,
        component: SpiffExtensionCheckboxEntry,
        name: 'spiffworkflow:AllowGuest',
        label: 'Guest can complete this task',
        description:
          'Allow a guest user to complete this task without logging in. They will not be allowed to do anything but submit this task. If another task directly follows it that allows guest access, they could also complete that task.',
        isEdited: isCheckboxEntryEdited,
      },
      {
        element,
        moddle,
        commandStack,
        component: SpiffExtensionTextArea,
        name: 'spiffworkflow:GuestConfirmation',
        label: 'Guest confirmation',
        description:
          'This is markdown that is displayed to the user after they complete the task. If this is filled out then the user will not be able to complete additional tasks without a new link to the next task.',
        isEdited: isTextAreaEntryEdited,
      },
      {
        element,
        moddle,
        commandStack,
        component: SpiffExtensionLaunchButton,
        name: 'spiffworkflow:GuestConfirmation',
        label: translate('Launch Editor'),
        event: 'spiff.markdown.edit',
        listenEvent: 'spiff.markdown.update',
      },
    ],
  };
}

/**
 * Create a group on the main panel with a text box for specifying a
 * a Button Label that is associated with a signal event.)
 * @param element
 * @param translate
 * @param moddle
 * @returns entries
 */
function createSignalButtonGroup(element, translate, moddle, commandStack) {
  let description = (
    <p style={{ maxWidth: '330px' }}>
      {' '}
      If attached to a user/manual task, setting this value will display a
      button which a user can click to immediately fire this signal event.
    </p>
  );
  return {
    id: 'signal_button',
    label: translate('Button'),
    entries: [
      {
        element,
        moddle,
        commandStack,
        component: SpiffExtensionTextInput,
        name: 'spiffworkflow:SignalButtonLabel',
        label: 'Button Label',
        description: description,
        isEdited: isTextFieldEntryEdited,
      },
    ],
  };
}

/**
 * Create a group on the main panel with a text box (for choosing the dmn to connect)
 * @param element
 * @param translate
 * @param moddle
 * @returns entries
 */
function createServiceGroup(element, translate, moddle, commandStack) {
  let entries = [
    {
      element,
      moddle,
      commandStack,
      component: ServiceTaskOperatorSelect,
      translate,
    },
    {
      element,
      moddle,
      commandStack,
      component: ServiceTaskResultTextInput,
      translate,
    },
  ];
  if (
    typeof element.businessObject.extensionElements !== 'undefined' &&
    typeof element.businessObject.extensionElements.values[0].parameterList
      .parameters !== 'undefined'
  ) {
    entries.push({
      id: 'serviceTaskParameters',
      label: translate('Parameters'),
      component: ListGroup,
      shouldSort: false,
      ...ServiceTaskParameterArray({
        element,
        moddle,
        translate,
        commandStack,
      }),
    });
  }
  return {
    id: 'service_task_properties',
    label: translate('Spiffworkflow Service Properties'),
    entries: entries,
  };
}
