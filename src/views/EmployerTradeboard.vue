<template>
    <div class="trade-board-container">
        <header class="board-header">
            <div class="header-text">
                <h1>Shift Trade Board</h1>
                <p>Manage shift trade requests and open house shifts</p>
            </div>
            <button class="add-button" @click="showAddModal = true">
                <v-icon left color="white">mdi-plus</v-icon> Add Shift to Board
            </button>
        </header>

        <div v-if="trades.length === 0" class="empty-state">
            <v-icon size="64" color="secondary">mdi-swap-horizontal</v-icon>
            <p>No active trades on the board.</p>
        </div>

        <div v-for="trade in trades" :key="trade.TradeRequestID" class="trade-card">
            <div class="card-top">
                <div class="shift-info">
                    <div class="title-row">
                        <span class="position-title">{{ trade.shift.position }}</span>
                        <span :class="['status-badge', trade.status.toLowerCase()]">
                            {{ trade.status }}
                        </span>
                    </div>

                    <div class="details-row">
                        <span><v-icon small>mdi-calendar</v-icon> {{ formatDate(trade.shift.startDate) }}</span>
                        <span><v-icon small>mdi-clock-outline</v-icon> {{ formatTime(trade.shift.startTime) }} - {{
                            formatTime(trade.shift.endTime) }}</span>
                        <span>
                            <v-icon small>mdi-account</v-icon>
                            {{ trade.OriginalOwner ? `${trade.OriginalOwner.firstName} ${trade.OriginalOwner.lastName}`
                                : 'House Shift (Unassigned)' }}
                        </span>
                    </div>
                    <small class="posted-date">Posted on {{ formatDate(trade.postedAt) }}</small>
                </div>

                <button class="remove-btn" @click="removeTrade(trade.TradeRequestID)">Remove</button>
            </div>

            <div v-if="trade.status === 'Pending'" class="requests-section">
                <h4>Trade Request</h4>
                <div class="request-item">
                    <div class="requester-info">
                        <strong>{{ trade.Requester.firstName }} {{ trade.Requester.lastName }}</strong>
                        <p class="request-msg">"{{ trade.message || 'I am available and would like to take this shift.'
                            }}"</p>
                    </div>
                    <div class="request-actions">
                        <button class="accept-btn" @click="approveTrade(trade.TradeRequestID)">
                            <v-icon small color="white">mdi-check</v-icon> Accept
                        </button>
                        <button class="decline-btn" @click="declineTrade(trade.TradeRequestID)">
                            Decline
                        </button>
                    </div>
                </div>
            </div>

            <div v-else-if="trade.status === 'Available'" class="no-requests">
                <p>Waiting for employee claims...</p>
            </div>
        </div>

        <v-dialog v-model="showAddModal" max-width="500px">
            <v-card>
                <v-card-title class="headline">Post Shift to Trade Board</v-card-title>
                <v-card-text>
                    <v-select v-model="selectedShift" :items="availableShifts" label="Select Scheduled Shift"
                        item-text="displayText" return-object outlined dense class="mt-4"></v-select>

                    <v-textarea v-model="addModalMessage" label="Note (Optional)"
                        placeholder="e.g., Needs coverage ASAP!" outlined rows="3"></v-textarea>
                </v-card-text>

                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn variant="text" @click="closeAddModal">Cancel</v-btn>
                    <v-btn color="primary" :disabled="!selectedShift" @click="submitTradeToBoard">
                        Post to Board
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
        <v-dialog v-model="confirmDialog.show" max-width="400">
            <v-card>
                <v-card-title class="headline">{{ confirmDialog.title }}</v-card-title>
                <v-card-text>{{ confirmDialog.message }}</v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn variant="text" @click="confirmDialog.show = false">Cancel</v-btn>
                    <v-btn color="primary" variant="text" @click="executeConfirmedAction">Confirm</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</template>

<script>
import TradeService from "@/services/tradeServices";
import ShiftService from "@/services/shiftServices"; // Verified your file name is shiftServices

export default {
    name: "TradeBoard",
    data() {
        return {
            trades: [],
            showAddModal: false,
            availableShifts: [],
            selectedShift: null,
            addModalMessage: "",
            confirmDialog: {
                show: false,
                title: "",
                message: "",
                action: null, // We will store the function to run here
                payload: null
            }
        };
    },
    watch: {
        showAddModal(val) {
            if (val) this.fetchEligibleShifts();
        }
    },
    mounted() {
        this.loadTrades();
    },
    methods: {
        async loadTrades() {
            try {
                const res = await TradeService.getAllTrades();
                this.trades = res.data;
            } catch (err) {
                console.error("Error loading trades", err);
            }
        },

        async fetchEligibleShifts() {
            try {
                // Fetching all shifts from your main Shift table
                const res = await ShiftService.getAllShifts();

                // Don't show shifts that are already on the board
                const existingTradeIds = this.trades.map(t => t.ShiftID);

                this.availableShifts = res.data
                    .filter(s => !existingTradeIds.includes(s.shiftId))
                    .map(s => ({
                        ...s,
                        displayText: `${s.position} | ${s.startDate} (${s.startTime})`
                    }));
            } catch (err) {
                console.error("Error fetching shifts:", err);
            }
        },

        async submitTradeToBoard() {
            try {
                const payload = {
                    ShiftID: this.selectedShift.shiftId,
                    OriginalOwnerID: this.selectedShift.EmployeeID || null,
                    postType: this.selectedShift.EmployeeID ? 'Employee Drop' : 'Employer Post',
                    message: this.addModalMessage,
                    status: 'Available'
                };

                await TradeService.createTrade(payload); // Ensure this matches your tradeService.js
                this.closeAddModal();
                this.loadTrades();
            } catch (err) {
                console.error("Submit error", err);
            }
        },

        approveTrade(id) {
            this.confirmDialog = {
                show: true,
                title: "Approve Trade",
                message: "Are you sure you want to accept this trade?",
                action: 'approve',
                payload: id
            };
        },

        declineTrade(id) {
            this.confirmDialog = {
                show: true,
                title: "Decline Trade Request",
                message: "Are you sure you want to decline this request? The shift will remain 'Available' for others to claim.",
                action: 'decline',
                payload: id
            };
        },

        async executeConfirmedAction() {
            this.confirmDialog.show = false;
            const { action, payload } = this.confirmDialog;

            try {
                if (action === 'approve') {
                    await TradeService.approveTrade(payload);
                }
                else if (action === 'delete') {
                    await TradeService.deleteTrade(payload);
                }
                else if (action === 'decline') {
                    // You'll need to create this endpoint in your backend
                    // It basically resets status to 'Available' and RequesterID to null
                    await TradeService.declineTrade(payload);
                }

                this.loadTrades(); // Refresh the board
            } catch (err) {
                console.error("Action failed", err);
            }
        },
        
        async removeTrade(id) {
            if (confirm("Remove this from the board?")) {
                await TradeService.deleteTrade(id);
                this.loadTrades();
            }
        },

        closeAddModal() {
            this.showAddModal = false;
            this.selectedShift = null;
            this.addModalMessage = "";
        },

        formatDate(dateStr) {
            if (!dateStr) return "";
            return new Date(dateStr).toLocaleDateString('en-US', {
                weekday: 'short', month: 'short', day: 'numeric'
            });
        },

        formatTime(timeStr) {
            if (!timeStr) return "";
            return timeStr.substring(0, 5);
        }
    }
};
</script>

<style scoped>
.trade-board-container {
    padding: 0 28px 32px;
    max-width: 1380px;
    margin: 0 auto;
    color: var(--app-text);
}

.board-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding: 22px 24px;
    border: 1px solid var(--app-border);
    border-radius: 24px;
    background: linear-gradient(180deg, var(--app-surface) 0%, rgba(236, 248, 238, 0.82) 100%);
    box-shadow: var(--app-shadow-sm);
}

.header-text h1 {
    font-size: 32px;
    margin-bottom: 4px;
    letter-spacing: -0.03em;
}

.header-text p {
    color: var(--app-text-soft);
}

.add-button {
    background: linear-gradient(135deg, var(--app-primary) 0%, var(--app-secondary) 100%);
    color: #fff;
    padding: 12px 20px;
    border-radius: 14px;
    font-weight: 700;
    border: 1px solid var(--app-primary-deep);
    display: flex;
    align-items: center;
    gap: 8px;
    box-shadow: 0 18px 28px rgba(47, 107, 63, 0.18);
}

.trade-card {
    background: linear-gradient(180deg, var(--app-surface) 0%, var(--app-surface-soft) 100%);
    border: 1px solid var(--app-border);
    border-radius: 22px;
    padding: 24px;
    margin-bottom: 16px;
    box-shadow: var(--app-shadow-sm);
}

.card-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
}

.position-title {
    font-size: 18px;
    font-weight: 800;
    margin-right: 12px;
}

.status-badge {
    padding: 6px 10px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
}

.status-badge.available {
    background: rgba(123, 201, 111, 0.18);
    color: var(--app-primary);
}

.status-badge.pending {
    background: var(--app-warning-bg);
    color: #a37218;
}

.details-row {
    display: flex;
    gap: 24px;
    margin: 12px 0;
    color: var(--app-text-soft);
    font-size: 14px;
    flex-wrap: wrap;
}

.posted-date {
    color: var(--app-text-faint);
    font-size: 12px;
}

.remove-btn {
    border: 1px solid var(--app-border);
    padding: 9px 14px;
    border-radius: 12px;
    background: var(--app-surface);
    color: var(--app-text);
    font-size: 13px;
    font-weight: 700;
}

.requests-section {
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid var(--app-border);
}

.requests-section h4 {
    margin-bottom: 12px;
    font-size: 14px;
    color: var(--app-text);
    letter-spacing: 0.04em;
    text-transform: uppercase;
}

.request-item {
    background: rgba(236, 248, 238, 0.6);
    border: 1px solid rgba(79, 155, 88, 0.16);
    padding: 16px;
    border-radius: 18px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
}

.request-msg {
    font-size: 14px;
    color: var(--app-text-soft);
    margin-top: 4px;
}

.request-actions {
    display: flex;
    gap: 8px;
}

.accept-btn {
    background: linear-gradient(135deg, var(--app-primary) 0%, var(--app-secondary) 100%);
    color: #fff;
    border: 1px solid var(--app-primary-deep);
    padding: 10px 16px;
    border-radius: 12px;
    font-weight: 700;
}

.decline-btn {
    background: var(--app-surface);
    border: 1px solid var(--app-danger-border);
    color: var(--app-danger);
    padding: 10px 16px;
    border-radius: 12px;
    font-weight: 700;
}

.empty-state {
    text-align: center;
    padding: 60px;
    color: var(--app-text-faint);
    border: 1px dashed var(--app-border-strong);
    border-radius: 24px;
    background: rgba(255, 254, 251, 0.72);
}

.no-requests p {
    color: var(--app-text-soft);
}

@media (max-width: 980px) {
    .trade-board-container {
        padding: 0 14px 18px;
    }

    .board-header,
    .card-top,
    .request-item,
    .request-actions {
        display: grid;
    }
}
</style>
