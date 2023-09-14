import React from 'react';
import Fireworks from '../Fireworks/Fireworks';
import Styles from './DisplayCongrats.module.scss';

function DisplayCongrats() {
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

  const randomMessage = milestoneMessages[Math.floor(Math.random() * milestoneMessages.length)];

  return (
    <div className={Styles['display-congrats-container']}>
      <Fireworks className={Styles['fireworksCanvas']} />
        <h3 className={Styles['message']}>{randomMessage}</h3>
        <div className={Styles['details-container']}>
          <div className={Styles['detail']}>
            <h4>Week</h4>
            <span>1/14/2023 - 1/14/2023</span>
          </div>
          <div className={Styles['detail']}>
            <h4>Listed</h4>
            <span>50</span>
          </div>
      </div>
    </div>
  );
}

export default DisplayCongrats;