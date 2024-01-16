const LOW_PRIORITY = 800;

export default function PropertiesPanelProvider(propertiesPanel, eventBus) {
  let el;

  // eventBus.on('propertiesPanel.providersChanged', function (event) {
  //     console.log('------------------- propertiesPanel.providersChanged', event);
  // });

  // eventBus.on('propertiesPanel.getProviders', function (event) {
  //     console.log('------------------- propertiesPanel.getProviders', event);
  // });

  // eventBus.on('propertiesPanel.setLayout', function (event) {
  //     console.log('------------------- propertiesPanel.setLayout', event);
  // });

  // eventBus.on('propertiesPanel.layoutChanged', function (event) {
  //     console.log('------------------- propertiesPanel.layoutChanged', event);
  // });

  this.getGroups = function (element) {
    return function (groups) {
      // Only render when : el is undefined (editor onload state) or user selects new element or user changes the type of a selected element
      if (!el || element.id !== el.id || (element.type !== el.type && element.id === el.id)) {
        el = {
          id: element.id,
          type: element.type
        }
        this.render(groups);
      }
      return groups;
    }.bind(this);
  };

  propertiesPanel.registerProvider(LOW_PRIORITY, this);
}

PropertiesPanelProvider.$inject = ['propertiesPanel', 'eventBus'];

PropertiesPanelProvider.prototype.render = function (groups) {

  setTimeout(() => {
    const propertiesPanelContainer = document.querySelector('.bio-properties-panel-container');
    if (!propertiesPanelContainer) return;

    // Within that big container, find the part where we can scroll
    const scrollContainer = propertiesPanelContainer.querySelector('.bio-properties-panel-scroll-container');
    if (!scrollContainer) return;

    // Functions : 

    // This function makes the groups able to open and close.
    function makeGroupCollapsible(group) {
      const header = group.querySelector('.bio-properties-panel-group-header');
      const entries = group.querySelector('.bio-properties-panel-group-entries');
      const arrow = header.querySelector('svg');

      let isFirstClick = true;

      if (header && entries && arrow) {
        header.classList.add('open');
        entries.classList.add('open');
        arrow.classList.add('bio-properties-panel-arrow-down');
        arrow.classList.remove('bio-properties-panel-arrow-right');
    
        // Handles the first click, to prevent the bpmn js library from handling it instead
        header.addEventListener('click', function() {
          if (isFirstClick) {
            header.click();
            isFirstClick = false;
          }
        });
      }
    }

    // This function decides what to show based on which tab is clicked.
    function updateTabContent(activeTab) {
      const allGroups = scrollContainer.querySelectorAll('.bio-properties-panel-group');
      allGroups.forEach(group => group.style.display = 'none'); // Hide everything first.

      groups.forEach(group => {
        const groupElement = scrollContainer.querySelector(`[data-group-id="group-${group.id}"]`);
        if (groupElement) {
          // If we're on the "General" tab, show the general groups and any group that's set as default.
          if (activeTab.dataset.tab === 'general' && (group.id === 'general' || group.isDefault)) {
            groupElement.style.display = '';
            if (group.isDefault) {
              makeGroupCollapsible(groupElement);
            }
          } else if (activeTab.dataset.tab === 'advanced' && group.id !== 'general' && !group.isDefault) {
            groupElement.style.display = '';
          }
        }
      });
    }

    // Function to always start with the 'General' tab opened
    function resetTabsToShowGeneral() {
      const generalTab = scrollContainer.querySelector('li[data-tab="general"]');
      const advancedTab = scrollContainer.querySelector('li[data-tab="advanced"]');

      if (generalTab && advancedTab) {
        generalTab.classList.add('active');
        advancedTab.classList.remove('active');
        updateTabContent(generalTab);
      }
    }

    // Add a click event to each tab to change what's shown
    document.querySelectorAll('.tabs li').forEach(tab => {
      tab.addEventListener('click', function (event) {
        document.querySelectorAll('.tabs li').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        updateTabContent(tab);
      });
    });

    // Create the tabs if they don't exist yet.
    if (!scrollContainer.querySelector('.tabs')) {
      const tabsHeader = document.createElement('ul');
      tabsHeader.className = 'tabs property-tabs';

      const generalTab = document.createElement('li');
      generalTab.textContent = 'General';
      generalTab.dataset.tab = 'general';
      generalTab.className = 'active';
      tabsHeader.appendChild(generalTab);

      const advancedTab = document.createElement('li');
      advancedTab.textContent = 'Advanced';
      advancedTab.dataset.tab = 'advanced';
      tabsHeader.appendChild(advancedTab);

      scrollContainer.insertBefore(tabsHeader, scrollContainer.firstChild);
    }

    // Make sure each tab can do its thing when clicked.
    const tabs = scrollContainer.querySelectorAll('.tabs li');
    tabs.forEach(tab => {
      if (!tab.dataset.listenerAttached) {
        tab.addEventListener('click', function (event) {
          tabs.forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          updateTabContent(tab);
        });
        tab.dataset.listenerAttached = 'true'; // This is just to make sure we don't add the same event more than once.
      }
    });

    // When we first load, show the right tab and its contents.
    const activeTab = document.querySelector('.tabs li.active');
    if (activeTab) {
      updateTabContent(activeTab);
    }

    resetTabsToShowGeneral();
  }, 0);
}