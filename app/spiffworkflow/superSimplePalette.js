import { assign } from 'min-dash';
import translate from 'diagram-js/lib/i18n/translate/translate';

// full list as of 2022-09-07
// "hand-tool"
// "lasso-tool"
// "space-tool"
// "global-connect-tool"
// "tool-separator"
// "create.start-event"
// "create.intermediate-event"
// "create.end-event"
// "create.exclusive-gateway"
// "create.task"
// "create.data-object"
// "create.data-store"
// "create.subprocess-expanded"
// "create.participant-expanded"
// "create.group"
// "create.data-input"
// "create.data-output"
const ADVANCED_PALETTE_ENTRIES = [
  "create.intermediate-event",
  "create.data-object",
  "create.data-store",
  "create.subprocess-expanded",
  "create.participant-expanded",
  "create.group",
  "create.data-input",
  "create.data-output",
]

/**
 * Add data inputs and data outputs to the panel.
 */
export default function SuperSimplePalette(palette, create, elementFactory,) {
  this._create = create;
  this._elementFactory = elementFactory;
  palette.registerProvider(this);
}

SuperSimplePalette.$inject = [
  'palette',
  'create',
  'elementFactory'
];

SuperSimplePalette.prototype.getPaletteEntries = function(props) {
  return function(entries) {
    ADVANCED_PALETTE_ENTRIES.forEach((entryName) => {
      delete entries[entryName]
    })
    return entries
  }
};

