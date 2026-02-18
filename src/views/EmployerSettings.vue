<template>
  <section class="tab-content">
    <article class="settings-card">
      <h2>Settings</h2>
      <p class="muted">
        Settings screen from the mockups can be added next. This placeholder
        keeps tab flow complete.
      </p>
    </article>
  </section>
</template>

<script>
export default {
  name: "EmployerSettings",
};
</script>

<style scoped>
.tab-content {
  padding: 0 20px 24px;
}

h2 {
  margin: 0;
  font-size: 22px;
}

.settings-card {
  border: 1px solid #dce1ec;
  border-radius: 12px;
  background: #fff;
  padding: 18px;
}

.muted {
  color: #617089;
}

@media (max-width: 980px) {
  .tab-content {
    padding: 0 14px 16px;
  }
}
</style>
