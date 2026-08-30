'use client';

import React, { useState, useEffect } from 'react';

export type GridCardProps = {
  id: string;
  element: React.ReactNode;
};

export default function DraggableBottomGrid({ initialCards }: { initialCards: GridCardProps[] }) {
  const [cards, setCards] = useState<GridCardProps[]>(initialCards);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  // Sync with initialCards changes but preserve order
  useEffect(() => {
    setCards((prevCards) => {
      const newCards = prevCards.map(prevCard => {
        const updatedCard = initialCards.find(c => c.id === prevCard.id);
        return updatedCard || prevCard;
      });
      
      initialCards.forEach(c => {
        if (!newCards.find(nc => nc.id === c.id)) {
          newCards.push(c);
        }
      });
      return newCards;
    });
  }, [initialCards]);

  // Load saved order on mount
  useEffect(() => {
    const savedOrder = localStorage.getItem('bottom-grid-order');
    if (savedOrder) {
      try {
        const orderIds = JSON.parse(savedOrder) as string[];
        setCards((currentCards) => {
          const reordered = [];
          const currentMap = new Map(currentCards.map(c => [c.id, c]));
          
          for (const id of orderIds) {
            if (currentMap.has(id)) {
              reordered.push(currentMap.get(id)!);
              currentMap.delete(id);
            }
          }
          currentMap.forEach(c => reordered.push(c));
          return reordered;
        });
      } catch (e) {
        console.error('Failed to parse bottom grid order', e);
      }
    }
  }, []);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, idx: number) => {
    setDraggedIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, idx: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === idx) return;

    const newCards = [...cards];
    const draggedCard = newCards[draggedIdx];
    
    // Swap positions
    newCards.splice(draggedIdx, 1);
    newCards.splice(idx, 0, draggedCard);
    
    setCards(newCards);
    setDraggedIdx(idx); // Update dragged index to new position
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
    localStorage.setItem('bottom-grid-order', JSON.stringify(cards.map(c => c.id)));
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px', marginTop: '32px' }}>
      {cards.map((card, idx) => (
        <div
          key={`${card.id}-${idx}`}
          draggable
          onDragStart={(e) => handleDragStart(e, idx)}
          onDragOver={(e) => handleDragOver(e, idx)}
          onDragEnd={handleDragEnd}
          style={{
            cursor: 'grab',
            opacity: draggedIdx === idx ? 0.4 : 1,
            transform: draggedIdx === idx ? 'scale(1.02)' : 'scale(1)',
            transition: 'transform 0.1s ease, opacity 0.1s ease',
            userSelect: 'none',
            overflow: 'hidden',
            resize: 'horizontal',
            minWidth: '260px'
          }}
          title="ទាញដើម្បីប្តូរទីតាំង (Drag to reorder)"
        >
          {/* We wrap the passed element so it maintains its original styling but is grabbable here */}
          <div style={{ pointerEvents: draggedIdx !== null ? 'none' : 'auto', height: '100%' }}>
            {card.element}
          </div>
        </div>
      ))}
    </div>
  );
}
