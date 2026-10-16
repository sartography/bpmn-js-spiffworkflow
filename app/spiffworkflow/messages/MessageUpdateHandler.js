export default class MessageUpdateHandler {
  constructor(moddle, elementRegistry) {
    this.moddle = moddle;
    this.elementRegistry = elementRegistry;
  }

  execute(context) {
    if (context.changes) {
      context.changes.forEach(({ element, property, value }) =>
        this.set(element, property, value)
      );
    } else {
      context.changes = [];
      try {
        context.update((element, property, value) => {
          context.changes.push({
            element,
            property,
            value,
            oldValue: element[property],
          });
          this.set(element, property, value);
        });
      } catch (error) {
        this.revert(context);
        throw error;
      }
    }
    return this.elementRegistry.getAll();
  }

  revert(context) {
    [...context.changes]
      .reverse()
      .forEach(({ element, property, oldValue }) =>
        this.set(element, property, oldValue)
      );
    return this.elementRegistry.getAll();
  }

  set(element, property, value) {
    if (property === 'rootElements' || property === 'correlationKeys') {
      const previous = element[property] || [];
      const next = value || [];
      previous
        .filter((root) => !next.includes(root))
        .forEach((root) => {
          if (root.id) this.moddle.ids.unclaim(root.id);
        });
      next
        .filter((root) => !previous.includes(root))
        .forEach((root) => {
          if (root.id) this.moddle.ids.claim(root.id, root);
        });
    }
    element.set(property, value);
  }
}

MessageUpdateHandler.$inject = ['moddle', 'elementRegistry'];
