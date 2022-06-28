import TestContainer from 'mocha-test-container-support';
import Modeler from 'bpmn-js/lib/Modeler';
import spiffworkflow from '../../app/spiffworkflow/InputOutput';
import coreModule from 'bpmn-js/lib/core';
import createModule from 'diagram-js/lib/features/create';
import modelingModule from 'bpmn-js/lib/features/modeling';
import paletteModule from 'bpmn-js/lib/features/palette';
const spiffModdleExtension = require('../../app/spiffworkflow/moddle/spiffworkflow.json');
import { BpmnPropertiesPanelModule, BpmnPropertiesProviderModule } from 'bpmn-js-properties-panel';

import {
  setBpmnJS,
  clearBpmnJS,
} from 'bpmn-js/test/helper';
import {
  query as domQuery,
  queryAll as domQueryAll
} from 'min-dom';
import SpiffWorkflowPropertiesProvider from '../../app/spiffworkflow/PropertiesPanel/SpiffWorkflowPropertiesProvider';

describe('Properties Panel Script Tasks', function() {

  let container;
  let modelerContainer;
  let propertiesContainer;
  let modeler;

  beforeEach(function() {
    container = TestContainer.get(this);
    modelerContainer = document.createElement('div');
    modelerContainer.classList.add('modeler-container');
    container.appendChild(modelerContainer);

    propertiesContainer = document.createElement('div');
    propertiesContainer.classList.add('properties-container');
    container.appendChild(propertiesContainer);

  });

  // Fixme - this is duplicated from the other spec
  function createModeler(xml) {

    clearBpmnJS();
    let testModules = [
      coreModule,
      createModule,
      modelingModule,
      paletteModule
    ];

    modeler = new Modeler({
      container: modelerContainer,
      modules: testModules,
      propertiesPanel: {
        parent: propertiesContainer,
      },
      additionalModules: [
        spiffworkflow,
        BpmnPropertiesPanelModule,
        BpmnPropertiesProviderModule,
        SpiffWorkflowPropertiesProvider ]
    });

    setBpmnJS(modeler);

    return modeler.importXML(xml).then(function(result) {
      return { error: null, warnings: result.warnings, modeler: modeler };
    }).catch(function(err) {
      return { error: err, warnings: err.warnings, modeler: modeler };
    });
  }

  it('should allow you to add a script to a script task', function() {
    let xml = require('./diagram.bpmn').default;
    return createModeler(xml).then(function(result) {
      expect(result.error).not.to.exist;
      // a. There should be a properties panel
      expect(domQuery('.bio-properties-panel', propertiesContainer)).to.exist;

      // 1. Select the script task 'my_script_task'

      // 2. Assure properties panel has 'SpiffWorkflow Properties'
      // 3. Assere there is a text input called 'script'
      // 4. Adding text to that script input updates the script in the bpmn.
    });
  });
});
