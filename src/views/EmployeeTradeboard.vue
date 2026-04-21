<template>
  <section class="tab-content">
    <section v-if="errorMessage" class="status-banner error">
      <v-icon size="18">mdi-alert-circle-outline</v-icon>
      <span>{{ errorMessage }}</span>
    </section>

    <section class="panel hero-panel">
      <div>
        <p class="eyebrow">Shift Exchange</p>
        <h2>Trade Board</h2>
        <p class="muted">Post one of your shifts to the board or claim an open one.</p>
      </div>
      <button class="primary-button" @click="showAddModal = true">
        <v-icon size="18">mdi-plus</v-icon>
        Post My Shift
      </button>
    </section>

    <section class="board-grid">
      <article class="panel">
        <div class="section-head">
          <div>
            <p class="eyebrow">Open Board</p>
            <h3>Available Trades</h3>
          </div>
        </div>

        <div v-if="availableTrades.length" class="trade-list">
          <article v-for="trade in availableTrades" :key="trade.TradeRequestID" class="trade-card">
            <div class="trade-top">
              <div>
                <strong>{{ trade.shift?.position || "Shift" }}</strong>
                <p>{{ formatDate(trade.shift?.startDate || trade.shift?.date) }}</p>
                <p>{{ formatTime(trade.shift?.startTime) }} - {{ formatTime(trade.shift?.endTime) }}</p>
                <p class="muted">
                  Posted by
                  {{ ownerName(trade) }}
                </p>
              </div>
              <span class="badge available">{{ trade.status }}</span>
            </div>

            <p class="note">{{ trade.message || "No note was added to this trade." }}</p>

            <button
              class="primary-button small"
              :disabled="!employeeId || trade.OriginalOwnerID === employeeId"
              @click="claimTrade(trade)"
            >
              Claim Shift
            </button>
          </article>
        </div>

        <p v-else class="empty-copy">There are no available trades on the board right now.</p>
      </article>

      <article class="panel">
        <div class="section-head">
          <div>
            <p class="eyebrow">My Activity</p>
            <h3>My Posted and Pending Trades</h3>
          </div>
        </div>

        <div v-if="myTrades.length" class="trade-list">
          <article v-for="trade in myTrades" :key="trade.TradeRequestID" class="trade-card">
            <div class="trade-top">
              <div>
                <strong>{{ trade.shift?.position || "Shift" }}</strong>
                <p>{{ formatDate(trade.shift?.startDate || trade.shift?.date) }}</p>
                <p>{{ formatTime(trade.shift?.startTime) }} - {{ formatTime(trade.shift?.endTime) }}</p>
              </div>
              <span :class="['badge', badgeClass(trade.status)]">{{ trade.status }}</span>
            </div>

            <p class="note">{{ trade.message || "No note was added to this trade." }}</p>

            <div class="actions-row">
              <span v-if="trade.Requester" class="muted">
                Requester: {{ trade.Requester.firstName }} {{ trade.Requester.lastName }}
              </span>
              <button class="ghost-button small" @click="removeTrade(trade.TradeRequestID)">
                Remove
              </button>
            </div>
          </article>
        </div>

        <p v-else class="empty-copy">You have not posted or claimed any trades yet.</p>
      </article>
    </section>

    <v-dialog v-model="showAddModal" max-width="560px">
      <v-card>
        <v-card-title class="headline">Post Shift to Trade Board</v-card-title>
        <v-card-text>
          <v-select
            v-model="selectedShift"
            :items="eligibleShifts"
            item-title="displayText"
            item-value="shiftId"
            return-object
            label="Select one of your scheduled shifts"
            class="mt-4"
          />

          <v-textarea
            v-model="tradeMessage"
            label="Note (Optional)"
            placeholder="e.g., Need coverage for class event"
            rows="3"
          />
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeAddModal">Cancel</v-btn>
          <v-btn color="primary" :disabled="!selectedShift" @click="submitTrade">
            Post Shift
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </section>
</template>

<script>
import EmployeeServices from "@/services/employeeServices";
import ShiftServices from "@/services/shiftServices";
import TradeServices from "@/services/tradeServices";

export default {
  name: "EmployeeTradeboard",
  data() {
    return {
      loading: true,
      errorMessage: "",
      trades: [],
      allShifts: [],
      employeeId: null,
      showAddModal: false,
      selectedShift: null,
      tradeMessage: "",
    };
  },
  computed: {
    currentUser() {
      return this.$store.getters.getLoginUserInfo || {};
    },
    availableTrades() {
      return this.trades.filter(
        (trade) =>
          trade.status === "Available" &&
          trade.OriginalOwnerID !== this.employeeId,
      );
    },
    myTrades() {
      return this.trades.filter(
        (trade) =>
          trade.OriginalOwnerID === this.employeeId || trade.RequesterID === this.employeeId,
      );
    },
    eligibleShifts() {
      const tradedShiftIds = new Set(this.trades.map((trade) => trade.ShiftID));
      return this.allShifts
        .filter((shift) => shift.EmployeeID === this.employeeId && !tradedShiftIds.has(shift.shiftId))
        .map((shift) => ({
          ...shift,
          displayText: `${shift.position || "Shift"} | ${shift.date || shift.startDate} | ${shift.startTime}-${shift.endTime}`,
        }));
    },
  },
  watch: {
    showAddModal(value) {
      if (value) {
        this.selectedShift = null;
        this.tradeMessage = "";
      }
    },
  },
  created() {
    this.loadData();
  },
  methods: {
    async loadData() {
      if (!this.currentUser?.userId) {
        this.loading = false;
        this.errorMessage = "Your session is missing user information. Please sign in again.";
        return;
      }

      this.loading = true;
      this.errorMessage = "";

      try {
        const [{ data: dashboard }, { data: trades }, { data: shifts }] = await Promise.all([
          EmployeeServices.getEmployeeDashboard(this.currentUser.userId),
          TradeServices.getAllTrades(),
          ShiftServices.getAllShifts(),
        ]);

        this.employeeId = dashboard?.profile?.employeeId || null;
        this.trades = trades || [];
        this.allShifts = shifts || [];
      } catch (error) {
        this.errorMessage =
          error.response?.data?.message || "We could not load the trade board.";
      } finally {
        this.loading = false;
      }
    },
    ownerName(trade) {
      if (trade.OriginalOwner) {
        return `${trade.OriginalOwner.firstName} ${trade.OriginalOwner.lastName}`;
      }
      return "House Shift";
    },
    badgeClass(status) {
      return String(status || "").toLowerCase();
    },
    async submitTrade() {
      if (!this.selectedShift || !this.employeeId) {
        return;
      }

      try {
        await TradeServices.createTrade({
          ShiftID: this.selectedShift.shiftId,
          OriginalOwnerID: this.employeeId,
          postType: "Employee Drop",
          message: this.tradeMessage,
          status: "Available",
        });
        this.closeAddModal();
        this.loadData();
      } catch (error) {
        this.errorMessage =
          error.response?.data?.message || "We could not post your shift to the board.";
      }
    },
    async claimTrade(trade) {
      if (!this.employeeId) {
        return;
      }

      try {
        await TradeServices.claimTrade(trade.TradeRequestID, {
          RequesterID: this.employeeId,
          message: "I am available to take this shift.",
        });
        this.loadData();
      } catch (error) {
        this.errorMessage =
          error.response?.data?.message || "We could not claim that shift.";
      }
    },
    async removeTrade(id) {
      if (!id || !window.confirm("Remove this trade from the board?")) {
        return;
      }

      try {
        await TradeServices.deleteTrade(id);
        this.loadData();
      } catch (error) {
        this.errorMessage =
          error.response?.data?.message || "We could not remove that trade.";
      }
    },
    closeAddModal() {
      this.showAddModal = false;
      this.selectedShift = null;
      this.tradeMessage = "";
    },
    formatDate(dateStr) {
      if (!dateStr) return "";
      return new Date(dateStr).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    },
    formatTime(timeStr) {
      return timeStr ? String(timeStr).slice(0, 5) : "";
    },
  },
};
</script>

<style scoped>
.tab-content {
  padding: 0 20px 28px;
  display: grid;
  gap: 18px;
}

.panel,
.status-banner {
  border: 1px solid var(--app-border);
  border-radius: 22px;
  background: linear-gradient(180deg, var(--app-surface) 0%, var(--app-surface-soft) 100%);
  box-shadow: var(--app-shadow-sm);
}

.panel {
  padding: 22px;
}

.hero-panel {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
  background: linear-gradient(180deg, var(--app-surface) 0%, rgba(236, 248, 238, 0.8) 100%);
}

.status-banner {
  padding: 14px 16px;
  display: flex;
  gap: 10px;
  align-items: center;
}

.status-banner.error {
  background: var(--app-danger-bg);
  color: var(--app-danger);
  border-color: var(--app-danger-border);
}

.eyebrow {
  margin: 0 0 8px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 12px;
  font-weight: 800;
  color: var(--app-secondary);
}

h2,
h3,
p {
  margin: 0;
}

.muted,
.note,
.empty-copy,
.trade-card p {
  color: var(--app-text-soft);
}

.board-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.section-head {
  margin-bottom: 14px;
}

.trade-list {
  display: grid;
  gap: 12px;
}

.trade-card {
  border: 1px solid var(--app-border);
  border-radius: 18px;
  background: var(--app-surface);
  padding: 16px;
  display: grid;
  gap: 12px;
}

.trade-top,
.actions-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
}

.badge {
  border-radius: 999px;
  padding: 7px 10px;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
}

.badge.available {
  background: rgba(123, 201, 111, 0.18);
  color: var(--app-primary);
}

.badge.pending {
  background: var(--app-warning-bg);
  color: #a37218;
}

.badge.approved {
  background: rgba(47, 107, 63, 0.12);
  color: var(--app-secondary);
}

.primary-button,
.ghost-button {
  border-radius: 14px;
  padding: 12px 18px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.primary-button {
  border: 1px solid var(--app-primary-deep);
  background: linear-gradient(135deg, var(--app-primary) 0%, var(--app-secondary) 100%);
  color: #fff;
  box-shadow: 0 16px 28px rgba(47, 107, 63, 0.18);
}

.ghost-button {
  border: 1px solid var(--app-border);
  background: var(--app-surface-soft);
  color: var(--app-text);
}

.small {
  padding: 8px 12px;
  font-size: 13px;
}

@media (max-width: 980px) {
  .tab-content {
    padding: 0 14px 16px;
  }

  .hero-panel,
  .board-grid,
  .trade-top,
  .actions-row {
    display: grid;
  }
}
</style>
