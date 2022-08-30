import scriptGroup, { SCRIPT_TYPE } from './SpiffScriptGroup';
import { is, isAny } from 'bpmn-js/lib/util/ModelUtil';
import { SpiffExtensionCalledDecision } from './SpiffExtensionCalledDecision';
import { SpiffExtensionTextInput } from './SpiffExtensionTextInput';
import { SpiffExtensionServiceProperties, ServiceTaskOperatorSelect } from './SpiffExtensionServiceProperties';
const LOW_PRIORITY = 500;

export default function ExtensionsPropertiesProvider(propertiesPanel, translate, moddle, commandStack, elementRegistry) {
  this.getGroups = function(element) {
    return function(groups) {
      if (is(element, 'bpmn:ScriptTask')) {
        groups.push(createScriptGroup(element, translate, moddle));
      } else if (isAny(element, [ 'bpmn:Task', 'bpmn:CallActivity', 'bpmn:SubProcess' ])) {
        groups.push(preScriptPostScriptGroup(element, translate, moddle));
      }
      if (is(element, 'bpmn:UserTask')) {
        groups.push(createUserGroup(element, translate, moddle, commandStack));
      }
      if (is(element, 'bpmn:BusinessRuleTask')) {
        groups.push(createBusinessRuleGroup(element, translate, moddle, commandStack));
      }
      if (is(element, 'bpmn:ServiceTask')) {
        groups.push(createServiceGroup(element, translate, moddle, commandStack));
      }

      return groups;
    };
  };
  propertiesPanel.registerProvider(LOW_PRIORITY, this);
}

ExtensionsPropertiesProvider.$inject = [ 'propertiesPanel', 'translate', 'moddle', 'commandStack', 'elementRegistry' ];


/**
 * Adds a group to the properties panel for the script task that allows you
 * to set the script.
 * @param element
 * @param translate
 * @returns The components to add to the properties panel. */
function createScriptGroup(element, translate, moddle, commandStack) {
  return {
    id: 'spiff_script',
    label: translate('Script'),
    entries: scriptGroup(element, moddle, SCRIPT_TYPE.bpmn, 'Script', 'Code to execute.')
  };
}

/**
 * Adds a section to the properties' panel for NON-Script tasks, so that
 * you can define a pre-script and a post-script for modifying data as it comes and out.
 * @param element
 * @param translate
 * @param moddle  For altering the underlying XML File.
 * @returns The components to add to the properties panel.
 */
function preScriptPostScriptGroup(element, translate, moddle) {
  return {
    id: 'spiff_pre_post_scripts',
    label: translate('SpiffWorkflow Scripts'),
    entries: [
      ...scriptGroup(element,
        moddle,
        SCRIPT_TYPE.pre,
        'Pre-Script',
        'code to execute prior to this task.'),
      ...scriptGroup(element,
        moddle,
        SCRIPT_TYPE.post,
        'Post-Script',
        'code to execute after this task.')
    ]
  };
}


/**
 * Create a group on the main panel with a select box (for choosing the Data Object to connect)
 * @param element
 * @param translate
 * @param moddle
 * @returns entries
 */
function createUserGroup(element, translate, moddle, commandStack) {
  return {
    id: 'user_task_properties',
    label: translate('SpiffWorkflow Web Form'),
    entries: [
      {
        element: element,
        moddle: moddle,
        commandStack: commandStack,
        component: SpiffExtensionTextInput,
        label: translate('JSON Schema Filename'),
        description: translate('RJSF Json Data Structure Filename'),
        name: 'formJsonSchemaFilename' },
      {
        element: element,
        moddle: moddle,
        commandStack: commandStack,
        component: SpiffExtensionTextInput,
        label: translate('UI Schema Filename'),
        description: translate('RJSF User Interface Filename'),
        name: 'formUiSchemaFilename' }
    ]
  };
}

/**
 * Create a group on the main panel with a text box (for choosing the dmn to connect)
 * @param element
 * @param translate
 * @param moddle
 * @returns entries
 */
function createBusinessRuleGroup(element, translate, moddle, commandStack) {
  return {
    id: 'business_rule_properties',
    label: translate('Business Rule Properties'),
    entries: [
      {
        element: element,
        moddle: moddle,
        commandStack: commandStack,
        component: SpiffExtensionCalledDecision,
        label: translate('Decision Id'),
        description: translate('Id of the decision'),
      }
    ]
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
  return {
    id: 'service_task_properties',
    label: translate('Spiffworkflow Service Properties'),
    entries: [
      {
        element: element,
        moddle: moddle,
        commandStack: commandStack,
        component: ServiceTaskOperatorSelect,
        translate
      }
    ]
  };
}
