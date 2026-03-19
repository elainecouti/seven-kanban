/* Seven Midas Kanban — Drag & Drop */

function initSortable() {
  COLUMNS.forEach(function(col) {
    const el = document.getElementById('col-' + col.key);
    if (!el) return;

    new Sortable(el, {
      group: 'kanban',
      animation: 200,
      ghostClass: 'card-ghost',
      chosenClass: 'card-chosen',
      dragClass: 'card-drag',
      delay: 100,
      delayOnTouchOnly: true,
      touchStartThreshold: 5,
      onEnd: function(evt) {
        const cardId = evt.item.dataset.id;
        const newColumn = evt.to.dataset.column;
        const newIndex = evt.newIndex;

        // Calculate new position
        const siblings = Array.from(evt.to.children);
        let newPos;
        if (siblings.length <= 1) {
          newPos = 10;
        } else if (newIndex === 0) {
          const nextId = siblings[1] ? siblings[1].dataset.id : null;
          const nextCard = cards.find(c => c.id === nextId);
          newPos = nextCard ? nextCard.position - 10 : 10;
        } else if (newIndex >= siblings.length - 1) {
          const prevId = siblings[siblings.length - 2] ? siblings[siblings.length - 2].dataset.id : null;
          const prevCard = cards.find(c => c.id === prevId);
          newPos = prevCard ? prevCard.position + 10 : newIndex * 10;
        } else {
          const prevId = siblings[newIndex - 1] ? siblings[newIndex - 1].dataset.id : null;
          const nextId = siblings[newIndex + 1] ? siblings[newIndex + 1].dataset.id : null;
          const prevCard = cards.find(c => c.id === prevId);
          const nextCard = cards.find(c => c.id === nextId);
          if (prevCard && nextCard) {
            newPos = Math.round((prevCard.position + nextCard.position) / 2);
          } else {
            newPos = newIndex * 10;
          }
        }

        // Update local state
        const card = cards.find(c => c.id === cardId);
        if (card) {
          card.column_key = newColumn;
          card.position = newPos;
        }

        // Persist
        moveCard(cardId, newColumn, newPos).catch(function() {
          // Revert on error
          loadBoard();
        });
      }
    });
  });
}
