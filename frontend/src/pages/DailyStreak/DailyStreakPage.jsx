import { useCallback, useEffect, useState, useRef } from "react";
import {
  UserRound,
  Check,
  Clock3,
  Gift,
  History,
  Lock,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Flame,
  ArrowRight,
  Wallet as WalletIcon,
  ChevronDown,
  AlertTriangle,
  Award
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  getHistory,
  getStreak,
  getWallet,
  claimStreak
} from "../../services/streakApi.js";

import styles from "./DailyStreak.module.css";
import WalletModal from "../../components/Wallet/WalletModal.jsx";
import ClaimSuccessModal from "../../components/ClaimModal/ClaimSuccessModal.jsx";
import ConfettiCanvas from "../../components/Confetti/ConfettiCanvas.jsx";

import day4Asset from "../../assets/Day-4.png";
import day5Asset from "../../assets/Day-5.png";
import day7Asset from "../../assets/Day-7.png";
import vesCoin from "../../assets/VEs_Coin.png";

function formatReward(reward) {
  if (!reward) return "—";
  return reward.currency === "INR" ? `₹${reward.amount}` : `+${reward.amount} VES`;
}

function formatDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  }).format(new Date(value));
}

function Countdown({ nextClaimAt, serverTime, onDone }) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!nextClaimAt || !serverTime) {
      setRemaining(0);
      return undefined;
    }

    const serverOffset = new Date(serverTime).getTime() - Date.now();
    let finished = false;

    const tick = () => {
      const left = Math.max(0, new Date(nextClaimAt).getTime() - (Date.now() + serverOffset));
      setRemaining(left);

      if (left <= 0 && !finished) {
        finished = true;
        onDone?.();
      }
    };

    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [nextClaimAt, serverTime, onDone]);

  const totalSeconds = Math.floor(remaining / 1000);
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");

  return (
    <span className={styles.countdownValue}>
      <span>{hours}</span>:<span>{minutes}</span>:<span>{seconds}</span>
    </span>
  );
}

export default function DailyStreakPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [data, setData] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState("");
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [walletModalOpen, setWalletModalOpen] = useState(false);

  // Claim Success Modal & Celebration
  const [claimedReward, setClaimedReward] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const menuRef = useRef(null);

  // Close account menu on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setAccountMenuOpen(false);
      }
    }
    if (accountMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [accountMenuOpen]);

  const load = useCallback(async ({ quiet = false } = {}) => {
    try {
      if (!quiet) setError("");

      const [streakResponse, walletResponse, historyResponse] = await Promise.all([
        getStreak(),
        getWallet(),
        getHistory()
      ]);

      const streakData = streakResponse.data;
      setData(streakData);
      setWallet(streakData.wallet || walletResponse.data.wallet || null);
      setHistory(historyResponse.data.history || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load your streak information.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleClaim() {
    if (claiming) return;

    setClaiming(true);
    setError("");

    try {
      const response = await claimStreak();
      const claimResult = response.data;

      // Real backend confirmation verified!
      setClaimedReward({
        reward: claimResult.reward,
        day: claimResult.reward?.day || data?.streak?.currentDay || 1
      });
      setShowConfetti(true);

      // Refresh real balances quietly in background
      await load({ quiet: true });
    } catch (err) {
      setError(err.response?.data?.message || "Unable to process your reward.");
      await load({ quiet: true });
    } finally {
      setClaiming(false);
    }
  }

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const handleTimerDone = useCallback(() => load({ quiet: true }), [load]);

  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loadingBox}>
          <div className={styles.loadingLogo}>
            <Sparkles size={28} className={styles.pulseIcon} />
          </div>
          <strong className={styles.loadingTitle}>VELOOP REWARDS</strong>
          <span className={styles.loadingSubtitle}>Verifying your streak & balance...</span>
          <div className={styles.loadingProgressBar}>
            <div className={styles.loadingProgressFill} />
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={styles.page}>
        <div className={styles.errorContainer}>
          <div className={styles.errorCard}>
            <ShieldCheck size={36} color="#f43f5e" />
            <h2>Unable to Load Streak</h2>
            <p>{error || "We couldn't connect to the rewards server. Please check your connection and retry."}</p>
            <button className={styles.retryBtn} onClick={() => load()}>
              <RefreshCw size={16} />
              <span>Retry</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const completed = data.streak.status === "COMPLETED";
  const progressPercent = Math.min(100, Math.round((data.streak.checkedIn / data.streak.totalRewards) * 100));
  const displayUser = user || data.user;

  return (
    <div className={styles.page}>
      {/* Confetti Particle System */}
      <ConfettiCanvas active={showConfetti} onComplete={() => setShowConfetti(false)} />

      {/* Claim Success Celebration Modal */}
      {claimedReward && (
        <ClaimSuccessModal
          reward={claimedReward.reward}
          streakDay={claimedReward.day}
          onClose={() => setClaimedReward(null)}
        />
      )}

      {/* Full-featured Wallet Modal */}
      <WalletModal
        isOpen={walletModalOpen}
        onClose={() => setWalletModalOpen(false)}
        wallet={wallet}
        onRefresh={() => load({ quiet: true })}
      />

      {/* Background Ambient Glow Orbs */}
      <div className={`${styles.ambientGlow} ${styles.glowViolet}`} aria-hidden="true" />
      <div className={`${styles.ambientGlow} ${styles.glowCyan}`} aria-hidden="true" />

      {/* TOPBAR / HEADER NAVIGATION */}
      <header className={styles.navbar}>
        <div className={styles.navbarContainer}>
          {/* Brand Mark */}
          <div className={styles.brandGroup}>
            <div className={styles.brandLogo}>V</div>
            <div className={styles.brandDetails}>
              <span className={styles.brandTitle}>VELOOP</span>
              <span className={styles.brandBadge}>REWARDS</span>
            </div>
          </div>

          {/* Quick Header Indicators */}
          <div className={styles.navRightGroup}>
            {/* Wallet Balance Pill - Clickable to open full Ledger & Balances */}
            <button
              type="button"
              className={styles.walletPill}
              onClick={() => setWalletModalOpen(true)}
              title="Click to view digital wallet & transaction history"
              aria-label="Open wallet modal"
            >
              <div className={styles.walletCoinIcon}>
                <img src={vesCoin} alt="" aria-hidden="true" />
              </div>
              <div className={styles.walletPillText}>
                <strong>{(wallet?.vesBalance ?? 0).toLocaleString()} VES</strong>
                {(wallet?.amazonGiftCardBalanceInr ?? 0) > 0 && (
                  <span className={styles.giftBadge}>₹{wallet?.amazonGiftCardBalanceInr}</span>
                )}
              </div>
            </button>

            {/* Streak Pill */}
            <div
              className={styles.streakPill}
              title={`${data.streak.currentStreak} day consecutive streak`}
              aria-label={`${data.streak.currentStreak} day streak`}
            >
              <Flame size={16} className={styles.flameIcon} />
              <span>{data.streak.currentStreak}d</span>
            </div>

            {/* User Account Menu with Click-Outside Ref */}
            <div className={styles.accountMenuWrap} ref={menuRef}>
              <button
                type="button"
                className={`${styles.accountBtn} ${accountMenuOpen ? styles.accountBtnActive : ""}`}
                onClick={() => setAccountMenuOpen((prev) => !prev)}
                aria-expanded={accountMenuOpen}
                aria-haspopup="true"
                aria-label="Account options menu"
              >
                <div className={styles.avatarCircle}>
                  {displayUser?.name ? displayUser.name.charAt(0).toUpperCase() : <UserRound size={16} />}
                </div>
                <ChevronDown size={14} className={styles.chevronIcon} />
              </button>

              {accountMenuOpen && (
                <div className={styles.accountDropdown} role="menu">
                  <div className={styles.dropdownHeader}>
                    <span className={styles.signedInLabel}>SIGNED IN AS</span>
                    <strong className={styles.userFullName}>{displayUser?.name || "Reward Member"}</strong>
                    <span className={styles.userEmail}>{displayUser?.email}</span>
                  </div>

                  <div className={styles.dropdownStats}>
                    <div className={styles.dropdownStatItem}>
                      <span>Streak</span>
                      <strong>{data.streak.currentStreak} Days</strong>
                    </div>
                    <div className={styles.dropdownStatItem}>
                      <span>Cycle</span>
                      <strong>{data.streak.checkedIn}/7</strong>
                    </div>
                  </div>

                  <div className={styles.dropdownDivider} />

                  <button
                    type="button"
                    className={styles.dropdownAction}
                    onClick={() => {
                      setAccountMenuOpen(false);
                      setWalletModalOpen(true);
                    }}
                  >
                    <WalletIcon size={15} />
                    <span>View Wallet &amp; Ledger</span>
                  </button>

                  <button
                    type="button"
                    className={`${styles.dropdownAction} ${styles.logoutAction}`}
                    onClick={() => {
                      setAccountMenuOpen(false);
                      handleLogout();
                    }}
                  >
                    <LogOut size={15} />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className={styles.mainContent}>
        {/* Error Alert Banner */}
        {error && (
          <div className={styles.alertBanner} role="alert">
            <div className={styles.alertLeft}>
              <AlertTriangle size={18} color="#f43f5e" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              className={styles.alertRetryBtn}
              onClick={() => load({ quiet: true })}
              aria-label="Retry loading"
            >
              <RefreshCw size={14} />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Streak Reset Notice */}
        {data.streak.wasReset && (
          <div className={styles.resetBanner} role="status">
            <div className={styles.resetIconWrap}>
              <RefreshCw size={18} />
            </div>
            <div className={styles.resetTextWrap}>
              <strong>Streak Cycle Reset to Day 1</strong>
              <p>The 24-hour claim window was missed. Day 1 is now available to restart your streak!</p>
            </div>
          </div>
        )}

        {/* HERO SECTION */}
        <section className={styles.heroSection}>
          <div className={styles.heroMainCard}>
            <div className={styles.heroHeaderRow}>
              <div className={styles.heroEyebrowGroup}>
                <span className={styles.eyebrowTag}>
                  <Sparkles size={13} />
                  DAILY CHECK-IN • CYCLE MILESTONE
                </span>
                {completed ? (
                  <span className={styles.statusCompleteTag}>7-DAY CYCLE COMPLETED</span>
                ) : (
                  <span className={styles.statusActiveTag}>
                    DAY {data.streak.currentDay} {data.rewards.find((r) => r.day === data.streak.currentDay)?.status === "AVAILABLE" ? "READY" : "ACTIVE"}
                  </span>
                )}
              </div>

              <div className={styles.serverVerifiedBadge}>
                <ShieldCheck size={14} />
                <span>Server Verified</span>
              </div>
            </div>

            <h1 className={styles.heroTitle}>
              Keep your streak.
              <span className={styles.heroHighlight}> Unlock more.</span>
            </h1>

            <p className={styles.heroSubtitle}>
              Check in consecutively to accumulate VES loyalty tokens and unlock guaranteed Amazon gift cards.
            </p>

            {/* Stepper / Progress Rail across 7 Days */}
            <div className={styles.stepperContainer}>
              <div className={styles.stepperHeader}>
                <span className={styles.stepperLabel}>
                  Milestone Progress: Day {Math.min(7, Math.max(1, data.streak.checkedIn))} of {data.streak.totalRewards}
                </span>
                <span className={styles.stepperCount}>
                  <strong>{data.streak.checkedIn}</strong> / 7 Days ({progressPercent}%)
                </span>
              </div>

              {/* Connected Milestone Rail */}
              <div className={styles.milestoneRail}>
                <div className={styles.railTrack}>
                  <div className={styles.railFill} style={{ width: `${progressPercent}%` }} />
                </div>

                <div className={styles.stepperNodes}>
                  {data.rewards.map((r) => {
                    const isClaimed = r.status === "CLAIMED";
                    const isCurrent = r.day === data.streak.currentDay;
                    const isUltimate = r.day === 7;

                    return (
                      <div
                        key={r.day}
                        className={`${styles.stepperNode} ${isClaimed ? styles.nodeClaimed : ""} ${isCurrent ? styles.nodeCurrent : ""} ${isUltimate ? styles.nodeUltimate : ""}`}
                        title={`Day ${r.day}: ${r.status}`}
                      >
                        <div className={styles.nodeCircle}>
                          {isClaimed ? <Check size={12} strokeWidth={3} /> : <span>{r.day}</span>}
                        </div>
                        <span className={styles.nodeDayText}>D{r.day}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Countdown Banner if awaiting claim window */}
            {!completed && data.streak.nextClaimAt && (
              <div className={styles.countdownBanner}>
                <div className={styles.countdownInfo}>
                  <span className={styles.countdownLabel}>NEXT REWARD WINDOW</span>
                  <strong className={styles.countdownDay}>Day {data.streak.currentDay} Check-In</strong>
                </div>
                <div className={styles.countdownBox}>
                  <Clock3 size={16} className={styles.countdownClockIcon} />
                  <Countdown
                    nextClaimAt={data.streak.nextClaimAt}
                    serverTime={data.serverTime}
                    onDone={handleTimerDone}
                  />
                </div>
              </div>
            )}

            {/* 3 Metric Cards */}
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statIconWrap}>
                  <Flame size={18} color="#f59e0b" />
                </div>
                <div>
                  <span className={styles.statLabel}>Current Streak</span>
                  <strong className={styles.statValue}>{data.streak.currentStreak} Days</strong>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIconWrap}>
                  <Award size={18} color="#8b5cf6" />
                </div>
                <div>
                  <span className={styles.statLabel}>Next Reward</span>
                  <strong className={styles.statValue}>
                    {completed ? "Completed!" : formatReward(data.nextReward)}
                  </strong>
                </div>
              </div>

              <div
                className={`${styles.statCard} ${styles.statCardClickable}`}
                onClick={() => setWalletModalOpen(true)}
                title="Open wallet ledger"
                role="button"
                tabIndex={0}
              >
                <div className={styles.statIconWrap}>
                  <WalletIcon size={18} color="#06b6d4" />
                </div>
                <div>
                  <span className={styles.statLabel}>Total Balance</span>
                  <strong className={styles.statValue}>
                    {(wallet?.vesBalance ?? 0).toLocaleString()} VES
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* DAY 7 ULTIMATE SPOTLIGHT CARD */}
          <div className={styles.ultimateCard}>
            <div className={styles.ultimateShimmer} aria-hidden="true" />
            <div className={styles.ultimateTopBadge}>
              <Sparkles size={13} />
              <span>ULTIMATE MILESTONE</span>
            </div>

            <div className={styles.ultimateIconWrap}>
              <img src={day7Asset} alt="Day 7 Ultimate Reward Crown" />
            </div>

            <div className={styles.ultimateBadgeDay}>DAY 7 REWARD</div>

            <h3 className={styles.ultimateAmount}>
              {data.ultimateReward?.currency === "INR" ? "₹" : "+"}
              {data.ultimateReward?.amount} Amazon Voucher
            </h3>

            <p className={styles.ultimateSubtitle}>
              {data.ultimateReward?.subtitle || "Guaranteed ₹5 Amazon Gift Card credited directly."}
            </p>

            <div className={`${styles.ultimateStatusPill} ${completed ? styles.ultimateCompletedPill : ""}`}>
              {completed ? "7-Day Milestone Completed" : `Unlocks on Day 7 (${7 - (data.streak.checkedIn || 0)} check-ins away)`}
            </div>
          </div>
        </section>

        {/* 7 DAILY REWARDS GRID */}
        <section className={styles.rewardsSection}>
          <div className={styles.sectionHeader}>
            <div>
              <span className={styles.sectionEyebrow}>7-DAY ROADMAP</span>
              <h2 className={styles.sectionTitle}>Daily Rewards Cycle</h2>
              <p className={styles.sectionDesc}>
                All eligibility and reward transactions are strictly verified by the backend.
              </p>
            </div>
          </div>

          <div className={styles.rewardGrid}>
            {data.rewards.map((reward) => {
              const isAvailable = reward.status === "AVAILABLE";
              const isClaimed = reward.status === "CLAIMED";
              const isMissed = reward.status === "MISSED";
              const isLocked = reward.status === "LOCKED";
              const isDay7 = reward.day === 7;

              const getAsset = () => {
                if (reward.day === 4) return day4Asset;
                if (reward.day === 5) return day5Asset;
                if (reward.day === 7) return day7Asset;
                return vesCoin;
              };

              return (
                <article
                  key={reward.day}
                  className={`
                    ${styles.rewardCard}
                    ${isAvailable ? styles.cardAvailable : ""}
                    ${isClaimed ? styles.cardClaimed : ""}
                    ${isMissed ? styles.cardMissed : ""}
                    ${isLocked ? styles.cardLocked : ""}
                    ${isDay7 ? styles.cardDaySeven : ""}
                  `}
                >
                  {/* Card Header */}
                  <div className={styles.cardHeader}>
                    <span className={`${styles.dayTag} ${isDay7 ? styles.dayTagGold : ""}`}>
                      DAY {reward.day}
                    </span>

                    {isAvailable && <span className={styles.todayPill}>READY</span>}
                    {isClaimed && (
                      <span className={styles.claimedPill}>
                        <Check size={12} strokeWidth={3} />
                        CLAIMED
                      </span>
                    )}
                  </div>

                  {/* Asset Icon */}
                  <div className={styles.rewardArtWrap}>
                    <img
                      src={getAsset()}
                      alt={`Day ${reward.day} reward`}
                      className={`${styles.rewardArtImg} ${isDay7 ? styles.artDay7 : ""}`}
                    />
                  </div>

                  {/* Reward Meta */}
                  <div className={styles.rewardMeta}>
                    <span className={styles.rewardTitleText}>{reward.reward.title}</span>
                    <strong className={`${styles.rewardAmountText} ${isDay7 ? styles.textGold : ""}`}>
                      {reward.reward.currency === "INR" ? "₹" : "+"}
                      {reward.reward.amount}
                      <span className={styles.rewardUnit}>
                        {reward.reward.currency === "VES" ? " VES" : " INR"}
                      </span>
                    </strong>
                    <span className={styles.rewardSubtitleText}>{reward.reward.subtitle}</span>
                  </div>

                  {/* Card Action / Status */}
                  <div className={styles.cardFooterArea}>
                    {isClaimed && (
                      <div className={styles.statusBoxClaimed}>
                        <Check size={14} strokeWidth={2.5} />
                        <span>Completed</span>
                      </div>
                    )}

                    {isLocked && !isAvailable && (
                      <div className={styles.statusBoxLocked}>
                        <Lock size={14} />
                        <span>
                          {reward.day === data.streak.currentDay && data.streak.nextClaimAt ? (
                            <Countdown
                              nextClaimAt={data.streak.nextClaimAt}
                              serverTime={data.serverTime}
                              onDone={handleTimerDone}
                            />
                          ) : (
                            `Unlocks Day ${reward.day}`
                          )}
                        </span>
                      </div>
                    )}

                    {isMissed && (
                      <div className={styles.statusBoxMissed}>
                        <Clock3 size={14} />
                        <span>Missed</span>
                      </div>
                    )}

                    {isAvailable && (
                      <button
                        type="button"
                        className={styles.claimRewardBtn}
                        onClick={handleClaim}
                        disabled={claiming}
                      >
                        {claiming ? (
                          <>
                            <RefreshCw size={15} className={styles.spin} />
                            <span>Claiming...</span>
                          </>
                        ) : (
                          <>
                            <span>Claim Reward</span>
                            <ArrowRight size={15} />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* SECURITY & BENEFIT PILLARS */}
        <section className={styles.featuresSection}>
          <div className={styles.featureCard}>
            <div className={styles.featureIconWrap}>
              <Flame size={22} color="#f59e0b" />
            </div>
            <div className={styles.featureText}>
              <strong>Consecutive Streaks</strong>
              <p>Check in every day to keep your streak intact. Missing a window resets the cycle to Day 1.</p>
            </div>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIconWrap}>
              <Gift size={22} color="#8b5cf6" />
            </div>
            <div className={styles.featureText}>
              <strong>Dual Rewards</strong>
              <p>Collect platform VES coins on standard days and Amazon gift card vouchers on milestone days.</p>
            </div>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIconWrap}>
              <ShieldCheck size={22} color="#10b981" />
            </div>
            <div className={styles.featureText}>
              <strong>Server-Verified Claims</strong>
              <p>All streak calculations, duplicate prevention, and balance updates are protected server-side.</p>
            </div>
          </div>
        </section>

        {/* RECENT CLAIMS ACTIVITY FEED */}
        <section className={styles.historyCardSection}>
          <div className={styles.historyCardHeader}>
            <div className={styles.historyHeaderLeft}>
              <History size={18} color="#a855f7" />
              <div>
                <h3>Recent Streak Activity</h3>
                <p>Latest rewards credited to your account</p>
              </div>
            </div>

            <button
              type="button"
              className={styles.openLedgerBtn}
              onClick={() => setWalletModalOpen(true)}
            >
              <span>View Full Ledger</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {history.length === 0 ? (
            <div className={styles.emptyHistoryState}>
              <History size={32} className={styles.emptyHistIcon} />
              <p>No completed claims recorded yet. Claim today's reward above to begin your ledger!</p>
            </div>
          ) : (
            <div className={styles.historyItemsList}>
              {history.slice(0, 5).map((claim) => {
                const isGiftCard = claim.rewardId?.currency === "INR";
                return (
                  <div key={claim.claimId} className={styles.claimRow}>
                    <div className={styles.claimRowLeft}>
                      <div className={styles.claimCheckCircle}>
                        <Check size={14} strokeWidth={2.5} />
                      </div>
                      <div className={styles.claimMeta}>
                        <strong>
                          Day {claim.day} Check-In • {claim.rewardId?.title || "Daily Streak Reward"}
                        </strong>
                        <span>{formatDate(claim.claimedAt)}</span>
                      </div>
                    </div>

                    <div className={styles.claimRowRight}>
                      <span className={`${styles.claimBadge} ${isGiftCard ? styles.claimBadgeGold : styles.claimBadgeViolet}`}>
                        {isGiftCard ? `₹${claim.rewardId?.amount}` : `+${claim.rewardId?.amount} VES`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* FOOTER */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <div className={styles.footerLogo}>V</div>
            <div>
              <strong>VELOOP REWARDS</strong>
              <p>© {new Date().getFullYear()} VELOOP Technologies. All rewards strictly server verified.</p>
            </div>
          </div>

          <div className={styles.footerSecurityBadge}>
            <ShieldCheck size={16} />
            <span>End-to-End Cryptographically Secured</span>
          </div>
        </div>
      </footer>
    </div>
  );
}