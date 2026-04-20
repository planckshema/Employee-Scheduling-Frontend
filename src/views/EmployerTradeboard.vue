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
            <v-icon size="64" color="#e0e0e0">mdi-swap-horizontal</v-icon>
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
                    <v-btn color="grey darken-1" text @click="closeAddModal">Cancel</v-btn>
                    <v-btn color="black" dark :disabled="!selectedShift" @click="submitTradeToBoard">
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
                    <v-btn color="grey" text @click="confirmDialog.show = false">Cancel</v-btn>
                    <v-btn color="primary" text @click="executeConfirmedAction">Confirm</v-btn>
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
    padding: 24px;
    max-width: 1000px;
    margin: 0 auto;
    font-family: sans-serif;
}

.board-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 32px;
}

.header-text h1 {
    font-size: 24px;
    margin-bottom: 4px;
}

.header-text p {
    color: #666;
}

.add-button {
    background: #000;
    color: #fff;
    padding: 10px 20px;
    border-radius: 8px;
    font-weight: 600;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
}

.trade-card {
    background: #fff;
    border: 1px solid #eee;
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 16px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
}

.card-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
}

.position-title {
    font-size: 18px;
    font-weight: 700;
    margin-right: 12px;
}

.status-badge {
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
}

.status-badge.available {
    background: #e8f5e9;
    color: #2e7d32;
}

.status-badge.pending {
    background: #fff3e0;
    color: #ef6c00;
}

.details-row {
    display: flex;
    gap: 24px;
    margin: 12px 0;
    color: #555;
    font-size: 14px;
}

.posted-date {
    color: #999;
    font-size: 12px;
}

.remove-btn {
    border: 1px solid #ddd;
    padding: 6px 14px;
    border-radius: 6px;
    background: #fff;
    cursor: pointer;
    font-size: 13px;
}

.requests-section {
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid #f5f5f5;
}

.requests-section h4 {
    margin-bottom: 12px;
    font-size: 14px;
    color: #333;
}

.request-item {
    background: #f9f9f9;
    padding: 16px;
    border-radius: 8px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.request-msg {
    font-size: 14px;
    color: #666;
    margin-top: 4px;
}

.request-actions {
    display: flex;
    gap: 8px;
}

.accept-btn {
    background: #34a853;
    color: #fff;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
}

.decline-btn {
    background: #fff;
    border: 1px solid #d93025;
    color: #d93025;
    padding: 8px 16px;
    border-radius: 6px;
    cursor: pointer;
}

.empty-state {
    text-align: center;
    padding: 60px;
    color: #bbb;
}
</style>