import BpmnModeler from 'bpmn-js/lib/Modeler';
import diagramXML from '../test/spec/bpmn/diagram.bpmn';
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


/** ****************************************
 * Below are a few helper methods so we can upload and download files
 * easily from the editor for testing purposes.
 * -----------------------------------------
 */

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

/**
 * Just a quick bit of code so we can open a local XML file
 * Helps for debugging against other libraries (like SpiffWorkflow)
 */
let uploadBtn = document.getElementById('uploadButton');
uploadBtn.addEventListener('click', event => {
  openFile(displayFile);
});

function clickElem(elem) {
  var eventMouse = document.createEvent('MouseEvents');
  eventMouse.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
  elem.dispatchEvent(eventMouse);
}

function displayFile(contents) {
  bpmnModeler.importXML(contents).then(() => {});
}

export function openFile(func) {
  let readFile = function(e) {
    var file = e.target.files[0];
    if (!file) {
      return;
    }
    var reader = new FileReader();
    reader.onload = function(e) {
      var contents = e.target.result;
      fileInput.func(contents);
      document.body.removeChild(fileInput);
    };
    reader.readAsText(file);
  };
  let fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.style.display = 'none';
  fileInput.onchange = readFile;
  fileInput.func = func;
  document.body.appendChild(fileInput);
  clickElem(fileInput);
}

