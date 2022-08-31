import { useService } from 'bpmn-js-properties-panel';
import { TextFieldEntry, SelectEntry } from '@bpmn-io/properties-panel';

const SPIFF_PROP = 'spiffworkflow:calledDecisionId';
// let optionList = [{label: 'hello1', value: "hello1"}, {label: 'hello2', value: "hello3"}]
// let optionList = []
let serviceTaskOperators = [];
const LOW_PRIORITY = 500;

/**
 * A generic properties' editor for text input.
 * Allows you to provide additional SpiffWorkflow extension properties.  Just
 * uses whatever name is provide on the property, and adds or updates it as
 * needed.
 *
 *
    <bpmn:serviceTask id="service_task_one" name="Service Task One">
      <bpmn:extensionElements>
        <spiffworkflow:serviceTaskOperator id="SlackWebhookOperator">
          <spiffworkflow:parameters>
            <spiffworkflow:parameter name="webhook_token" type="string" value="token" />
            <spiffworkflow:parameter name="message" type="string" value="ServiceTask testing" />
            <spiffworkflow:parameter name="channel" type="string" value="#" />
          </spiffworkflow:parameters>
        </spiffworkflow:serviceTaskOperator>
      </bpmn:extensionElements>
    </bpmn:serviceTask>
 *
 * @returns {string|null|*}
 */

function requestServiceTaskOperators(eventBus, element, commandStack) {
  eventBus.fire('spiff.service_tasks.requested', { eventBus });
  eventBus.on('spiff.service_tasks.returned', (event) => {
    if (event.serviceTaskOperators.length > 0) {
      serviceTaskOperators = event.serviceTaskOperators;
      commandStack.execute('element.updateProperties', {
        element,
        properties: {},
      });
    }
  });
}

function getServiceTaskOperatorModdleElement(shapeElement) {
  const { extensionElements } = shapeElement.businessObject;
  if (extensionElements) {
    for (const ee of extensionElements.values) {
      if (ee.$type === 'spiffworkflow:serviceTaskOperator') {
        return ee;
      }
    }
  }
  return null;
}

function getServiceTaskParameterModdleElements(shapeElement) {
  const serviceTaskOperatorModdleElement =
    getServiceTaskOperatorModdleElement(shapeElement);
  if (serviceTaskOperatorModdleElement) {
    const { parameterList } = serviceTaskOperatorModdleElement;
    if (parameterList) {
      return parameterList.parameters;
    }
  }
  return [];
}

export function ServiceTaskOperatorSelect(props) {
  const { element } = props;
  const { commandStack } = props;
  const { translate } = props;
  const { moddle } = props;

  const debounce = useService('debounceInput');
  const eventBus = useService('eventBus');

  if (serviceTaskOperators.length === 0) {
    requestServiceTaskOperators(eventBus, element, commandStack);
  }

  const getPropertyObject = () => {
    const bizObj = element.businessObject;
    if (!bizObj.extensionElements) {
      return null;
    }
    return bizObj.extensionElements.get('values').filter(function (e) {
      return e.$instanceOf(SPIFF_PROP);
    })[0];
  };

  const getValue = () => {
    const serviceTaskOperatorModdleElement =
      getServiceTaskOperatorModdleElement(element);
    if (serviceTaskOperatorModdleElement) {
      return serviceTaskOperatorModdleElement.id;
    }
    return '';
  };

  const setValue = (value) => {
    if (!value) {
      return;
    }

    const serviceTaskOperator = serviceTaskOperators.find(
      (sto) => sto.id === value
    );
    if (!serviceTaskOperator) {
      console.error(`Could not find service task operator with id: ${value}`);
      return;
    }

    const { businessObject } = element;
    let extensions = businessObject.extensionElements;
    if (!extensions) {
      extensions = moddle.create('bpmn:ExtensionElements');
    }

    // let serviceTaskOperatorModdleElement =
    //   getServiceTaskOperatorModdleElement(element);

    const newServiceTaskOperatorModdleElement = moddle.create(
      'spiffworkflow:serviceTaskOperator'
    );
    newServiceTaskOperatorModdleElement.id = value;
    const newParameterList = moddle.create('spiffworkflow:parameters');
    newParameterList.parameters = [];
    serviceTaskOperator.parameters.forEach((stoParameter) => {
      const newParameterModdleElement = moddle.create(
        'spiffworkflow:parameter'
      );
      newParameterModdleElement.name = stoParameter.id;
      newParameterModdleElement.type = stoParameter.type;
      newParameterList.parameters.push(newParameterModdleElement);
    });
    newServiceTaskOperatorModdleElement.parameterList = newParameterList;

    const newExtensionValues = extensions.get('values').filter((extValue) => {
      return extValue.$type !== 'spiffworkflow:serviceTaskOperator';
    });
    newExtensionValues.push(newServiceTaskOperatorModdleElement);
    extensions.values = newExtensionValues;
    businessObject.extensionElements = extensions;

    commandStack.execute('element.updateModdleProperties', {
      element,
      moddleElement: businessObject,
      properties: {},
    });
  };

  const getOptions = () => {
    const optionList = [];
    if (serviceTaskOperators) {
      serviceTaskOperators.forEach((sto) => {
        optionList.push({
          label: sto.id,
          value: sto.id,
        });
      });
    }
    return optionList;
  };

  return SelectEntry({
    id: 'selectOperatorId',
    element,
    label: translate('Operator ID'),
    getValue,
    setValue,
    getOptions,
    debounce,
  });
}

export function ServiceTaskParameterArray(props) {
  const { element, commandStack } = props;

  const serviceTaskParameterModdleElements =
    getServiceTaskParameterModdleElements(element);
  const items = serviceTaskParameterModdleElements.map(
    (serviceTaskParameterModdleElement, index) => {
      const id = `serviceTaskParameter-${index}`;
      return {
        id,
        label: serviceTaskParameterModdleElement.name,
        entries: serviceTaskParameterEntries({
          idPrefix: id,
          element,
          serviceTaskParameterModdleElement,
          commandStack,
        }),
        autoFocusEntry: id,
      };
    }
  );
  return { items };
}

function serviceTaskParameterEntries(props) {
  const { idPrefix, serviceTaskParameterModdleElement, commandStack } = props;
  return [
    {
      idPrefix: `${idPrefix}-parameter`,
      component: ServiceTaskParameterTextField,
      serviceTaskParameterModdleElement,
      commandStack,
    },
  ];
}

function ServiceTaskParameterTextField(props) {
  const { idPrefix, element, serviceTaskParameterModdleElement } = props;

  const debounce = useService('debounceInput');
  const setValue = (value) => {
    serviceTaskParameterModdleElement.value = value;
  };

  const getValue = () => {
    return serviceTaskParameterModdleElement.value;
  };

  return TextFieldEntry({
    element,
    id: `${idPrefix}-textField`,
    getValue,
    setValue,
    debounce,
  });
}
