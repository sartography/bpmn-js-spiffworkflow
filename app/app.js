import BpmnModeler from 'bpmn-js/lib/Modeler';
import diagramXML from '../resources/diagram.bpmn';
import { BpmnPropertiesPanelModule, BpmnPropertiesProviderModule } from 'bpmn-js-properties-panel';
import inputOutput from './spiffworkflow/InputOutput';
import SpiffWorkflowPropertiesProvider from './spiffworkflow/PropertiesPanel';
import FileSaver from 'file-saver'; // For file downloads.

// Examples for extending the xml language can be found at
//  https://github.com/camunda/camunda-bpmn-moddle/blob/master/resources/camunda.json
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
    inputOutput,
    SpiffWorkflowPropertiesProvider,
    BpmnPropertiesPanelModule,
    BpmnPropertiesProviderModule,
  ],
  moddleExtensions: {
    spiffworkflow: spiffModdleExtension
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





