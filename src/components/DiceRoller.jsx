import { useState } from 'react';
import { Sun, Moon, Dices, Swords, Star } from 'lucide-react';
import './DiceRoller.css';

export default function DiceRoller({ isDM, gameSystem = 'daggerheart' }) {
  const [modifier, setModifier] = useState(0);
  const [numDice, setNumDice] = useState(3); // For Star Wars D6
  const [isRolling, setIsRolling] = useState(false);
  const [currentRoll, setCurrentRoll] = useState(null);
  const [rollHistory, setRollHistory] = useState([]);

  const rollDaggerheart = () => {
    const hopeDie = Math.floor(Math.random() * 12) + 1;
    const fearDie = Math.floor(Math.random() * 12) + 1;
    const total = Math.max(hopeDie, fearDie) + parseInt(modifier);
    const outcome = hopeDie > fearDie ? 'hope' : hopeDie < fearDie ? 'fear' : 'hope'; // Ties go to Hope

    return {
      hopeDie,
      fearDie,
      modifier: parseInt(modifier),
      total,
      outcome,
      timestamp: new Date().toLocaleTimeString(),
      system: 'daggerheart'
    };
  };

  const rollDnD5e = () => {
    const d20 = Math.floor(Math.random() * 20) + 1;
    const total = d20 + parseInt(modifier);
    const isCritical = d20 === 20;
    const isCriticalFail = d20 === 1;

    return {
      d20,
      modifier: parseInt(modifier),
      total,
      isCritical,
      isCriticalFail,
      timestamp: new Date().toLocaleTimeString(),
      system: 'dnd5e'
    };
  };

  const rollStarWarsD6 = () => {
    const dice = parseInt(numDice) || 3;
    const rolls = [];
    const wildDieIndex = 0; // First die is the wild die
    let total = 0;
    let wildDieValue = 0;
    let wildDieExploded = false;

    // Roll all dice
    for (let i = 0; i < dice; i++) {
      let roll = Math.floor(Math.random() * 6) + 1;

      if (i === wildDieIndex) {
        wildDieValue = roll;
        // Wild die: 6 explodes (roll again and add), 1 is complication
        if (roll === 6) {
          wildDieExploded = true;
          const extraRoll = Math.floor(Math.random() * 6) + 1;
          roll += extraRoll;
        }
      }

      rolls.push(roll);
      total += roll;
    }

    total += parseInt(modifier);

    return {
      rolls,
      wildDieValue,
      wildDieExploded,
      modifier: parseInt(modifier),
      total,
      complication: wildDieValue === 1,
      timestamp: new Date().toLocaleTimeString(),
      system: 'starwarsd6'
    };
  };

  const rollDice = () => {
    if (isRolling) return;

    setIsRolling(true);

    // Simulate dice rolling animation
    setTimeout(() => {
      let roll;

      switch (gameSystem) {
        case 'dnd5e':
          roll = rollDnD5e();
          break;
        case 'starwarsd6':
          roll = rollStarWarsD6();
          break;
        case 'daggerheart':
        default:
          roll = rollDaggerheart();
          break;
      }

      setCurrentRoll(roll);
      setRollHistory([roll, ...rollHistory.slice(0, 9)]); // Keep last 10 rolls
      setIsRolling(false);
    }, 1000);
  };

  // Get title based on game system
  const getTitle = () => {
    switch (gameSystem) {
      case 'dnd5e':
        return 'D20 Dice Roller';
      case 'starwarsd6':
        return 'Wild Die Roller';
      case 'daggerheart':
      default:
        return 'Duality Dice Roller';
    }
  };

  return (
    <div className="dice-roller">
      <h3>{getTitle()}</h3>

      <div className="dice-controls">
        {gameSystem === 'starwarsd6' && (
          <div className="modifier-input">
            <label>Dice Pool</label>
            <input
              type="number"
              value={numDice}
              onChange={(e) => setNumDice(e.target.value)}
              min="1"
              max="10"
            />
          </div>
        )}
        <div className="modifier-input">
          <label>Modifier</label>
          <input
            type="number"
            value={modifier}
            onChange={(e) => setModifier(e.target.value)}
            min="-5"
            max="10"
          />
        </div>
        <button
          className={`btn btn-primary ${isDM ? 'dm-mode' : ''}`}
          onClick={rollDice}
          disabled={isRolling}
        >
          <Dices size={20} />
          {isRolling ? 'Rolling...' : 'Roll Dice'}
        </button>
      </div>

      {currentRoll && currentRoll.system === 'daggerheart' && (
        <div className={`roll-result ${currentRoll.outcome}`}>
          <div className="dice-display">
            <div className="die hope-die">
              <Sun size={24} />
              <span className="die-value">{currentRoll.hopeDie}</span>
              <span className="die-label">Hope</span>
            </div>
            <div className="die fear-die">
              <Moon size={24} />
              <span className="die-value">{currentRoll.fearDie}</span>
              <span className="die-label">Fear</span>
            </div>
          </div>

          <div className="roll-total">
            <div className="total-value">{currentRoll.total}</div>
            <div className={`outcome-badge ${currentRoll.outcome}`}>
              {currentRoll.outcome === 'hope' ? (
                <>
                  <Sun size={16} />
                  Hope Result
                </>
              ) : (
                <>
                  <Moon size={16} />
                  Fear Result
                </>
              )}
            </div>
          </div>

          {currentRoll.modifier !== 0 && (
            <div className="modifier-display">
              Base: {Math.max(currentRoll.hopeDie, currentRoll.fearDie)} + Modifier: {currentRoll.modifier}
            </div>
          )}
        </div>
      )}

      {currentRoll && currentRoll.system === 'dnd5e' && (
        <div className={`roll-result ${currentRoll.isCritical ? 'critical' : currentRoll.isCriticalFail ? 'critical-fail' : ''}`}>
          <div className="dice-display">
            <div className="die d20-die">
              <Swords size={24} />
              <span className="die-value">{currentRoll.d20}</span>
              <span className="die-label">d20</span>
            </div>
          </div>

          <div className="roll-total">
            <div className="total-value">{currentRoll.total}</div>
            {currentRoll.isCritical && (
              <div className="outcome-badge critical">
                <Star size={16} />
                Critical Success!
              </div>
            )}
            {currentRoll.isCriticalFail && (
              <div className="outcome-badge critical-fail">
                Critical Fail!
              </div>
            )}
          </div>

          {currentRoll.modifier !== 0 && (
            <div className="modifier-display">
              d20: {currentRoll.d20} + Modifier: {currentRoll.modifier}
            </div>
          )}
        </div>
      )}

      {currentRoll && currentRoll.system === 'starwarsd6' && (
        <div className={`roll-result ${currentRoll.complication ? 'complication' : ''}`}>
          <div className="dice-display star-wars">
            {currentRoll.rolls.map((roll, index) => (
              <div key={index} className={`die d6-die ${index === 0 ? 'wild-die' : ''}`}>
                <Dices size={20} />
                <span className="die-value">{roll}</span>
                {index === 0 && <span className="die-label">Wild Die</span>}
              </div>
            ))}
          </div>

          <div className="roll-total">
            <div className="total-value">{currentRoll.total}</div>
            {currentRoll.wildDieExploded && (
              <div className="outcome-badge success">
                <Star size={16} />
                Wild Die Exploded!
              </div>
            )}
            {currentRoll.complication && (
              <div className="outcome-badge complication">
                Complication!
              </div>
            )}
          </div>

          {currentRoll.modifier !== 0 && (
            <div className="modifier-display">
              Dice Total: {currentRoll.total - currentRoll.modifier} + Modifier: {currentRoll.modifier}
            </div>
          )}
        </div>
      )}

      {rollHistory.length > 0 && (
        <div className="roll-history">
          <h4>Roll History</h4>
          <div className="history-list">
            {rollHistory.map((roll, index) => (
              <div key={index} className="history-item">
                <span className="history-time">{roll.timestamp}</span>
                <span className="history-dice">
                  {roll.system === 'daggerheart' && (
                    <>
                      <Sun size={14} /> {roll.hopeDie} | <Moon size={14} /> {roll.fearDie}
                    </>
                  )}
                  {roll.system === 'dnd5e' && (
                    <>
                      d20: {roll.d20}
                    </>
                  )}
                  {roll.system === 'starwarsd6' && (
                    <>
                      {roll.rolls.length}d6: {roll.rolls.join(', ')}
                    </>
                  )}
                </span>
                <span className={`history-outcome ${roll.outcome || ''} ${roll.isCritical ? 'critical' : ''} ${roll.isCriticalFail ? 'critical-fail' : ''}`}>
                  {roll.total}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
