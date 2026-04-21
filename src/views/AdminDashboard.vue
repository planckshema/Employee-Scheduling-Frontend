<template>
  <div class="admin-container">
    <aside class="sidebar">
      <div class="logo-section">
        <span class="logo-icon">🛡️</span>
        <h2>Admin Panel</h2>
      </div>
      <nav class="nav-menu">
        <a href="#" class="nav-item active">Dashboard</a>
        <a href="#" class="nav-item">Manage Users</a>
        <a href="#" class="nav-item">System Logs</a>
        <a href="#" class="nav-item">Settings</a>
      </nav>
      <div class="sidebar-footer">
        <button class="logout-btn" @click="handleLogout">
          <span class="icon">Logout</span>
        </button>
      </div>
    </aside>

    <main class="main-content">
      <header class="top-header">
        <h1>Welcome, System Admin</h1>
        <div class="user-badge">Admin Mode Active</div>
      </header>

      <section class="dashboard-grid">
        <div class="stat-card">
          <h3>Total Users</h3>
          <p class="stat-val">1,284</p>
        </div>
        <div class="stat-card">
          <h3>Pending Approvals</h3>
          <p class="stat-val">12</p>
        </div>
        <div class="stat-card">
          <h3>System Status</h3>
          <p class="stat-val status-ok">Online</p>
        </div>
      </section>

      <section class="content-area">
        <div class="placeholder-card">
          <h3>Admin Overview</h3>
          <p>You are now authenticated. Use the sidebar to manage the scheduling system.</p>
        </div>
      </section>
    </main>
  </div>
</template>

<script>
import Utils from "@/config/utils.js";

export default {
  name: "AdminDashboard",
  methods: {
    handleLogout() {
      // 1. Clear the store/state
      this.$store.commit("setLoginUser", null);

      // 2. Clear localStorage using your Utils helper
      Utils.removeItem("user");

      // 3. Redirect back to the standard login
      this.$router.push({ name: "login" });
    },
  },
};
</script>

<style scoped>
.admin-container {
  display: flex;
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(123, 201, 111, 0.12), transparent 26%),
    linear-gradient(180deg, #f8fcf7 0%, var(--app-bg) 100%);
}

.sidebar {
  width: 260px;
  background:
    linear-gradient(180deg, rgba(35, 79, 47, 0.98) 0%, rgba(31, 67, 40, 0.98) 100%);
  color: #f6fff4;
  display: flex;
  flex-direction: column;
  padding: 28px 22px;
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: inset -1px 0 0 rgba(255, 255, 255, 0.04);
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 40px;
}

.logo-icon {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.12);
  font-size: 20px;
}

.logo-section h2 {
  font-size: 20px;
  margin: 0;
  letter-spacing: -0.02em;
}

.nav-menu {
  flex-grow: 1;
}

.nav-item {
  display: block;
  color: rgba(240, 250, 241, 0.76);
  text-decoration: none;
  padding: 13px 16px;
  border-radius: 14px;
  margin-bottom: 10px;
  font-weight: 700;
  border: 1px solid transparent;
}

.nav-item:hover,
.nav-item.active {
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  border-color: rgba(255, 255, 255, 0.08);
}

.main-content {
  flex-grow: 1;
  padding: 36px;
}

.top-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}

.top-header h1 {
  font-size: 34px;
  color: var(--app-text);
  margin: 0;
  letter-spacing: -0.03em;
}

.user-badge {
  background: rgba(123, 201, 111, 0.18);
  color: var(--app-primary);
  padding: 8px 14px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 800;
  border: 1px solid rgba(79, 155, 88, 0.18);
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin-bottom: 32px;
}

.stat-card {
  background: linear-gradient(180deg, var(--app-surface) 0%, var(--app-surface-soft) 100%);
  border: 1px solid var(--app-border);
  padding: 24px;
  border-radius: 22px;
  box-shadow: var(--app-shadow-sm);
}

.stat-card h3 {
  margin: 0 0 10px;
  font-size: 13px;
  color: var(--app-text-faint);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.stat-val {
  font-size: 32px;
  font-weight: 800;
  margin: 0;
  color: var(--app-text);
}

.status-ok {
  color: var(--app-primary);
}

.placeholder-card {
  background: linear-gradient(180deg, var(--app-surface) 0%, var(--app-surface-soft) 100%);
  padding: 40px;
  border-radius: 24px;
  border: 1px dashed var(--app-border-strong);
  text-align: center;
  color: var(--app-text-soft);
  box-shadow: var(--app-shadow-sm);
}

.logout-btn {
  width: 100%;
  padding: 13px 16px;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 14px;
  font-weight: 700;
}

.logout-btn:hover {
  background: rgba(255, 255, 255, 0.18);
}

@media (max-width: 980px) {
  .admin-container {
    display: block;
  }

  .sidebar {
    width: 100%;
  }

  .main-content {
    padding: 22px 16px;
  }

  .top-header,
  .dashboard-grid {
    display: grid;
  }
}
</style>
