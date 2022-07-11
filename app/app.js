import BpmnModeler from 'bpmn-js/lib/Modeler';
import diagramXML from '../test/spec/diagram.bpmn';
import { BpmnPropertiesPanelModule, BpmnPropertiesProviderModule } from 'bpmn-js-properties-panel';
import FileSaver from 'file-saver';
import spiffworkflow from './spiffworkflow';

const modelerEl = document.getElementById('modeler');
const panelEl = document.getElementById('panel');
const spiffModdleExtension = require('./spiffworkflow/moddle/spiffworkflow.json');

// create modeler
const bpmnModeler = new BpmnModeler({
  container: modelerEl,
  propertiesPanel: {
    parent: panelEl
  },
  additionalModules: [
    spiffworkflow,
    BpmnPropertiesPanelModule,
    BpmnPropertiesProviderModule,
  ],
  moddleExtensions: {
    spiffworkflowModdle: spiffModdleExtension
  }
});

// import XML
bpmnModeler.importXML(diagramXML).then(() => {});

/**
 * Just a quick bit of code so we can save the XML that is output.
 * Helps for debugging against other libraries (like SpiffWorkflow)
 */
let btn = document.getElementById('downloadButton');
btn.addEventListener('click', event => {
  saveXML();
});
async function saveXML() {
  const { xml } = await bpmnModeler.saveXML({ format: true });
  const blob = new Blob([ xml ], { type: 'text/xml' });
  FileSaver.saveAs(blob, 'diagram.bpmn');
}





