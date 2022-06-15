import TestContainer from 'mocha-test-container-support';
import Modeler from 'bpmn-js/lib/Modeler';
import spiffworkflow from '../../app/spiffworkflow/InputOutput';
import coreModule from 'bpmn-js/lib/core';
import createModule from 'diagram-js/lib/features/create';
import modelingModule from 'bpmn-js/lib/features/modeling';
import paletteModule from 'bpmn-js/lib/features/palette';

import {
  setBpmnJS,
  clearBpmnJS,
} from 'bpmn-js/test/helper';
import {
  query as domQuery,
  queryAll as domQueryAll
} from 'min-dom';

describe('BPMN Input / Output', function() {

  let container;
  let modeler;

  beforeEach(function() {
    container = TestContainer.get(this);
  });

  function createModeler(xml) {

    clearBpmnJS();
    let testModules = [
      coreModule,
      createModule,
      modelingModule,
      paletteModule
    ];

    modeler = new Modeler({
      container: container,
      modules: testModules,
      propertiesPanel: {
        parent: container,
      },
      additionalModules: [ spiffworkflow ]
    });

    setBpmnJS(modeler);

    return modeler.importXML(xml).then(function(result) {
      return { error: null, warnings: result.warnings, modeler: modeler };
    }).catch(function(err) {
      return { error: err, warnings: err.warnings, modeler: modeler };
    });
  }

  it('should open diagram', function() {
    let xml = require('./diagram.bpmn');
    return createModeler(xml).then(function(result) {
      expect(result.error).not.to.exist;
    });
  });


  it('should have a data input and data output in the properties panel', function() {
    let xml = require('./diagram.bpmn');
    return createModeler(xml).then(function(result) {
      expect(result.error).not.to.exist;
      var paletteElement = domQuery('.djs-palette', container);
      var entries = domQueryAll('.entry', paletteElement);
      expect(entries[11].title).to.equals('Create DataInput');
      expect(entries[12].title).to.equals('Create DataOutput');
    });
  });
});
