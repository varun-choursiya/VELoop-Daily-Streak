import { useState, useEffect } from "react";
import {
  X,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Gift,
  Copy,
  Check,
  Clock,
  Sparkles,
  ExternalLink,
  ShieldCheck
} from "lucide-react";
import { getWalletTransactions } from "../../services/streakApi.js";
import styles from "./WalletModal.module.css";
import vesCoin from "../../assets/VEs_Coin.png";

function formatDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  }).format(new Date(value));
}

export default function WalletModal({ isOpen, onClose, wallet, onRefresh }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("ALL"); // ALL, VES, INR
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    async function loadTransactions() {
      setLoading(true);
      try {
        const res = await getWalletTransactions();
        if (isMounted) {
          setTransactions(res.data.transactions || []);
        }
      } catch (err) {
        console.error("Failed to load transactions", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadTransactions();

    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);

    return () => {
      isMounted = false;
      window.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await Promise.all([
        onRefresh?.(),
        getWalletTransactions().then((res) => {
          setTransactions(res.data.transactions || []);
        })
      ]);
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  }

  function copyTransactionId(id) {
    if (!id) return;
    navigator.clipboard?.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const filteredTransactions = transactions.filter((tx) => {
    if (filter === "VES") return tx.currency === "VES";
    if (filter === "INR") return tx.currency === "INR";
    return true;
  });

  return (
    <div className={styles.backdrop} onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="wallet-title">
      <div className={styles.container} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerTitleWrap}>
            <div className={styles.headerIcon}>
              <Wallet size={20} />
            </div>
            <div>
              <h2 id="wallet-title">Wallet & Balances</h2>
              <p>Your real-time earnings and verified transactions</p>
            </div>
          </div>

          <div className={styles.headerActions}>
            <button
              className={styles.refreshBtn}
              onClick={handleRefresh}
              disabled={refreshing}
              title="Refresh balances"
              aria-label="Refresh balances"
            >
              <RefreshCw size={16} className={refreshing ? styles.spin : ""} />
            </button>
            <button className={styles.closeBtn} onClick={onClose} aria-label="Close wallet">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Dual Balance Cards */}
        <div className={styles.balancesGrid}>
          {/* VES Balance Card */}
          <div className={`${styles.balanceCard} ${styles.vesCard}`}>
            <div className={styles.balanceCardGlow} />
            <div className={styles.balanceCardTop}>
              <div className={styles.balanceIconWrap}>
                <img src={vesCoin} alt="VES" />
              </div>
              <span className={styles.currencyBadge}>PLATFORM COIN</span>
            </div>
            <div className={styles.balanceNumbers}>
              <span className={styles.balanceLabel}>VES Balance</span>
              <strong className={styles.balanceValue}>
                {(wallet?.vesBalance ?? 0).toLocaleString()} <span className={styles.symbol}>VES</span>
              </strong>
            </div>
            <div className={styles.cardFooter}>
              <span>100% On-chain Verified</span>
              <ShieldCheck size={14} />
            </div>
          </div>

          {/* Amazon Gift Card Balance */}
          <div className={`${styles.balanceCard} ${styles.amazonCard}`}>
            <div className={styles.balanceCardGlowAmazon} />
            <div className={styles.balanceCardTop}>
              <div className={styles.balanceIconWrapAmazon}>
                <Gift size={20} />
              </div>
              <span className={styles.currencyBadgeAmazon}>AMAZON VOUCHER</span>
            </div>
            <div className={styles.balanceNumbers}>
              <span className={styles.balanceLabel}>Gift Card Balance</span>
              <strong className={styles.balanceValue}>
                ₹{(wallet?.amazonGiftCardBalanceInr ?? 0).toLocaleString()} <span className={styles.symbol}>INR</span>
              </strong>
            </div>
            <div className={styles.cardFooter}>
              <span>Direct Voucher Redemption</span>
              <Sparkles size={14} />
            </div>
          </div>
        </div>

        {/* Transaction History Section */}
        <div className={styles.historySection}>
          <div className={styles.historyHeader}>
            <h3>Transaction Ledger</h3>

            {/* Filter pills */}
            <div className={styles.filterGroup}>
              <button
                className={`${styles.filterPill} ${filter === "ALL" ? styles.activeFilter : ""}`}
                onClick={() => setFilter("ALL")}
              >
                All ({transactions.length})
              </button>
              <button
                className={`${styles.filterPill} ${filter === "VES" ? styles.activeFilter : ""}`}
                onClick={() => setFilter("VES")}
              >
                VES Coins
              </button>
              <button
                className={`${styles.filterPill} ${filter === "INR" ? styles.activeFilter : ""}`}
                onClick={() => setFilter("INR")}
              >
                Amazon Vouchers
              </button>
            </div>
          </div>

          {/* Transaction List */}
          <div className={styles.transactionsList}>
            {loading ? (
              <div className={styles.skeletonList}>
                {[1, 2, 3].map((n) => (
                  <div key={n} className={styles.skeletonItem} />
                ))}
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className={styles.emptyState}>
                <Clock size={36} className={styles.emptyIcon} />
                <h4>No transactions yet</h4>
                <p>Complete your daily streak check-ins to earn VES and Amazon vouchers!</p>
              </div>
            ) : (
              filteredTransactions.map((tx) => {
                const isCredit = tx.type === "CREDIT";
                const isGiftCard = tx.currency === "INR";
                return (
                  <div key={tx._id || tx.transactionId} className={styles.txRow}>
                    <div className={styles.txLeft}>
                      <div className={`${styles.typeIcon} ${isCredit ? styles.creditIcon : styles.debitIcon}`}>
                        {isCredit ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
                      </div>

                      <div className={styles.txMeta}>
                        <div className={styles.txTitleRow}>
                          <strong className={styles.txTitle}>
                            {tx.streakDay ? `Day ${tx.streakDay} Streak Reward` : "Streak Bonus Credit"}
                          </strong>
                          <span className={styles.statusBadge}>{tx.status || "SUCCESS"}</span>
                        </div>

                        <div className={styles.txDetailsRow}>
                          <span className={styles.txDate}>{formatDate(tx.createdAt)}</span>
                          <span className={styles.dotSeparator}>•</span>
                          <button
                            type="button"
                            className={styles.copyIdBtn}
                            onClick={() => copyTransactionId(tx.transactionId || tx.referenceId)}
                            title="Copy transaction ID"
                          >
                            <span>Ref: {(tx.transactionId || tx.referenceId || "").slice(0, 12)}...</span>
                            {copiedId === (tx.transactionId || tx.referenceId) ? (
                              <Check size={12} color="#34d399" />
                            ) : (
                              <Copy size={12} />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className={styles.txRight}>
                      <span className={`${styles.amountText} ${isCredit ? styles.amountCredit : styles.amountDebit}`}>
                        {isCredit ? "+" : "-"}
                        {isGiftCard ? `₹${tx.amount}` : `${tx.amount} VES`}
                      </span>
                      <span className={styles.balanceAfterText}>
                        Balance: {isGiftCard ? `₹${tx.balanceAfter}` : `${tx.balanceAfter} VES`}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
