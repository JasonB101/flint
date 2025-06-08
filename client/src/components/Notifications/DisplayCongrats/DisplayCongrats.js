import React, { useMemo } from 'react';
import Fireworks from '../Fireworks/Fireworks';
import Styles from './DisplayCongrats.module.scss';

function DisplayCongrats({ milestone, onClose }) {
  const milestoneMessages = [
    "Kudos on Reaching a Significant Milestone!",
    "Hitting Milestones: Your Journey, Your Win!",
    "Every Milestone is a Stepping Stone to Success!",
    "Your Dedication Paves the Way for New Milestones!",
    "Each Milestone Reached is a Victory Worth Savoring.",
    "Progressing, Achieving, and Conquering Milestones!",
    "Milestone Hunters: Your Persistence Pays Off!",
    "From Milestone to Milestone, You're Thriving!",
    "The Road to Success Is Paved with Milestones Achieved.",
    "With Perseverance, You'll Conquer Bigger Milestones.",
    "Your Consistency Will Usher in Remarkable Milestones.",
    "Hard Work Today, Milestones Tomorrow. Keep Going!"
  ];

  // Use useMemo to prevent recalculating the random message on every render
  const randomMessage = useMemo(() => {
    return milestoneMessages[Math.floor(Math.random() * milestoneMessages.length)];
  }, [milestone?._id]); // Only recalculate if milestone changes

  // Format milestone data for display - use useMemo to prevent recalculation
  const milestoneData = useMemo(() => {
    if (!milestone || !milestone.data) return { period: 'N/A', type: 'N/A', value: 'N/A', date: 'N/A' };
    
    const { data } = milestone;
    const period = data.category === 'day' ? 'Daily' : data.category === 'week' ? 'Weekly' : 'Monthly';
    const type = data.type.charAt(0).toUpperCase() + data.type.slice(1);
    const value = data.type === 'sales' || data.type === 'spent' 
      ? `$${data.value}` 
      : data.value;
    
    return {
      period,
      type,
      value,
      date: data.dateTitle || 'N/A'
    };
  }, [milestone]);

  // Safety check to prevent crashes
  if (!milestone) {
    return null;
  }

  return (
    <div className={Styles['display-congrats-container']}>
      <Fireworks className={Styles['fireworksCanvas']} />
      <button 
        className={Styles['close-button']} 
        onClick={() => {
          console.log('Closing milestone congrats');
          if (onClose) onClose();
        }}
        type="button"
      >
        ×
      </button>
      <h3 className={Styles['message']}>{randomMessage}</h3>
      <div className={Styles['details-container']}>
        <div className={Styles['detail']}>
          <h4>{milestoneData.period} Record</h4>
          <span>{milestoneData.date}</span>
        </div>
        <div className={Styles['detail']}>
          <h4>{milestoneData.type}</h4>
          <span>{milestoneData.value}</span>
        </div>
      </div>
    </div>
  );
}

export default DisplayCongrats;