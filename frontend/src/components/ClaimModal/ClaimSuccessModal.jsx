import { useEffect } from "react";
import { CheckCircle2, Sparkles, X, Gift, ArrowRight } from "lucide-react";
import styles from "./ClaimSuccessModal.module.css";
import vesCoin from "../../assets/VEs_Coin.png";
import day4Asset from "../../assets/Day-4.png";
import day5Asset from "../../assets/Day-5.png";
import day7Asset from "../../assets/Day-7.png";

export default function ClaimSuccessModal({ reward, streakDay, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!reward) return null;

  const isGiftCard = reward.type === "AMAZON_GIFT_CARD" || reward.currency === "INR";
  const isDay7 = streakDay === 7;

  const getRewardImage = () => {
    if (streakDay === 4) return day4Asset;
    if (streakDay === 5) return day5Asset;
    if (streakDay === 7) return day7Asset;
    return vesCoin;
  };

  return (
    <div className={styles.backdrop} onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="claim-success-title">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Ambient Glows */}
        <div className={`${styles.glow} ${isDay7 ? styles.goldGlow : styles.violetGlow}`} />

        <button className={styles.closeBtn} onClick={onClose} aria-label="Close dialog">
          <X size={18} />
        </button>

        <div className={styles.badgeRow}>
          <span className={styles.tag}>
            <Sparkles size={14} />
            DAY {streakDay} CLAIMED
          </span>
        </div>

        <div className={styles.iconContainer}>
          <div className={styles.iconCircle}>
            <img src={getRewardImage()} alt="" className={styles.rewardImg} />
          </div>
          <div className={styles.checkCircle}>
            <CheckCircle2 size={24} color="#10b981" />
          </div>
        </div>

        <h2 id="claim-success-title" className={isDay7 ? styles.goldText : ""}>
          Reward Successfully Claimed!
        </h2>

        <div className={styles.rewardBox}>
          <span className={styles.rewardAmount}>
            {isGiftCard ? `₹${reward.amount}` : `+${reward.amount} VES`}
          </span>
          <span className={styles.rewardSubtitle}>
            {isGiftCard ? "Amazon Gift Card Voucher Credited" : "Added directly to your VES Wallet"}
          </span>
        </div>

        <p className={styles.description}>
          Your streak count has increased! Return tomorrow to claim the Day {Math.min(7, streakDay + 1)} reward.
        </p>

        <button className={styles.actionBtn} onClick={onClose}>
          <span>Continue Streak</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
