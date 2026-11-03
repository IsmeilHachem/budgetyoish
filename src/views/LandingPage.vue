<template>
  <div class="bg-slate-950 min-h-screen">

    <!-- ── Minimal fixed nav ── -->
    <header class="fixed top-0 left-0 right-0 z-50 h-16 bg-slate-950/80 backdrop-blur border-b border-slate-800 flex items-center px-6 md:px-12 justify-between">
      <span class="text-xl font-bold text-white">BudgetYoish</span>
      <div class="flex items-center gap-3">
        <router-link
          to="/login"
          class="px-4 py-2 text-sm font-medium text-white border border-white/30 rounded-lg hover:border-white/60 hover:bg-white/5 transition"
        >
          Sign In
        </router-link>
        <router-link
          to="/login"
          class="px-4 py-2 text-sm font-medium text-white bg-indigo-500 hover:bg-indigo-400 rounded-lg transition"
        >
          Get Started
        </router-link>
      </div>
    </header>

    <!-- ── Hero ── -->
    <section class="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-16 overflow-hidden">
      <!-- Radial glow behind headline -->
      <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div class="w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-3xl"></div>
      </div>

      <div class="relative z-10 max-w-4xl mx-auto">
        <!-- Eyebrow -->
        <p class="text-indigo-400 text-sm font-medium tracking-widest uppercase mb-6">
          Built on Your Money or Your Life
        </p>

        <!-- Headline -->
        <h1 class="text-5xl md:text-7xl font-black leading-tight">
          <span class="bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent">
            Your money is your life.
          </span>
          <br />
          <span class="bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent">
            Start treating it that way.
          </span>
        </h1>

        <!-- Subheadline -->
        <p class="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mt-6 leading-relaxed">
          BudgetYoish is the only budgeting app that shows you every purchase in hours of your life — not just dollars.
          See your path to financial independence. Rate your spending. Build wealth on purpose.
        </p>

        <!-- CTA buttons -->
        <div class="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
          <router-link
            to="/login"
            class="px-8 py-4 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl font-semibold text-lg transition"
          >
            Start for free →
          </router-link>
          <a
            href="#features"
            class="px-8 py-4 text-slate-400 hover:text-white font-medium text-lg transition"
          >
            See how it works ↓
          </a>
        </div>

        <!-- Social proof -->
        <p class="text-slate-500 text-sm mt-8">
          Free to use · No credit card · Built by someone who wanted to run their budget instead of running out of life
        </p>
      </div>

      <!-- Hero visual: static transaction mockup -->
      <div class="relative z-10 w-full max-w-2xl mx-auto mt-16">
        <div class="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-2xl text-left">
          <div class="flex items-center gap-3 mb-5">
            <div class="w-8 h-8 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-lg flex items-center justify-center">
              <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <span class="text-slate-100 font-bold text-sm uppercase tracking-wide">This month's spending</span>
          </div>
          <div class="space-y-3">
            <div v-for="row in mockTransactions" :key="row.label"
                 class="flex items-center justify-between py-3 border-b border-slate-700/60 last:border-0">
              <span class="text-slate-300 text-sm font-medium">{{ row.label }}</span>
              <div class="flex items-center gap-4">
                <span class="text-red-400 font-semibold tabular-nums text-sm">{{ row.amount }}</span>
                <span class="text-slate-500 text-xs tabular-nums">≈ {{ row.hrs }} hrs</span>
              </div>
            </div>
          </div>
          <div class="mt-4 pt-3 border-t border-slate-700 flex justify-between items-center">
            <span class="text-slate-500 text-xs">At your real hourly wage of $20/hr</span>
            <span class="text-indigo-400 text-xs font-semibold">97.0 hrs this month</span>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Feature Highlights ── -->
    <section id="features" class="px-6 md:px-12 py-32 max-w-6xl mx-auto">
      <h2 class="text-3xl md:text-4xl font-bold text-white text-center">
        Not another budgeting app.
      </h2>
      <p class="text-slate-400 text-center mt-4 text-lg max-w-2xl mx-auto">
        Every other app tells you what you spent. BudgetYoish tells you what it cost you.
      </p>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">

        <!-- Card 1: Life Energy Rate -->
        <div class="bg-slate-800 rounded-2xl p-7 border border-slate-700 border-t-2 border-t-indigo-500 flex flex-col">
          <div class="text-3xl mb-4">⏱️</div>
          <h3 class="text-white font-bold text-xl mb-3">Life Energy Rate</h3>
          <p class="text-slate-400 text-sm leading-relaxed flex-1">
            Your real hourly wage after commute, work clothes, decompression time, and every cost your job causes.
            Every transaction shows its true cost in hours of your life.
          </p>
          <p class="italic text-indigo-300 text-sm mt-4">
            "$200 car insurance = 10.0 hrs of your life"
          </p>
        </div>

        <!-- Card 2: FI Journey -->
        <div class="bg-slate-800 rounded-2xl p-7 border border-slate-700 border-t-2 border-t-green-500 flex flex-col">
          <div class="text-3xl mb-4">📈</div>
          <h3 class="text-white font-bold text-xl mb-3">Path to Freedom</h3>
          <p class="text-slate-400 text-sm leading-relaxed flex-1">
            Watch your crossover point — the day your investment income covers your expenses — update in real time
            as you invest more. Use the What If simulator to see how much each decision is worth in years of freedom.
          </p>
          <p class="italic text-green-300 text-sm mt-4">
            "Investing $500/mo more moves your freedom date by 6 years"
          </p>
        </div>

        <!-- Card 3: Monthly Reflection -->
        <div class="bg-slate-800 rounded-2xl p-7 border border-slate-700 border-t-2 border-t-violet-500 flex flex-col">
          <div class="text-3xl mb-4">🪞</div>
          <h3 class="text-white font-bold text-xl mb-3">Monthly Reflection</h3>
          <p class="text-slate-400 text-sm leading-relaxed flex-1">
            Rate every spending category: too little, just right, too much. Answer the questions YMOYL actually asks.
            Which spending brought real fulfillment? What felt like wasted life energy? One change for next month.
          </p>
          <p class="italic text-violet-300 text-sm mt-4">
            "The app that asks if your spending made you happy"
          </p>
        </div>

      </div>
    </section>

    <!-- ── CTA Footer ── -->
    <section class="bg-gradient-to-b from-slate-950 to-indigo-950 px-6 py-32 text-center">
      <h2 class="text-3xl md:text-4xl font-bold text-white">
        Ready to see what your spending really costs?
      </h2>
      <p class="text-slate-400 text-center mt-4 text-lg max-w-xl mx-auto">
        Free to use. No credit card. Just honesty about where your money — and your life — is going.
      </p>
      <router-link
        to="/login"
        class="inline-block mt-10 px-10 py-5 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl font-bold text-xl transition"
      >
        Get started free →
      </router-link>

      <p class="mt-16 text-slate-600 text-sm">
        BudgetYoish · Built on Your Money or Your Life principles · budgetyoish.com
      </p>
    </section>

  </div>
</template>

<script setup>
const mockTransactions = [
  { label: 'Rent / Mortgage', amount: '–$1,400', hrs: '70.0' },
  { label: 'Groceries',       amount: '–$400',   hrs: '20.0' },
  { label: 'Dining Out',      amount: '–$120',   hrs: '6.0'  },
  { label: 'Coffee Shop',     amount: '–$20',    hrs: '1.0'  },
]
</script>
