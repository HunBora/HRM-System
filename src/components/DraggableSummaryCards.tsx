'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export type SummaryCardProps = {
  id: string;
  title: string;
  amount: string;
  gradient: string;
  icon: React.ReactNode;
  href?: string;
};

export default function DraggableSummaryCards({ initialCards }: { initialCards: SummaryCardProps[] }) {
  const router = useRouter();
  const [cards, setCards] = useState<SummaryCardProps[]>(initialCards);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Sync with initialCards changes (e.g. amount updates) but preserve order
  useEffect(() => {
    setCards((prevCards) => {
      // Map existing order to new props
      const newCards = prevCards.map(prevCard => {
        const updatedCard = initialCards.find(c => c.id === prevCard.id);
        return updatedCard || prevCard;
      });
      
      // Add any entirely new cards that weren't in prevCards
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
    const savedOrder = localStorage.getItem('summary-card-order');
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
          // Push any remaining (new) cards
          currentMap.forEach(c => reordered.push(c));
          return reordered;
        });
      } catch (e) {
        console.error('Failed to parse summary card order', e);
      }
    }
  }, []);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, idx: number) => {
    setIsDragging(true);
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
    setTimeout(() => setIsDragging(false), 100);
    setDraggedIdx(null);
    localStorage.setItem('summary-card-order', JSON.stringify(cards.map(c => c.id)));
  };

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
      {cards.map((card, idx) => (
        <div
          key={`${card.id}-${idx}`}
          draggable
          onDragStart={(e) => handleDragStart(e, idx)}
          onDragOver={(e) => handleDragOver(e, idx)}
          onDragEnd={handleDragEnd}
          onClick={() => {
            if (!isDragging && card.href) {
              router.push(card.href);
            }
          }}
          style={{
            flex: '0 1 auto',
            width: '280px', // Default starting width
            minWidth: '200px',
            maxWidth: '100%',
            resize: 'horizontal', // Allows the user to resize width manually!
            background: card.gradient,
            padding: '16px 22px',
            borderRadius: '14px',
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.15)',
            cursor: card.href ? 'pointer' : 'grab',
            opacity: draggedIdx === idx ? 0.4 : 1,
            transform: draggedIdx === idx ? 'scale(1.02)' : 'scale(1)',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            userSelect: 'none',
          }}
          onMouseEnter={(e) => {
            if (card.href && draggedIdx !== idx) {
              e.currentTarget.style.transform = 'scale(1.03) translateY(-3px)';
              e.currentTarget.style.boxShadow = '0 12px 25px -4px rgba(0, 0, 0, 0.3)';
            }
          }}
          onMouseLeave={(e) => {
            if (draggedIdx !== idx) {
              e.currentTarget.style.transform = 'scale(1) translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.15)';
            }
          }}
          title={card.href ? `ចុចដើម្បីចូលទៅកាន់ទំព័រ (Click to open) • អូសដើម្បីប្តូរទីតាំង` : `អូសដើម្បីប្តូរទីតាំង (Drag to reorder)`}
        >
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', pointerEvents: 'auto' }}>
            <div>
              <div className="kh-text" style={{ fontSize: '0.9rem', marginBottom: '8px', opacity: 0.95, display: 'flex', alignItems: 'center', gap: '6px' }}>
                {card.title}
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.02em' }}>{card.amount}</div>
            </div>
            <div
              className="interactive-icon"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.22)',
                padding: '10px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '42px',
                height: '42px',
                flexShrink: 0,
                position: 'relative',
                backdropFilter: 'blur(4px)',
              }}
            >
              {card.icon}
              {card.href && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '-6px',
                    backgroundColor: 'rgba(0, 0, 0, 0.45)',
                    border: '1px solid rgba(255, 255, 255, 0.6)',
                    borderRadius: '50%',
                    width: '18px',
                    height: '18px',
                    fontSize: '0.65rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    fontWeight: 'bold',
                  }}
                >
                  ↗
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
