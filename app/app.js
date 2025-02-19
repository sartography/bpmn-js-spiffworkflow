import BpmnModeler from 'bpmn-js/lib/Modeler';
import {
  BpmnPropertiesPanelModule,
  BpmnPropertiesProviderModule,
} from 'bpmn-js-properties-panel';
import diagramXML from '../test/spec/bpmn/user_form.bpmn';
import spiffworkflow from './spiffworkflow';
import setupFileOperations from './fileOperations';
import {
  SPIFF_ADD_MESSAGE_REQUESTED_EVENT,
  SPIFF_ADD_MESSAGE_RETURNED_EVENT,
} from './spiffworkflow/constants';

const modelerEl = document.getElementById('modeler');
const panelEl = document.getElementById('panel');
const spiffModdleExtension = require('./spiffworkflow/moddle/spiffworkflow.json');

let bpmnModeler;

/**
 * This provides an example of how to instantiate a BPMN Modeler configured with
 * all the extensions and modifications in this application.
 */
try {
  bpmnModeler = new BpmnModeler({
    container: modelerEl,
    keyboard: { bindTo: document },
    propertiesPanel: {
      parent: panelEl,
    },
    additionalModules: [
      spiffworkflow,
      BpmnPropertiesPanelModule,
      BpmnPropertiesProviderModule,
    ],
    moddleExtensions: {
      spiffworkflowModdle: spiffModdleExtension,
    },
  });
} catch (error) {
  if (error.constructor.name === 'AggregateError') {
    console.log(error.message);
    console.log(error.name);
    console.log(error.errors);
  }
  throw error;
}

/**
 * It is possible to populate certain components using API calls to
 * a backend.  Here we mock out the API call, but this gives you
 * a sense of how things might work.
 *
 */
bpmnModeler.on('spiff.service_tasks.requested', (event) => {
  event.eventBus.fire('spiff.service_tasks.returned', {
    serviceTaskOperators: [
      {
        id: 'Chuck Norris Fact Service',
        parameters: [
          {
            id: 'category',
            type: 'string',
          },
        ],
      },
      {
        id: 'Fact about a Number',
        parameters: [
          {
            id: 'number',
            type: 'integer',
          },
        ],
      },
    ],
  });
});

/**
 * Python Script authoring is best done in some sort of editor
 * here is an example that will connect a large CodeMirror editor
 * to the "Launch Editor" buttons (Script Tasks, and the Pre and Post
 * scripts on all other tasks.
 */
const myCodeMirror = CodeMirror(document.getElementById('code_editor'), {
  lineNumbers: true,
  mode: 'python',
});

const saveCodeBtn = document.getElementById('saveCode');
let launchCodeEvent = null;

bpmnModeler.on('spiff.script.edit', (newEvent) => {
  launchCodeEvent = newEvent;
  myCodeMirror.setValue(launchCodeEvent.script);
  setTimeout(function () {
    myCodeMirror.refresh();
  }, 1); // We have to wait a moment before calling refresh.
  document.getElementById('code_overlay').style.display = 'block';
  document.getElementById('code_editor').focus();
});

saveCodeBtn.addEventListener('click', (_event) => {
  const { scriptType, element } = launchCodeEvent;
  launchCodeEvent.eventBus.fire('spiff.script.update', {
    element,
    scriptType,
    script: myCodeMirror.getValue(),
  });
  document.getElementById('code_overlay').style.display = 'none';
});

/**
 * Like Python Script Editing, it can be nice to edit your Markdown in a
 * good editor as well.
 */
const simplemde = new SimpleMDE({
  element: document.getElementById('markdown_textarea'),
});
let launchMarkdownEvent = null;
bpmnModeler.on('spiff.markdown.edit', (newEvent) => {
  launchMarkdownEvent = newEvent;
  simplemde.value(launchMarkdownEvent.value);
  document.getElementById('markdown_overlay').style.display = 'block';
  document.getElementById('markdown_editor').focus();
});

const saveMarkdownBtn = document.getElementById('saveMarkdown');
saveMarkdownBtn.addEventListener('click', (_event) => {
  const { element } = launchMarkdownEvent;
  launchMarkdownEvent.eventBus.fire('spiff.markdown.update', {
    element,
    value: simplemde.value(),
  });
  document.getElementById('markdown_overlay').style.display = 'none';
});

/**
 * Also can be good to launch an editor for a call activity, or file
 * Not implemented here but imagine opening up a new browser tab
 * and showing a different process or completly different file editor.
 */
bpmnModeler.on('spiff.callactivity.edit', (newEvent) => {
  console.log(
    'Open new window with editor for call activity: ',
    newEvent.processId
  );
});

/**
 * Also can be good to launch an editor for a call activity, or DMN
 * Not implemented here but imagine opening up a new browser tab
 * and showing a different process.
 */
bpmnModeler.on('spiff.file.edit', (newEvent) => {
  console.log('Open new window to edit file: ', newEvent.value);
});

bpmnModeler.on('spiff.dmn.edit', (newEvent) => {
  console.log('Open new window to edit DMN table: ', newEvent.value);
});

/**
 * Also handy to get a list of available files that can be used in a given
 * context, say json files for a form, or a DMN file for a BusinessRuleTask
 */
bpmnModeler.on('spiff.json_schema_files.requested', (event) => {
  event.eventBus.fire('spiff.json_schema_files.returned', {
    options: [
      { label: 'pizza_form.json', value: 'pizza_form.json' },
      { label: 'credit_card_form.json', value: 'credit_card_form.json' },
    ],
  });
});

bpmnModeler.on('spiff.msg_json_schema_files.requested', (event) => {
  console.log('Open new window to edit Message json schema: ');
});

bpmnModeler.on('spiff.dmn_files.requested', (event) => {
  event.eventBus.fire('spiff.dmn_files.returned', {
    options: [
      { label: 'Pizza Special Prices', value: 'pizza_prices' },
      { label: 'Topping Prices', value: 'topping_prices' },
      { label: 'Test Decision', value: 'test_decision' },
    ],
  });
});

bpmnModeler.on('spiff.data_stores.requested', (event) => {
  event.eventBus.fire('spiff.data_stores.returned', {
    options: [
      {
        id: 'countriesID',
        type: 'json',
        name: 'Countries',
        clz: 'JSONDataStore',
      },
      { id: 'foodsID', type: 'kkv', name: 'Foods', clz: 'JSONDataStore' },
    ],
  });
});

bpmnModeler.on('spiff.messages.requested', (event) => {
  event.eventBus.fire('spiff.messages.returned', {
    configuration: {
      messages: [
        {
          identifier: 'basic_message',
          location: 'examples/1-basic-concepts',
          schema: {},
          correlation_properties: [],
        },
        {
          identifier: 'end_of_day_receipts',
          location: 'examples',
          schema: {},
          correlation_properties: [],
        },
        {
          identifier: 'order_ready',
          location: 'examples',
          schema: {},
          correlation_properties: [
            {
              identifier: 'table_number',
              retrieval_expression: 'table_number',
            },
            {
              identifier: 'franchise_id',
              retrieval_expression: 'franchise_id',
            },
          ],
        },
        {
          identifier: 'table_seated',
          location: 'examples',
          schema: {},
          correlation_properties: [
            {
              identifier: 'table_number',
              retrieval_expression: 'table_number-v2',
            },
            {
              identifier: 'franchise_id',
              retrieval_expression: 'franchise_id-v2',
            },
          ],
        },
      ],
    },
  });
});

bpmnModeler.on(SPIFF_ADD_MESSAGE_REQUESTED_EVENT, (event) => {
  event.eventBus.fire(SPIFF_ADD_MESSAGE_RETURNED_EVENT, {
    name: 'test_message1',
    correlation_properties: {
      c1: {
        retrieval_expression: 'c1_expression',
      },
      c2: {
        retrieval_expression: 'c2_expression',
      },
    },
    element: {
      id: 'my_user_task',
    },
  });
});

// As call activites might refernce processes across the system
// it should be possible to search for a paticular call activity.
bpmnModeler.on('spiff.callactivity.search', (event) => {
  event.eventBus.fire('spiff.callactivity.update', {
    value: 'searched_bpmn_id',
    element: event.element,
  });
});

/* This restores unresolved references that camunda removes */

bpmnModeler.on('import.parse.complete', (event) => {
  const refs = event.references.filter(
    (r) =>
      r.property === 'bpmn:loopDataInputRef' ||
      r.property === 'bpmn:loopDataOutputRef'
  );
  const desc = bpmnModeler._moddle.registry.getEffectiveDescriptor(
    'bpmn:ItemAwareElement'
  );
  refs.forEach((ref) => {
    const props = {
      id: ref.id,
      name: ref.id ? typeof ref.name === 'undefined' : ref.name,
    };
    const elem = bpmnModeler._moddle.create(desc, props);
    elem.$parent = ref.element;
    ref.element.set(ref.property, elem);
  });
});

bpmnModeler.on('elements.changed', event => {
  console.log('elements.changed', event);
});


bpmnModeler.importXML(diagramXML).then(() => {});

// This handles the download and upload buttons - it isn't specific to
// the BPMN modeler or these extensions, just a quick way to allow you to
// create and save files, so keeping it outside the example.
setupFileOperations(bpmnModeler);
