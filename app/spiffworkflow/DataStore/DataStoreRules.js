/**
 * Custom Rules for the DataStore - Rules allow you to prevent an
 * action from happening in the diagram, such as dropping an element
 * where it doesn't belong.
 *
 * Here we don't allow people to move a data object Reference
 * from one parent to another, as we can't move the data objects
 * from one parent to another.
 *
 */
import RuleProvider from 'diagram-js/lib/features/rules/RuleProvider';
import inherits from 'inherits-browser';
import { is } from 'bpmn-js/lib/util/ModelUtil';

export default function DataStoreRules(eventBus) {
  RuleProvider.call(this, eventBus);
}
inherits(DataStoreRules, RuleProvider);
const HIGH_PRIORITY = 1500;

DataStoreRules.prototype.init = function() {
  this.addRule('elements.move', HIGH_PRIORITY,function(context) {
    let elements = context.shapes;
    let target = context.target;
    return canDrop(elements, target);
  });
};

function canDrop(elements, target) {
  for (let element of elements) {
    if (is(element, 'bpmn:DataStoreReference') && element.parent && target) {
      return target === element.parent;
    }
    // Intentionally returning null here to allow other rules to fire.
  }
}

DataStoreRules.prototype.canDrop = canDrop;
DataStoreRules.$inject = [ 'eventBus' ];
