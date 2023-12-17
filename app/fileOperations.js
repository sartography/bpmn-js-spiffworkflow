// FileSaver isn't really a dependency, we use it here to provide an example.
// eslint-disable-next-line import/no-extraneous-dependencies
import FileSaver from 'file-saver';

/** ****************************************
 * Below are a few helper methods so we can upload and download files
 * easily from the editor for testing purposes.
 * -----------------------------------------
 */
export default function setupFileOperations(bpmnModeler) {
  /**
   * Just a quick bit of code so we can save the XML that is output.
   * Helps for debugging against other libraries (like SpiffWorkflow)
   */

  const btn = document.getElementById('downloadButton');
  btn.addEventListener('click', (_event) => {
    saveXML();
  });

  async function saveXML() {
    const { xml } = await bpmnModeler.saveXML({ format: true });
    const blob = new Blob([xml], { type: 'text/xml' });
    FileSaver.saveAs(blob, 'diagram.bpmn');
  }

  /**
   * Just a quick bit of code so we can open a local XML file
   * Helps for debugging against other libraries (like SpiffWorkflow)
   */
  const uploadBtn = document.getElementById('uploadButton');
  uploadBtn.addEventListener('click', (_event) => {
    openFile(bpmnModeler);
  });

  // Setup tabs after modeler is initialized
  setupTabs();
}

function clickElem(elem) {
  const eventMouse = document.createEvent('MouseEvents');
  eventMouse.initMouseEvent(
    'click',
    true,
    false,
    window,
    0,
    0,
    0,
    0,
    0,
    false,
    false,
    false,
    false,
    0,
    null
  );
  elem.dispatchEvent(eventMouse);
}

export function openFile(bpmnModeler) {
  const readFile = function readFileCallback(e) {
    const file = e.target.files[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = function onloadCallback(onloadEvent) {
      const contents = onloadEvent.target.result;
      bpmnModeler.importXML(contents);
      document.body.removeChild(fileInput);
    };
    reader.readAsText(file);
  };
  let fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.style.display = 'none';
  fileInput.onchange = readFile;
  document.body.appendChild(fileInput);
  clickElem(fileInput);
}

/** ****************************************
 * Tab functionality
 */
function openTab(event, tabName) {
  
  // Hide all tab contents
  const tabContents = document.querySelectorAll('.tab-content');
  tabContents.forEach(content => {
    content.classList.remove('active');
  });

  // Remove  active class from all tabs
  const tabButtons = document.querySelectorAll('.tab-button');
  tabButtons.forEach(button => {
    button.classList.remove('active');
  });

  // append active tab content class to the clicked tab button
  document.getElementById(tabName).classList.add('active');
  event.currentTarget.classList.add('active');
}

function setupTabs() {
  const tabs = document.querySelectorAll('.tab-button');
  tabs.forEach(tab => {
    tab.addEventListener('click', function (event) {
      openTab(event, this.getAttribute('data-tab-target'));
    });
  });
}

