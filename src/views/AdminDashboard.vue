<template>
  <div class="admin-page">
    <aside class="sidebar">
      <div class="sidebar-logo">
        <span class="logo-mark">⬡</span>
        <span class="logo-text">Admin</span>
      </div>
      <div class="sidebar-footer">
        <div class="admin-badge">
          <span class="admin-dot"></span>
          <span>admin</span>
        </div>
        <button class="logout-btn" @click="handleLogout">Sign out</button>
      </div>
    </aside>

    <main class="main">
      <header class="page-header">
        <div>
          <h1>System Overview</h1>
          <p class="page-sub">Click an employer to manage personnel</p>
        </div>
        <button class="btn-primary">+ Add Employer</button>
      </header>

      <section class="stats-grid">
        <div class="stat-card">
          <p class="stat-label">ACTIVE EMPLOYERS</p>
          <div class="stat-flex">
            <p class="stat-value">{{ stats.totalEmployers || 0 }}</p>
            <span class="stat-icon">🏢</span>
          </div>
        </div>
        <div class="stat-card">
          <p class="stat-label">TOTAL EMPLOYEES</p>
          <div class="stat-flex">
            <p class="stat-value">{{ stats.totalEmployees || 0 }}</p>
            <span class="stat-icon">👥</span>
          </div>
        </div>
      </section>

      <div class="search-bar">
        <span class="search-icon">🔍</span>
        <input v-model="searchQuery" type="text" placeholder="Filter by business name..." />
      </div>

      <div class="organization-list">
        <div 
          v-for="employer in filteredData" 
          :key="employer.employerid" 
          class="employer-card"
          :class="{ 'is-expanded': expandedId === employer.employerid }"
        >
          <div class="employer-header" @click="toggleEmployer(employer.employerid)">
            <div class="biz-meta">
              <span class="biz-avatar">{{ (employer.businessName || 'C')[0] }}</span>
              <div>
                <h2 class="biz-name">{{ employer.businessName }}</h2>
                <p class="biz-owner">Owned by {{ employer.firstName }} {{ employer.lastName }}</p>
              </div>
            </div>
            <div class="biz-actions">
              <span class="email-pill">{{ employer.email }}</span>
              <button class="icon-btn">⚙️</button>
              <button class="delete-link">Delete</button>
              <span class="chevron">{{ expandedId === employer.employerid ? '▼' : '▶' }}</span>
            </div>
          </div>

          <div v-if="expandedId === employer.employerid" class="staff-pane">
            <div class="staff-pane-header">
              <h3>Staff Personnel</h3>
              <span class="count-badge">{{ (employer.staff || []).length }} Total</span>
            </div>
            <table class="staff-table">
              <thead>
                <tr>
                  <th>EMPLOYEE NAME</th>
                  <th>CONTACT</th>
                  <th>ID</th>
                  <th class="text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="person in (employer.staff || [])" :key="person.EmployeeID">
                  <td>{{ person.firstName }} {{ person.lastName }}</td>
                  <td class="dim">{{ person.email }}</td>
                  <td class="dim">#{{ person.EmployeeID }}</td>
                  <td class="text-right">
                    <button class="delete-link">Remove</button>
                  </td>
                </tr>
                <tr v-if="!(employer.staff && employer.staff.length > 0)">
                  <td colspan="4" class="empty-msg">No employees found for this employer.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script>
import AdminServices from "@/services/adminServices";

export default {
  data() {
    return {
      stats: {},
      users: [],
      expandedId: null,
      searchQuery: "",
      usersLoading: true
    };
  },
  computed: {
    filteredData() {
      if (!this.searchQuery) return this.users;
      return this.users.filter(u => u.businessName.toLowerCase().includes(this.searchQuery.toLowerCase()));
    }
  },
  methods: {
    toggleEmployer(id) {
      this.expandedId = this.expandedId === id ? null : id;
    },
    async refreshData() {
      try {
        const [sRes, uRes] = await Promise.all([AdminServices.getStats(), AdminServices.getUsers()]);
        this.stats = sRes.data;
        this.users = uRes.data;
      } catch (err) { console.error(err); }
      finally { this.usersLoading = false; }
    },
    handleLogout() {
      this.$store.commit("setLoginUser", null);
      this.$router.push({ name: "login" });
    }
  },
  async mounted() { await this.refreshData(); }
};
</script>

<style scoped>
/* Matching the exact dark theme from your screenshot */
.admin-page { display: flex; min-height: 100vh; background: #0b0e14; color: #fff; font-family: 'Inter', sans-serif; }
.sidebar { width: 220px; background: #0d1117; border-right: 1px solid #1e293b; padding: 25px; display: flex; flex-direction: column; }
.sidebar-logo { display: flex; align-items: center; gap: 10px; margin-bottom: auto; font-weight: bold; }
.logo-mark { color: #3b82f6; font-size: 20px; }
.sidebar-footer { border-top: 1px solid #1e293b; padding-top: 20px; }
.admin-badge { display: flex; align-items: center; gap: 8px; font-size: 13px; margin-bottom: 15px; color: #94a3b8; }
.admin-dot { width: 7px; height: 7px; background: #22c55e; border-radius: 50%; }
.logout-btn { width: 100%; background: #1c2128; border: 1px solid #30363d; color: #f85149; padding: 8px; border-radius: 6px; cursor: pointer; }

.main { flex: 1; padding: 40px 60px; max-width: 1200px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
h1 { font-size: 32px; margin: 0; }
.page-sub { color: #8b949e; margin-top: 5px; }
.btn-primary { background: #3b82f6; border: none; color: white; padding: 12px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; }

.stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
.stat-card { background: #161b22; border: 1px solid #30363d; padding: 25px; border-radius: 12px; }
.stat-label { font-size: 11px; color: #8b949e; font-weight: 600; margin-bottom: 15px; }
.stat-flex { display: flex; justify-content: space-between; align-items: center; }
.stat-value { font-size: 42px; font-weight: bold; margin: 0; }

.search-bar { background: #0d1117; border: 1px solid #30363d; padding: 15px 20px; border-radius: 10px; margin-bottom: 30px; display: flex; align-items: center; gap: 10px; color: #8b949e; }
.search-bar input { background: transparent; border: none; color: white; width: 100%; outline: none; }

.employer-card { background: #161b22; border: 1px solid #30363d; border-radius: 12px; margin-bottom: 15px; overflow: hidden; }
.is-expanded { border-color: #3b82f6; }
.employer-header { padding: 20px 25px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; }
.biz-avatar { width: 45px; height: 45px; background: #3b82f6; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 20px; }
.biz-name { font-size: 20px; margin: 0; }
.biz-owner { font-size: 14px; color: #8b949e; margin: 4px 0 0; }
.email-pill { background: #0d1117; border: 1px solid #30363d; color: #58a6ff; padding: 5px 15px; border-radius: 20px; font-size: 13px; }
.delete-link { color: #f85149; background: none; border: none; cursor: pointer; font-size: 14px; margin: 0 15px; }
.icon-btn { background: none; border: none; color: #8b949e; font-size: 18px; cursor: pointer; }

.staff-pane { padding: 0 25px 25px; border-top: 1px solid #30363d; background: #0d1117; }
.staff-pane-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 0; }
.count-badge { background: #21262d; color: #8b949e; padding: 3px 12px; border-radius: 10px; font-size: 12px; }
.staff-table { width: 100%; border-collapse: collapse; }
.staff-table th { text-align: left; font-size: 11px; color: #484f58; padding: 10px; border-bottom: 1px solid #30363d; }
.staff-table td { padding: 15px 10px; border-bottom: 1px solid #21262d; font-size: 14px; }
.dim { color: #8b949e; }
.text-right { text-align: right; }
.empty-msg { text-align: center; color: #8b949e; padding: 40px !important; font-style: italic; }
</style>