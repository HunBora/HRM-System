'use client';

import { useState, useEffect } from 'react';

export default function TimeSheetCalculator() {
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [displayValue, setDisplayValue] = useState('');
  const [decimalHours, setDecimalHours] = useState<string>('');

  useEffect(() => {
    if (start && end) {
      const [startHour, startMin] = start.split(':').map(Number);
      const [endHour, endMin] = end.split(':').map(Number);

      const startMs = startHour * 60 * 60 * 1000 + startMin * 60 * 1000;
      let endMs = endHour * 60 * 60 * 1000 + endMin * 60 * 1000;

      // If end time is before start time, assume it crosses midnight
      if (endMs < startMs) {
        endMs += 24 * 60 * 60 * 1000;
      }

      const diffMs = endMs - startMs;
      const totalMinutes = Math.floor(diffMs / (60 * 1000));
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;

      if (hours > 0 && minutes > 0) {
        setDisplayValue(`${hours}ម៉ោង ${minutes}នាទី`);
      } else if (hours > 0) {
        setDisplayValue(`${hours}ម៉ោង`);
      } else if (minutes > 0) {
        setDisplayValue(`${minutes}នាទី`);
      } else {
        setDisplayValue('0ម៉ោង');
      }

      const dec = (totalMinutes / 60).toFixed(2);
      setDecimalHours(dec);
    } else {
      setDisplayValue('');
      setDecimalHours('');
    }
  }, [start, end]);

  return (
    <>
      <div>
        <label className="kh-text" style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>ចាប់ផ្តើម (Start)</label>
        <input 
          type="time" 
          name="tsStart" 
          className="input-field kh-text" 
          value={start}
          onChange={(e) => setStart(e.target.value)}
        />
      </div>
      <div>
        <label className="kh-text" style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>បញ្ចប់ (End)</label>
        <input 
          type="time" 
          name="tsEnd" 
          className="input-field kh-text" 
          value={end}
          onChange={(e) => setEnd(e.target.value)}
        />
      </div>
      <div>
        <label className="kh-text" style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>ម៉ោងសរុប (Total Hours)</label>
        {/* Hidden input to submit the actual decimal float value to the server */}
        <input type="hidden" name="tsTotalHours" value={decimalHours} />
        {/* Readonly text input for display only */}
        <input 
          type="text" 
          className="input-field kh-text" 
          placeholder="0ម៉ោង 0នាទី" 
          value={displayValue}
          readOnly
          style={{ backgroundColor: 'var(--surface-color)', cursor: 'not-allowed' }}
        />
      </div>
    </>
  );
}
