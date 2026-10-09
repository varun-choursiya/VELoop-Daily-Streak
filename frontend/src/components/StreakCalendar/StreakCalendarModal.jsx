import { useEffect } from "react";
import { X, Flame, Check, Lock, Gift, Award, Clock3, ShieldCheck } from "lucide-react";
import styles from "./StreakCalendarModal.module.css";
import vesCoin from "../../assets/VEs_Coin.png";
import day4Asset from "../../assets/Day-4.png";
import day5Asset from "../../assets/Day-5.png";
import day7Asset from "../../assets/Day-7.png";

export default function StreakCalendarModal({ isOpen, onClose, data }) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !data) return null;

  const { streak, rewards } = data;

  const getAsset = (day) => {
    if (day === 4) return day4Asset;
    if (day === 5) return day5Asset;
    if (day === 7) return day7Asset;
    return vesCoin;
  };

  return (
    <div
      className={styles.backdrop}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="calendar-modal-title"
    >
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.ambientGlow} aria-hidden="true" />

        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.flameIconWrap}>
              <Flame size={20} className={styles.flameIcon} />
            </div>
            <div>
              <h2 id="calendar-modal-title" className={styles.title}>
                Streak Calendar
              </h2>
              <span className={styles.subtitle}>
                {streak?.currentStreak || 0} Day Streak • Day {streak?.currentDay || 1} of 7
              </span>
            </div>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* 7-Day Calendar Grid */}
        <div className={styles.daysGrid}>
          {rewards?.map((r) => {
            const isClaimed = r.status === "CLAIMED";
            const isCurrent = r.day === streak?.currentDay;
            const isDay7 = r.day === 7;

            return (
              <div
                key={r.day}
                className={`
                  ${styles.dayCell}
                  ${isClaimed ? styles.cellClaimed : ""}
                  ${isCurrent ? styles.cellCurrent : ""}
                  ${isDay7 ? styles.cellDay7 : ""}
                `}
              >
                <div className={styles.cellDayHeader}>
                  <span className={styles.cellDayNumber}>D{r.day}</span>
                  {isClaimed && <Check size={12} strokeWidth={3} className={styles.cellCheck} />}
                  {isCurrent && !isClaimed && <span className={styles.cellTodayBadge}>TODAY</span>}
                </div>

                <div className={styles.cellArtWrap}>
                  <img src={getAsset(r.day)} alt="" className={styles.cellArtImg} />
                </div>

                <div className={styles.cellRewardText}>
                  <strong>
                    {r.reward?.currency === "INR" ? "₹" : "+"}
                    {r.reward?.amount}
                  </strong>
                  <span>{r.reward?.currency === "INR" ? "Amazon" : "VES"}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Rules & Guidelines */}
        <div className={styles.rulesCard}>
          <h3 className={styles.rulesTitle}>Streak Guidelines</h3>
          <ul className={styles.rulesList}>
            <li>
              <Clock3 size={15} color="#fbbf24" />
              <span>Check in every 24 hours to keep your streak multiplier active.</span>
            </li>
            <li>
              <Gift size={15} color="#c084fc" />
              <span>Unlock guaranteed ₹1 and ₹2 Amazon vouchers on Days 4 & 5.</span>
            </li>
            <li>
              <Award size={15} color="#fbbf24" />
              <span>Achieve Day 7 to earn the ₹5 Ultimate Amazon Gift Card!</span>
            </li>
            <li>
              <ShieldCheck size={15} color="#10b981" />
              <span>All claims and wallet balances are cryptographically server-verified.</span>
            </li>
          </ul>
        </div>

        <button type="button" className={styles.confirmBtn} onClick={onClose}>
          Got It
        </button>
      </div>
    </div>
  );
}
