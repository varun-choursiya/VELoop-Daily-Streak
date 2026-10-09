import { useCallback, useEffect, useState, useRef } from "react";
import {
  ArrowLeft,
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
  ChevronRight,
  Wallet as WalletIcon,
  ChevronDown,
  AlertTriangle,
  Award,
  Calendar,
  CheckCircle2
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
import StreakCalendarModal from "../../components/StreakCalendar/StreakCalendarModal.jsx";

// Supplied Visual Assets
import biggerStreak from "../../assets/Bigger_Streak.png";
import day4Asset from "../../assets/Day-4.png";
import day5Asset from "../../assets/Day-5.png";
import day7Asset from "../../assets/Day-7.png";
import exclusiveReward from "../../assets/Exclusive-reward.png";
import flameAsset from "../../assets/Flame.png";
import mobileHero from "../../assets/Mobile_Hero.png";
import stayActive from "../../assets/Stay_Active.png";
import topLeftAsset from "../../assets/Top_Left.png";
import topRightAsset from "../../assets/Top_right.png";
import trustAsset from "../../assets/Trust.png";
import vesCoin from "../../assets/VEs_Coin.png";

// Inline Custom Crisp Vector Icons
function AmazonIcon({ className = "", size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-label="Amazon">
      <path
        d="M13.6 15.6c-2.8 1.9-6.9 2.9-10.4 1.8-.4-.1-.7.3-.4.6 2.4 2.5 6.7 3.6 10.9 2.2 4-1.3 6.4-4.2 6.1-4.7-.2-.4-1-.2-1.5.1-1.4.9-3.2 1.4-4.7 1.4z"
        fill="#f59e0b"
      />
      <path
        d="M20.2 14.5c-.3-.4-2-.3-3.1.2-.3.2-.4.4-.2.6.9 1 3.1 1.4 3.6.8.2-.3.1-1.2-.3-1.6z"
        fill="#f59e0b"
      />
      <path
        d="M13.5 3.8c-.2-.1-.5 0-.6.2l-1.3 2.1c-.8-1.5-2.2-2.4-4-2.4-3.4 0-5.4 2.6-5.4 6 0 3.8 2.5 6.1 5.8 6.1 1.7 0 3.1-.7 3.9-2.1v1.7c0 .3.2.5.5.5h2.2c.3 0 .5-.2.5-.5V4.3c0-.3-.2-.5-.5-.5h-1.1zm-3.8 8.9c-1.7 0-3-1.4-3-3.3 0-2 1.2-3.4 3-3.4s3 1.4 3 3.4c0 2-1.3 3.3-3 3.3z"
        fill="#ffffff"
      />
    </svg>
  );
}

function VrShield({ className = "", size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} aria-label="VR Shield">
      <path
        d="M16 2.5L5 6.8V15.5C5 23.2 9.8 28.5 16 30.5C22.2 28.5 27 23.2 27 15.5V6.8L16 2.5Z"
        fill="#140e2b"
        stroke="#fbbf24"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <text
        x="16"
        y="19.5"
        textAnchor="middle"
        fill="#fbbf24"
        fontSize="10.5"
        fontWeight="900"
        fontFamily="'Outfit', -apple-system, sans-serif"
        letterSpacing="0.5"
      >
        VR
      </text>
    </svg>
  );
}

function PurpleGem({ className = "", size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-label="VES Gem">
      <defs>
        <linearGradient id="gemGrad" x1="2" y1="3" x2="22" y2="21" gradientUnits="userSpaceOnUse">
          <stop stopColor="#c084fc" />
          <stop offset="0.5" stopColor="#9333ea" />
          <stop offset="1" stopColor="#581c87" />
        </linearGradient>
      </defs>
      <path
        d="M7 3L17 3L22 9L12 21L2 9L7 3Z"
        fill="url(#gemGrad)"
        stroke="#d8b4fe"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path d="M2 9L22 9" stroke="#ffffff" strokeWidth="0.8" strokeOpacity="0.5" />
      <path d="M7 3L12 21L17 3" stroke="#ffffff" strokeWidth="0.8" strokeOpacity="0.5" />
    </svg>
  );
}

function StarCoin({ className = "", size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} aria-label="Gold Star">
      <defs>
        <linearGradient id="starCoinGrad" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fef08a" />
          <stop offset="0.5" stopColor="#fbbf24" />
          <stop offset="1" stopColor="#d97706" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="13.5" fill="url(#starCoinGrad)" stroke="#fde047" strokeWidth="1.5" />
      <path
        d="M16 7.5L18.6 12.8L24.5 13.6L20.2 17.8L21.2 23.6L16 20.9L10.8 23.6L11.8 17.8L7.5 13.6L13.4 12.8L16 7.5Z"
        fill="#160e29"
      />
    </svg>
  );
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
    <span>
      {hours}:{minutes}:{seconds}
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
  const [calendarModalOpen, setCalendarModalOpen] = useState(false);

  // Claim Success Modal & Confetti
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

      setClaimedReward({
        reward: claimResult.reward,
        day: claimResult.reward?.day || data?.streak?.currentDay || 1
      });
      setShowConfetti(true);

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
          <span className={styles.loadingSubtitle}>Verifying your streak &amp; balance...</span>
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

  const { streak, rewards, nextReward, ultimateReward } = data;
  const displayUser = user || data.user;
  const checkedInCount = streak?.checkedIn ?? 1;
  const totalRewardsCount = streak?.totalRewards ?? 7;
  const currentStreakDays = streak?.currentStreak ?? 1;
  const vesBalance = wallet?.vesBalance ?? 120;

  // Next reward formatting
  const formattedNextReward = nextReward
    ? nextReward.currency === "INR"
      ? `₹${nextReward.amount}`
      : `+${nextReward.amount} VEs`
    : "+10 VEs";

  return (
    <div className={styles.page}>
      {/* Confetti Celebration */}
      <ConfettiCanvas active={showConfetti} onComplete={() => setShowConfetti(false)} />

      {/* Claim Success Celebration Modal */}
      {claimedReward && (
        <ClaimSuccessModal
          reward={claimedReward.reward}
          streakDay={claimedReward.day}
          onClose={() => setClaimedReward(null)}
        />
      )}

      {/* Wallet Modal */}
      <WalletModal
        isOpen={walletModalOpen}
        onClose={() => setWalletModalOpen(false)}
        wallet={wallet}
        onRefresh={() => load({ quiet: true })}
      />

      {/* Streak Calendar & Guidelines Modal */}
      <StreakCalendarModal
        isOpen={calendarModalOpen}
        onClose={() => setCalendarModalOpen(false)}
        data={data}
      />

      {/* Ambient Radial Background Glows */}
      <div className={`${styles.ambientGlow} ${styles.glowVioletTop}`} aria-hidden="true" />
      <div className={`${styles.ambientGlow} ${styles.glowGoldCenter}`} aria-hidden="true" />

      {/* ====================================================================
          TOP NAVIGATION BAR (DESKTOP & MOBILE COMPACT)
          ==================================================================== */}
      <header className={styles.topNavbar}>
        <div className={styles.navbarInner}>
          {/* Left: Back Action + Daily Streak Title */}
          <div className={styles.navLeft}>
            <button
              type="button"
              className={styles.backCircleBtn}
              onClick={() => {
                if (window.history.length > 1) {
                  navigate(-1);
                } else {
                  navigate("/daily-streak");
                }
              }}
              title="Go back"
              aria-label="Back"
            >
              <ArrowLeft size={18} />
            </button>

            <div className={styles.navTitleGroup}>
              <div className={styles.navTitleRow}>
                <h1 className={styles.navTitle}>Daily Streak</h1>
                <img src={flameAsset} alt="Flame" className={styles.titleFlameImg} />
              </div>
              <p className={styles.navSubtitle}>
                Check in daily, maintain your streak, and unlock bigger rewards every day!
              </p>
            </div>
          </div>

          {/* Right: Wallet Balance Pill, Streak Status, User Menu */}
          <div className={styles.navRight}>
            {/* Desktop Streak Badge (Visible in Desktop layout) */}
            <div className={styles.desktopStreakBadge}>
              <div className={styles.streakFlameWrap}>
                <img src={flameAsset} alt="" aria-hidden="true" />
              </div>
              <div className={styles.desktopStreakText}>
                <strong>{currentStreakDays} Day Streak</strong>
                <span>Keep it going!</span>
              </div>
            </div>

            {/* Wallet Balance Pill (Interactive -> opens WalletModal) */}
            <button
              type="button"
              className={styles.walletGemPill}
              onClick={() => setWalletModalOpen(true)}
              title="Open Digital Wallet & Transactions"
              aria-label="View wallet balance"
            >
              <PurpleGem size={18} className={styles.gemIcon} />
              <span className={styles.walletBalanceNumber}>
                {vesBalance.toLocaleString()}
              </span>
            </button>

            {/* User Account Dropdown */}
            <div className={styles.accountMenuWrap} ref={menuRef}>
              <button
                type="button"
                className={`${styles.accountBtn} ${accountMenuOpen ? styles.accountBtnActive : ""}`}
                onClick={() => setAccountMenuOpen((prev) => !prev)}
                aria-expanded={accountMenuOpen}
                aria-haspopup="true"
                aria-label="Account options"
              >
                <div className={styles.avatarCircle}>
                  {displayUser?.name ? displayUser.name.charAt(0).toUpperCase() : <UserRound size={14} />}
                </div>
                <ChevronDown size={12} className={styles.chevronIcon} />
              </button>

              {accountMenuOpen && (
                <div className={styles.accountDropdown} role="menu">
                  <div className={styles.dropdownHeader}>
                    <span className={styles.signedInLabel}>SIGNED IN AS</span>
                    <strong className={styles.userFullName}>{displayUser?.name || "Member"}</strong>
                    <span className={styles.userEmail}>{displayUser?.email}</span>
                  </div>

                  <div className={styles.dropdownStats}>
                    <div className={styles.dropdownStatItem}>
                      <span>Streak</span>
                      <strong>{currentStreakDays} Days</strong>
                    </div>
                    <div className={styles.dropdownStatItem}>
                      <span>Cycle</span>
                      <strong>{checkedInCount}/7</strong>
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
                    <WalletIcon size={14} />
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
                    <LogOut size={14} />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ====================================================================
          MAIN DASHBOARD CONTAINER
          ==================================================================== */}
      <main className={styles.mainContainer}>
        {/* Error Notification */}
        {error && (
          <div className={styles.alertBanner} role="alert">
            <div className={styles.alertLeft}>
              <AlertTriangle size={16} color="#f43f5e" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              className={styles.alertRetryBtn}
              onClick={() => load({ quiet: true })}
            >
              <RefreshCw size={13} />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Streak Reset Notice */}
        {streak?.wasReset && (
          <div className={styles.resetBanner} role="status">
            <div className={styles.resetIconWrap}>
              <img src={flameAsset} alt="" aria-hidden="true" />
            </div>
            <div className={styles.resetTextWrap}>
              <strong>Streak Cycle Reset to Day 1</strong>
              <p>The 24-hour claim window was missed. Day 1 is now available to restart your streak!</p>
            </div>
          </div>
        )}

        {/* ====================================================================
            MOBILE PROMOTIONAL BANNER & ACTION ROW (Visible on Mobile)
            ==================================================================== */}
        <div className={styles.mobileHeroBannerWrap}>
          <div className={styles.mobileHeroBanner}>
            <div className={styles.mobileBannerContent}>
              <h2 className={styles.mobileBannerTitle}>
                Login Daily &amp; Earn
                <span className={styles.mobileBannerTitleHighlight}> Bigger Rewards!</span>
              </h2>
              <p className={styles.mobileBannerSubtitle}>
                Maintain your streak and unlock exciting rewards every day.
              </p>
            </div>
            <div className={styles.mobileBannerArt}>
              <img src={mobileHero} alt="Daily Rewards Illustration" />
            </div>
          </div>

          {/* Mobile Streak & Calendar Action Row */}
          <div className={styles.mobileActionRow}>
            <div className={styles.mobileStreakPill}>
              <img src={flameAsset} alt="" aria-hidden="true" className={styles.pillFlame} />
              <span>{currentStreakDays} Day Streak</span>
            </div>

            <button
              type="button"
              className={styles.mobileCalendarPill}
              onClick={() => setCalendarModalOpen(true)}
              aria-label="Open streak calendar"
            >
              <Calendar size={14} className={styles.calendarIcon} />
              <span>Streak Calendar</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* ====================================================================
            DESKTOP & TABLET HERO SECTION (Two Balanced Side-by-Side Cards)
            ==================================================================== */}
        <section className={styles.desktopHeroGrid}>
          {/* LEFT HERO CARD: Daily Check-In Rewards + Top_Left.png + 3 Stat Cards */}
          <div className={styles.desktopHeroLeftCard}>
            <div className={styles.heroLeftHeader}>
              <h2 className={styles.desktopHeroTitle}>
                Daily Check-In
                <span className={styles.desktopHeroTitleGold}> Rewards</span>
              </h2>
              <p className={styles.desktopHeroDesc}>
                Check in every day and earn exciting rewards!
              </p>
            </div>

            <div className={styles.heroLeftBody}>
              {/* Illustration: Purple gift box with VR coins */}
              <div className={styles.heroLeftIllustrationWrap}>
                <img src={topLeftAsset} alt="Check In Rewards" className={styles.heroLeftIllustrationImg} />
              </div>

              {/* 3 Summary Stat Cards in Desktop Left Panel */}
              <div className={styles.heroStatsContainer}>
                {/* Total Rewards */}
                <div className={styles.heroStatCard}>
                  <div className={styles.heroStatIconPurple}>
                    <Calendar size={18} />
                  </div>
                  <div className={styles.heroStatText}>
                    <span className={styles.heroStatLabel}>Total Rewards</span>
                    <strong className={styles.heroStatValue}>{totalRewardsCount}</strong>
                  </div>
                </div>

                {/* Checked In */}
                <div className={styles.heroStatCard}>
                  <div className={styles.heroStatIconGreen}>
                    <Check size={18} strokeWidth={3} />
                  </div>
                  <div className={styles.heroStatText}>
                    <span className={styles.heroStatLabel}>Checked In</span>
                    <strong className={styles.heroStatValue}>{checkedInCount}</strong>
                  </div>
                </div>

                {/* Next Reward */}
                <div className={styles.heroStatCard}>
                  <div className={styles.heroStatIconGold}>
                    <StarCoin size={26} />
                  </div>
                  <div className={styles.heroStatText}>
                    <span className={styles.heroStatLabel}>Next Reward</span>
                    <strong className={`${styles.heroStatValue} ${styles.textGold}`}>
                      {formattedNextReward}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT HERO CARD: Ultimate Reward Showcase Panel (Desktop) */}
          <div className={styles.desktopHeroRightCard}>
            {/* Top Right Flame Badge */}
            <div className={styles.heroRightTopBadge}>
              <div className={styles.flameCircle}>
                <img src={flameAsset} alt="" aria-hidden="true" />
              </div>
              <div>
                <strong>{currentStreakDays} Day Streak</strong>
                <span>Keep it going!</span>
              </div>
            </div>

            {/* Glowing Golden Crown on Neon Purple Pedestal */}
            <div className={styles.ultimateCrownShowcaseWrap}>
              <img
                src={topRightAsset}
                alt="Ultimate Reward Golden Crown on Glowing Pedestal"
                className={styles.ultimateCrownShowcaseImg}
              />
            </div>

            {/* Ultimate Reward Metadata */}
            <div className={styles.ultimateRewardMetaDesktop}>
              <span className={styles.ultimateRewardCategory}>Ultimate Reward</span>
              <div className={styles.ultimateAmountDesktop}>₹5</div>
              <div className={styles.amazonGiftCardPill}>
                <AmazonIcon size={16} />
                <span>Amazon Gift Card</span>
              </div>
              <span className={styles.unlockDayText}>
                Unlock on <strong className={styles.goldText}>Day 7</strong>
              </span>
            </div>
          </div>
        </section>

        {/* ====================================================================
            MOBILE SUMMARY STAT CARDS (3 Equal Columns)
            ==================================================================== */}
        <div className={styles.mobileStatsGrid}>
          {/* Total Rewards */}
          <div className={styles.mobileStatCard}>
            <div className={styles.mobileStatIconPurple}>
              <Calendar size={16} />
            </div>
            <div className={styles.mobileStatInfo}>
              <span className={styles.mobileStatLabel}>Total Rewards</span>
              <strong className={styles.mobileStatVal}>{totalRewardsCount}</strong>
            </div>
          </div>

          {/* Checked In */}
          <div className={styles.mobileStatCard}>
            <div className={styles.mobileStatIconGreen}>
              <Check size={16} strokeWidth={3} />
            </div>
            <div className={styles.mobileStatInfo}>
              <span className={styles.mobileStatLabel}>Checked In</span>
              <strong className={styles.mobileStatVal}>{checkedInCount}</strong>
            </div>
          </div>

          {/* Next Reward */}
          <div className={styles.mobileStatCard}>
            <div className={styles.mobileStatIconGold}>
              <StarCoin size={22} />
            </div>
            <div className={styles.mobileStatInfo}>
              <span className={styles.mobileStatLabel}>Next Reward</span>
              <strong className={`${styles.mobileStatVal} ${styles.textGold}`}>
                {formattedNextReward}
              </strong>
            </div>
          </div>
        </div>

        {/* ====================================================================
            MOBILE ULTIMATE REWARD PANEL (Full-width with Crown Pedestal)
            ==================================================================== */}
        <div className={styles.mobileUltimatePanel}>
          <div className={styles.mobileUltimateCrownWrap}>
            <img src={topRightAsset} alt="Day 7 Crown" className={styles.mobileUltimateCrownImg} />
          </div>

          <div className={styles.mobileUltimateInfo}>
            <span className={styles.ultimateRewardCategory}>Ultimate Reward</span>
            <div className={styles.mobileUltimateAmount}>₹5</div>
            <div className={styles.amazonGiftCardPill}>
              <AmazonIcon size={14} />
              <span>Amazon Gift Card</span>
            </div>
          </div>

          <div className={styles.mobileUltimateLockCol}>
            <div className={styles.lockCirclePurple}>
              <Lock size={16} />
            </div>
            <div className={styles.unlockDaySubtext}>
              Unlock on<br />
              <strong className={styles.goldText}>Day 7</strong>
            </div>
          </div>
        </div>

        {/* ====================================================================
            SPARKLE DIVIDER (Desktop & Mobile)
            ==================================================================== */}
        <div className={styles.sparkleDividerWrap}>
          <span className={styles.sparkleStar}>✦</span>
          <span className={styles.sparkleText}>Come back tomorrow for more rewards!</span>
          <span className={styles.sparkleStar}>✦</span>
        </div>

        {/* ====================================================================
            7 DAILY REWARD CARDS SECTION
            Desktop: Single horizontal row of 7 compact cards
            Mobile: 2-column grid with Day 7 VIP treatment
            ==================================================================== */}
        <section className={styles.rewardCardsContainer}>
          <div className={styles.rewardCardsGrid}>
            {rewards.map((r) => {
              const isClaimed = r.status === "CLAIMED";
              const isAvailable = r.status === "AVAILABLE";
              const isToday = r.day === streak.currentDay;
              const isDay7 = r.day === 7;
              const isTodayActive = isAvailable || (isToday && !isClaimed);
              const isLocked = !isClaimed && !isAvailable && !isToday;

              // Card Asset selector
              const getCardAsset = () => {
                if (r.day === 4) return day4Asset;
                if (r.day === 5) return day5Asset;
                if (r.day === 7) return day7Asset;
                return vesCoin;
              };

              // Reward Amount text formatting
              const amountPrefix = r.reward.currency === "INR" ? "₹" : "+";
              const amountValue = `${amountPrefix}${r.reward.amount}`;

              return (
                <article
                  key={r.day}
                  className={`
                    ${styles.rewardCard}
                    ${isTodayActive && !isDay7 ? styles.cardTodayActive : ""}
                    ${isClaimed ? styles.cardClaimed : ""}
                    ${isLocked ? styles.cardLocked : ""}
                    ${isDay7 ? styles.cardDay7Vip : ""}
                  `}
                >
                  {/* Card Top Row: [Day X] on left, Status / Type Badge on right */}
                  <div className={styles.cardHeaderRow}>
                    <span className={styles.dayPill}>Day {r.day}</span>

                    {/* Right side status badge */}
                    {isClaimed && (
                      <span className={styles.badgeClaimedCheck} title="Claimed">
                        <Check size={11} strokeWidth={3.5} />
                      </span>
                    )}

                    {!isClaimed && isToday && !isDay7 && (
                      <span className={styles.badgeToday}>Today</span>
                    )}

                    {!isClaimed && isDay7 && (
                      <span className={styles.badgeVip}>VIP</span>
                    )}

                    {!isClaimed && !isToday && !isDay7 && r.day === 5 && (
                      <span className={styles.badgePurple}>Gift Card</span>
                    )}

                    {!isClaimed && !isToday && !isDay7 && r.day === 6 && (
                      <span className={styles.badgePurple}>Coin</span>
                    )}
                  </div>

                  {/* Artwork Illustration */}
                  <div className={styles.cardArtworkWrap}>
                    <img
                      src={getCardAsset()}
                      alt={`Day ${r.day} reward`}
                      className={`
                        ${styles.cardArtworkImg}
                        ${isDay7 ? styles.artCrown : ""}
                        ${r.day === 4 ? styles.artGiftBox : ""}
                        ${r.day === 5 ? styles.artAmazon : ""}
                      `}
                    />
                  </div>

                  {/* Reward Meta */}
                  <div className={styles.cardRewardInfo}>
                    <span className={styles.cardRewardTypeLabel}>
                      {isDay7 ? "Ultimate Reward" : "Daily Reward"}
                    </span>

                    <div
                      className={`
                        ${styles.cardRewardAmount}
                        ${isClaimed ? styles.textGreen : ""}
                        ${isAvailable || isDay7 ? styles.textGold : styles.textPurple}
                      `}
                    >
                      {amountValue}
                    </div>

                    <span className={styles.cardRewardSubtext}>
                      {r.reward.currency === "INR" ? "Amazon Gift Card" : `${r.reward.amount} VEs`}
                    </span>
                  </div>

                  {/* Card Bottom Action Button */}
                  <div className={styles.cardActionArea}>
                    {isClaimed && (
                      <div className={styles.buttonClaimed}>
                        <Check size={13} strokeWidth={3} />
                        <span>Claimed</span>
                      </div>
                    )}

                    {!isClaimed && isAvailable && (
                      <button
                        type="button"
                        className={styles.buttonClaimActive}
                        onClick={handleClaim}
                        disabled={claiming}
                        aria-label={`Claim Day ${r.day} reward`}
                      >
                        {claiming ? (
                          <>
                            <RefreshCw size={13} className={styles.spinIcon} />
                            <span>Claiming...</span>
                          </>
                        ) : (
                          <>
                            <span className={styles.desktopClaimText}>Claim Reward</span>
                            <span className={styles.mobileClaimText}>Claim Now</span>
                            <ChevronRight size={14} />
                          </>
                        )}
                      </button>
                    )}

                    {!isClaimed && !isAvailable && isToday && (
                      <div className={styles.buttonCountdown} title="Next claim window countdown">
                        <Clock3 size={12} />
                        {streak?.nextClaimAt ? (
                          <Countdown
                            nextClaimAt={streak.nextClaimAt}
                            serverTime={data.serverTime}
                            onDone={handleTimerDone}
                          />
                        ) : (
                          <span>Available Soon</span>
                        )}
                      </div>
                    )}

                    {!isClaimed && !isAvailable && !isToday && (
                      <div className={styles.buttonLocked}>
                        <Lock size={12} />
                        <span>Locked</span>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* ====================================================================
            "WHY MAINTAIN YOUR STREAK?" / BENEFITS SECTION
            Desktop: Sleek horizontal 4-item bar with dividers
            Mobile: 4 items in a clean grid
            ==================================================================== */}
        <section className={styles.benefitsSection}>
          <div className={styles.benefitsSectionHeader}>
            <span className={styles.sparkleStarSmall}>✦</span>
            <h3 className={styles.benefitsSectionTitle}>Why Maintain Your Streak?</h3>
            <span className={styles.sparkleStarSmall}>✦</span>
          </div>

          <div className={styles.benefitsGrid}>
            {/* 1. Stay Active */}
            <div className={styles.benefitItem}>
              <div className={styles.benefitIconWrap}>
                <img src={stayActive} alt="" aria-hidden="true" className={styles.benefitIconImg} />
              </div>
              <div className={styles.benefitTextWrap}>
                <strong className={styles.benefitTitle}>Stay Active</strong>
                <p className={styles.benefitDesc}>Keep your streak alive &amp; earn more!</p>
              </div>
            </div>

            {/* 2. Bigger Streak */}
            <div className={styles.benefitItem}>
              <div className={styles.benefitIconWrap}>
                <img src={biggerStreak} alt="" aria-hidden="true" className={styles.benefitIconImg} />
              </div>
              <div className={styles.benefitTextWrap}>
                <strong className={styles.benefitTitle}>Bigger Streak</strong>
                <p className={styles.benefitDesc}>More consecutive logins, bigger rewards!</p>
              </div>
            </div>

            {/* 3. Exclusive Rewards */}
            <div className={styles.benefitItem}>
              <div className={styles.benefitIconWrap}>
                <img src={exclusiveReward} alt="" aria-hidden="true" className={styles.benefitIconImg} />
              </div>
              <div className={styles.benefitTextWrap}>
                <strong className={styles.benefitTitle}>Exclusive Rewards</strong>
                <p className={styles.benefitDesc}>Get coins, gift cards &amp; special bonuses!</p>
              </div>
            </div>

            {/* 4. Don't Miss Out */}
            <div className={styles.benefitItem}>
              <div className={styles.benefitIconWrap}>
                <img src={trustAsset} alt="" aria-hidden="true" className={styles.benefitIconImg} />
              </div>
              <div className={styles.benefitTextWrap}>
                <strong className={styles.benefitTitle}>Don't Miss Out</strong>
                <p className={styles.benefitDesc}>Come back every day &amp; unlock all rewards!</p>
              </div>
            </div>
          </div>
        </section>

        {/* ====================================================================
            BOTTOM INFORMATIONAL & OFFICIAL REWARDS BANNER
            ==================================================================== */}
        <div className={styles.officialRewardsBanner}>
          <div className={styles.officialBannerLeft}>
            <div className={styles.vrShieldWrap}>
              <VrShield size={26} />
            </div>
            <div className={styles.officialBannerText}>
              <div className={styles.officialBannerLine1}>
                Official rewards only on <strong className={styles.goldText}>VeloopRewards.in</strong>
              </div>
              <div className={styles.officialBannerLine2}>
                Stay active, stay rewarded!
              </div>
            </div>
          </div>

          <div className={styles.officialBannerRight}>
            <ChevronRight size={18} className={styles.arrowIcon} />
          </div>
        </div>
      </main>
    </div>
  );
}