import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Check,
  Clock3,
  Gift,
  History,
  Lock,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Trophy,
  WalletCards
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { getHistory, getStreak, getWallet, claimStreak } from "../../services/streakApi.js";
import styles from "./DailyStreak.module.css";

function formatReward(reward) {
  if (!reward) return "—";
  return reward.currency === "INR" ? `₹${reward.amount}` : `+${reward.amount} VES`;
}

function formatDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
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

  return <span>{hours}:{minutes}:{seconds}</span>;
}

function StreakSkeleton() {
  return (
    <div className="container py-4 py-lg-5">
      <div className={styles.skeletonHero}>
        <div className={styles.skeletonPanel}>
          <span className={styles.skeletonLineSmall} />
          <span className={styles.skeletonLineLarge} />
          <span className={styles.skeletonLine} />
          <span className={styles.skeletonLineShort} />
          <div className={styles.skeletonStats}>
            <span /><span /><span />
          </div>
        </div>
        <div className={styles.skeletonPanel} />
      </div>
      <div className={styles.skeletonHeading} />
      <div className={styles.skeletonGrid}>
        {Array.from({ length: 7 }).map((_, index) => <div key={index} className={styles.skeletonCard} />)}
      </div>
    </div>
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
  const [cpa, setCpa] = useState(false);
  const [error, setError] = useState("");

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
      setError(err.response?.data?.message || "Unable to load your streak.");
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
      setCpa(true);
      await new Promise((resolve) => setTimeout(resolve, 900));
      await claimStreak();
      await load({ quiet: true });
    } catch (err) {
      setError(err.response?.data?.message || "Unable to process your reward.");
      await load({ quiet: true });
    } finally {
      setCpa(false);
      setClaiming(false);
    }
  }

  function handleLogout() {
    logout();
    navigate("/login");
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.brandLoader}>
          <div className={styles.loaderMark}><Sparkles size={30} /></div>
          <strong>VELoop Rewards</strong>
          <span>Loading your streak...</span>
          <div className={styles.loaderBar}><span /></div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={styles.page}>
        <div className="container py-5">
          <div className={styles.errorState}>
            <ShieldCheck size={28} />
            <h2>We couldn't load your streak</h2>
            <p>{error || "Please try again."}</p>
            <button className={styles.claimButton} onClick={() => load()}>
              <RefreshCw size={16} /> Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const current = data.rewards.find((item) => item.day === data.streak.currentDay);
  const available = current?.status === "AVAILABLE";
  const completed = data.streak.status === "COMPLETED";
  const progress = Math.min(100, (data.streak.checkedIn / data.streak.totalRewards) * 100);
  const displayUser = data.user || user;
  const handleTimerDone = useCallback(() => load({ quiet: true }), [load]);

  return (
    <div className={styles.page}>
      <div className={styles.backgroundGlow} />

      <header className={styles.header}>
        <div className="container d-flex align-items-center justify-content-between gap-3">
          <button className={styles.backButton} onClick={() => navigate(-1)}>
            <ArrowLeft size={18} />
            <span>Daily Streak</span>
          </button>

          <div className={styles.headerRight}>
            <div className={styles.walletPill} title="Backend wallet balance">
              <WalletCards size={15} />
              <span>{wallet?.vesBalance ?? 0} VES</span>
            </div>
            <div className={styles.streakPill}>
              <Sparkles size={15} />
              {data.streak.currentStreak} Day Streak
            </div>
            <div className={styles.userMeta}>
              <strong>{displayUser?.name || "User"}</strong>
              <span>{displayUser?.email || ""}</span>
            </div>
            <button className={styles.iconButton} onClick={handleLogout} title="Log out">
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </header>

      <main className="container py-4 py-lg-5">
        {error && (
          <div className={styles.errorBox} role="alert">
            <span>{error}</span>
            <button onClick={() => load({ quiet: true })}><RefreshCw size={15} /></button>
          </div>
        )}

        {data.streak.wasReset && (
          <div className={styles.resetBox} role="status">
            <div className={styles.resetIcon}><RefreshCw size={16} /></div>
            <div>
              <strong>Your streak has been reset</strong>
              <span>The required claim window was missed. Day 1 is available again.</span>
            </div>
          </div>
        )}

        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <div className={styles.heroOrb} />
            <p className="eyebrow">DAILY CHECK-IN • VELoop REWARDS</p>
            <h1>Keep your streak.<br /><span>Unlock more.</span></h1>
            <p className={styles.heroText}>
              Check in every day, protect your streak, and unlock rewards that grow as you progress.
            </p>

            <div className={styles.progressWrap}>
              <div className={styles.progressLabel}>
                <span>Day {Math.min(data.streak.totalRewards, Math.max(1, data.streak.checkedIn))} of {data.streak.totalRewards}</span>
                <strong>{data.streak.checkedIn}/{data.streak.totalRewards}</strong>
              </div>
              <div className={styles.progressTrack}><span style={{ width: `${progress}%` }} /></div>
            </div>

            {!completed && data.streak.nextClaimAt && (
              <div className={styles.heroCountdown}>
                <div>
                  <span>NEXT REWARD IN</span>
                  <strong>Day {data.streak.currentDay}</strong>
                </div>
                <b>
                  <Countdown
                    nextClaimAt={data.streak.nextClaimAt}
                    serverTime={data.serverTime}
                    onDone={handleTimerDone}
                  />
                </b>
              </div>
            )}

            <div className={styles.statsRow}>
              <div className={styles.stat}>
                <span>Current Streak</span>
                <strong>{data.streak.currentStreak} days</strong>
              </div>
              <div className={styles.stat}>
                <span>Next Reward</span>
                <strong>{completed ? "Completed" : formatReward(data.nextReward)}</strong>
              </div>
              <div className={styles.stat}>
                <span>VES Balance</span>
                <strong>{wallet?.vesBalance ?? 0}</strong>
              </div>
            </div>
          </div>

          <div className={styles.ultimate}>
            <div className={styles.ultimateHalo} />
            <div className={styles.ultimateIcon}>
              <Trophy size={58} />
            </div>
            <span className={styles.dayBadge}>DAY {data.ultimateReward?.day}</span>
            <p>ULTIMATE REWARD</p>
            <h2>{data.ultimateReward?.currency === "INR" ? "₹" : "+"}{data.ultimateReward?.amount}</h2>
            <small>{data.ultimateReward?.subtitle}</small>
            <div className={styles.unlock}>
              {completed ? "Cycle completed" : `Unlock on Day ${data.ultimateReward?.day}`}
            </div>
          </div>
        </section>

        <section className={styles.sectionHeading}>
          <div>
            <p className="eyebrow">YOUR PROGRESS</p>
            <h2>Daily Rewards</h2>
            <p>Every status below is calculated by the backend.</p>
          </div>
          <div className={styles.serverBadge}>
            <ShieldCheck size={16} />
            Server verified
          </div>
        </section>

        <section className={styles.rewardGrid}>
          {data.rewards.map((reward) => (
            <article
              key={reward.day}
              className={`${styles.rewardCard} ${
                reward.status === "AVAILABLE" ? styles.available : ""
              } ${reward.status === "CLAIMED" ? styles.claimed : ""} ${
                reward.status === "MISSED" ? styles.missed : ""
              }`}
            >
              <div className={styles.cardTop}>
                <span className={styles.dayBadge}>DAY {reward.day}</span>
                {reward.status === "AVAILABLE" && <span className={styles.todayBadge}>TODAY</span>}
                {reward.status === "CLAIMED" && <span className={styles.claimedBadge}>DONE</span>}
              </div>

              <div className={styles.rewardIcon}>
                {reward.reward.assetType === "gift-card" ? (
                  <Gift size={44} />
                ) : reward.reward.assetType === "crown" ? (
                  <Trophy size={44} />
                ) : (
                  <Sparkles size={44} />
                )}
              </div>

              <p className={styles.rewardTitle}>{reward.reward.title}</p>
              <h3>{reward.reward.currency === "INR" ? "₹" : "+"}{reward.reward.amount}</h3>
              <span className={styles.rewardSub}>{reward.reward.subtitle}</span>

              <div className={styles.cardAction}>
                {reward.status === "CLAIMED" && (
                  <span className={styles.claimedText}><Check size={15} /> Claimed</span>
                )}
                {reward.status === "LOCKED" && (
                  <span className={styles.lockedText}><Lock size={15} /> Locked</span>
                )}
                {reward.status === "MISSED" && (
                  <span className={styles.lockedText}><Clock3 size={15} /> Missed</span>
                )}
                {reward.status === "AVAILABLE" && (
                  <button className={styles.claimButton} disabled={claiming} onClick={handleClaim}>
                    {claiming ? "Processing..." : "Claim Reward"}
                    {!claiming && <span>→</span>}
                  </button>
                )}

                {reward.day === data.streak.currentDay &&
                  reward.status === "LOCKED" &&
                  data.streak.nextClaimAt && (
                    <div className={styles.timer}>
                      <small>NEXT REWARD IN</small>
                      <strong>
                        <Countdown
                          nextClaimAt={data.streak.nextClaimAt}
                          serverTime={data.serverTime}
                          onDone={handleTimerDone}
                        />
                      </strong>
                    </div>
                  )}
              </div>
            </article>
          ))}
        </section>

        <section className={styles.infoGrid}>
          <div><Sparkles size={22} /><span><strong>Bigger Streak</strong>More consecutive check-ins unlock more valuable rewards.</span></div>
          <div><Gift size={22} /><span><strong>Exclusive Rewards</strong>Earn VES and gift-card rewards through the backend wallet.</span></div>
          <div><ShieldCheck size={22} /><span><strong>Protected Claims</strong>Day, reward and eligibility are validated server-side.</span></div>
        </section>

        <section className={styles.historySection}>
          <div className={styles.historyHeading}>
            <div>
              <p className="eyebrow">ACTIVITY</p>
              <h2>Recent Claims</h2>
            </div>
            <History size={20} />
          </div>
          {history.length === 0 ? (
            <div className={styles.emptyHistory}>Your completed claims will appear here.</div>
          ) : (
            <div className={styles.historyList}>
              {history.slice(0, 5).map((claim) => (
                <div className={styles.historyItem} key={claim.claimId}>
                  <div className={styles.historyIcon}><Check size={16} /></div>
                  <div>
                    <strong>Day {claim.day} • {claim.rewardId?.title || "Daily Reward"}</strong>
                    <span>{formatDate(claim.claimedAt)}</span>
                  </div>
                  <b>{claim.rewardId?.currency === "INR" ? "₹" : "+"}{claim.rewardId?.amount}{claim.rewardId?.currency === "VES" ? " VES" : ""}</b>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {cpa && (
        <div className={styles.modalBackdrop} role="status" aria-live="polite">
          <div className={styles.cpaModal}>
            <div className={styles.cpaIcon}><Gift size={30} /></div>
            <p className="eyebrow">REWARD VERIFICATION</p>
            <h2>Preparing your reward...</h2>
            <p>This demo state represents the future CPA verification step.</p>
            <div className={styles.spinner} />
          </div>
        </div>
      )}

      <footer className={styles.footer}>
        <div className="container">
          <span>© VELoop Rewards</span>
          <span>Secure daily rewards experience</span>
        </div>
      </footer>
    </div>
  );
}
