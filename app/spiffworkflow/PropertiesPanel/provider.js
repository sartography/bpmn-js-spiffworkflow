import spellProps from './parts/SpellProps';
import { is } from 'bpmn-js/lib/util/ModelUtil';

const LOW_PRIORITY = 500;


/**
 * A provider with a `#getGroups(element)` method
 * that exposes groups for a diagram element.
 *
 * @param {PropertiesPanel} propertiesPanel
 * @param {Function} translate
 */
export default function SpiffWorkflowPropertiesProvider(propertiesPanel, translate) {

  // API ////////

  /**
   * Return the groups provided for the given element.
   *
   * @param {DiagramElement} element
   *
   * @return {(Object[]) => (Object[])} groups middleware
   */
  this.getGroups = function(element) {

    /**
     * We return a middleware that modifies
     * the existing groups.
     *
     * @param {Object[]} groups
     *
     * @return {Object[]} modified groups
     */
    return function(groups) {
      console.log("Does this crap ever get called?");
      // Add the "spiff" group
      if (is(element, 'bpmn:StartEvent')) {
        groups.push(createSpiffGroup(element, translate));
      }

      return groups;
    };
  };


  // registration ////////

  // Register our custom magic properties provider.
  // Use a lower priority to ensure it is loaded after
  // the basic BPMN properties.
  propertiesPanel.registerProvider(LOW_PRIORITY, this);
}

SpiffWorkflowPropertiesProvider.$inject = [ 'propertiesPanel', 'translate' ];

// Create the custom magic group
function createSpiffGroup(element, translate) {

  // create a group called "Magic properties".
  const spiffGroup = {
    id: 'spiff',
    label: translate('SpiffWorkflow Properties'),
    entries: spellProps(element)
  };

  return spiffGroup;
}
