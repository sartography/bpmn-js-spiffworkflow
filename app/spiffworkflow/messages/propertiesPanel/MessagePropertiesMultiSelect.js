import { html } from 'htm/preact';
import { useService } from 'bpmn-js-properties-panel';
import { getCorrelationPropertiesIDsFiltredByMessageRef, setMessageRefToListofCorrelationProperties } from '../MessageHelpers';

import NiceSelect from 'nice-select2/dist/js/nice-select2';

let niceSelectInputs = {};

export function MessagePropertiesMultiSelect(props) {

  const { element, id, moddle, messageElement, commandStack } = props;

  const modeling = useService('modeling');
  const translate = useService('translate');
  const debounce = useService('debounceInput');

  const setValue = (value) => {
    // Add message ref to the selected correlation properties
    setMessageRefToListofCorrelationProperties(messageElement, value, element, moddle, commandStack)
  };

  const getOptions = () => {
    const correlationProperties = getCorrelationPropertiesIDsFiltredByMessageRef(element.businessObject, moddle, messageElement);
    return correlationProperties;
  };

  function handleSelectChange(e) {
    const selectedOptions = Array.from(e.target.selectedOptions).map(option => option.value);
    setValue(selectedOptions);
  }

  const initializeNiceSelect = () => {
      const selectElement = document.getElementById(`${id}_select`);
      if (!selectElement) return;

      if (niceSelectInputs[id] && niceSelectInputs[id] !== null ) {
        niceSelectInputs[id].destroy();
      }

      const opts = {
        // data: options,
        searchable: true,
        placeholder: 'Select message properties',
        showSelectedItems: true
      };

      niceSelectInputs[id] = new NiceSelect(selectElement, opts);
      updateSelectOptions(selectElement)
      
      
  };

  function updateSelectOptions(selectElement) {
    for (let option of selectElement.options) {
      const matchingOption = options.find(opt => opt.value === option.value);
      if (matchingOption && matchingOption.selected) {
        option.setAttribute('selected', 'true');
      }
    }
  }

  const renderSelect = (options) => {
    return html`
      <select id='${id}_select' class="wipe" multiple onchange=${(e) => handleSelectChange(e)}>
        ${options.length === 0 ? html`
          <option disabled>${translate('No elements found')}</option>
        ` : options.map(option => html`
          <option value=${option.value} ${option.selected ? 'selected="true"' : ''}>${translate(option.text)}</option>
        `)}
      </select>
    `;
  }

  const options = getOptions();

  setTimeout(() => {
    initializeNiceSelect();
  }, 0);

  return html`
    <div class="bio-properties-panel-entry d-grid">
      <label class="bio-properties-panel-label">${translate('Correlation Properties')}</label>
      ${renderSelect(options)}
    </div>
  `;

}
