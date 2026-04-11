<template>
  <main class="mx-auto max-w-7xl px-4 pb-28 pt-2 sm:px-6 lg:px-8">
    <section class="rounded-[2.5rem] border border-white/10 bg-[#0a0a0a]/80 p-5 shadow-2xl backdrop-blur-xl sm:p-6 lg:p-8">
      <div class="flex flex-col gap-6 md:flex-row md:items-center">
        <div class="relative mx-auto w-full max-w-[18rem] overflow-hidden rounded-[2rem] shadow-2xl md:mx-0">
          <NuxtImg
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAp8NSIM0IlSZxzqqXeB0juZeYLHOUs83iscHpWSn6fUsf8iQH4KwOfrim_ZUZh2ESiovpMQ8ptVkl4Zm_fghSUxeZPlgDpIQUflxiptJKTG-IBpSvTFSc0gURPYQjmVAtB5JHIzNUVJN0NwaOEk78rxxYkgHEzONYutLHC0DHa9xkGzuEicRJFJMTXXQe2tKgbwpXSSkMgXX2McotIJ98dBX9Nq9hc5AHVcn7nJ244eLjwWn1oUh6Yv48Dji7c_aKdK5nxqV9dsU4U"
            alt="Premium hardback book cover with minimalist typography and abstract deep blue patterns on a dark studio background"
            format="webp"
            loading="lazy"
            class="h-full w-full object-cover"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
        </div>

        <div class="flex-1 space-y-5 text-center md:text-left">
          <div class="space-y-2">
            <span class="inline-flex rounded-full bg-violet-600/10 px-3 py-1 text-xs uppercase tracking-[0.28em] text-violet-300">Currently Reading</span>
            <h2 class="text-4xl font-semibold tracking-tight text-white sm:text-5xl">The Midnight Archive</h2>
            <p class="text-sm italic text-gray-300 sm:text-base">by Elena Thorne</p>
          </div>

          <div class="space-y-4 rounded-[2rem] bg-gray-950/70 p-5 text-left">
            <div class="flex items-center justify-between text-sm uppercase tracking-[0.25em] text-gray-500">
              <span>Progress</span>
              <span class="text-violet-300">64%</span>
            </div>
            <div class="h-2.5 rounded-full bg-white/5">
              <div class="h-full w-[64%] rounded-full bg-gradient-to-r from-violet-500 to-violet-300 shadow-[0_0_18px_rgba(168,85,247,0.35)]"></div>
            </div>
            <p class="text-xs uppercase tracking-[0.24em] text-gray-400">Last read 2 hours ago • Page 248 of 382</p>
          </div>

          <button class="w-full rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-500 px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white shadow-lg transition hover:brightness-[1.05] md:w-auto">
            Continue Reading
          </button>
        </div>
      </div>
    </section>

    <section class="mt-10 space-y-6">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <h3 class="text-3xl font-semibold tracking-tight text-white">Recent Additions</h3>
        <NuxtLink to="/" class="text-sm uppercase tracking-[0.3em] text-violet-300 transition hover:text-white">View All</NuxtLink>
      </div>

      <div class="flex gap-4 overflow-x-auto pb-3 hide-scrollbar">
        <div class="shrink-0 w-40 md:w-44 rounded-[1.8rem] overflow-hidden shadow-xl transition-transform duration-300 hover:-translate-y-1">
          <NuxtImg
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDxWMu4EDYmgws17aNVX2w5aCKAbBy2e341mrBy26-hCEZguiTQvjgImNh9ePy5IlklEbtjJ5u0USufL49xWZQpm7GdQf9iQXAbObbwhxIhlgHEuIRtQITQZoI1vtpTwGjQ_d4HO2n7veIa7ezbHd9MmABSJRi7ZqhTS9rfitVfBC6VkQ3cbB-_f4lUnnL_fqoC70uFDsUn16Z5Zv8dPJtOWxpW9TEr_3Hc2NUwjCwLRNmIMq9H94UQ2S9ghNhKvc5I1wZHPj51FdUK"
            alt="Rustic classic novel cover with gold leaf lettering on a dark leather texture background"
            format="webp"
            loading="lazy"
            class="h-full w-full object-cover"
          />
          <div class="space-y-1 px-1.5 py-2">
            <h4 class="text-sm font-semibold text-white">Echoes of Silence</h4>
            <p class="text-[10px] uppercase tracking-[0.22em] text-gray-400">Julian Vance</p>
          </div>
        </div>
        <div class="shrink-0 w-40 md:w-44 rounded-[1.8rem] overflow-hidden shadow-xl transition-transform duration-300 hover:-translate-y-1">
          <NuxtImg
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuC0z1AAJiG0YzFYx8OQz9hz863FfNi079C35nId21mLwaqLRwh72f3LlPJu642kuj1txSyMus4KUV6a3mOX1IfHwEUfZB15oeFbjNURlGwH9nVxaLOsnvIcV0a107GyUMpbZN4JmMf-XlafmDu9O9EsVMK3RoxUXIzXKXww8khdGwm1QWK9Y7LxYpIzNjRHou5RKn8pIm-5nQKJGMmJRjx1uaDVt_gITwPdeyY5Erl7s3pK9GZTBjcnPZb_hZpwa3SD2kbVpaAhm2ie"
            alt="Modern sci-fi book cover featuring a glowing neon geometric structure in a dark void"
            format="webp"
            loading="lazy"
            class="h-full w-full object-cover"
          />
          <div class="space-y-1 px-1.5 py-2">
            <h4 class="text-sm font-semibold text-white">The Vector Gate</h4>
            <p class="text-[10px] uppercase tracking-[0.22em] text-gray-400">Aris Thorne</p>
          </div>
        </div>
        <div class="shrink-0 w-40 md:w-44 rounded-[1.8rem] overflow-hidden shadow-xl transition-transform duration-300 hover:-translate-y-1">
          <NuxtImg
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDU4HHKTBVcouB7euVnUxx6Aep-egcTmOkuNPMHMxH68HED2UN4Q0CiXSArF-B5p3hlX09kbOrO693oljy3tQ7R0IT8LmuOxyMQIyKgl_N01PhUu4Pp_vYGg8toOyXzq2-qrlUQgQ8cv3Yp9VlXQkNxZBsvlkT8i8JZy4okp8WAzkw78BXzmB6vcjNqPkLPd-3FlCIIbA3O7n72jGO7m_czelakG0s7yC4wN66gXHKFUUZVIyZ76q6oq8EnBm1glOJSG6zfR-XSKLOb"
            alt="Ethereal abstract book cover with swirls of purple and black ink in water"
            format="webp"
            loading="lazy"
            class="h-full w-full object-cover"
          />
          <div class="space-y-1 px-1.5 py-2">
            <h4 class="text-sm font-semibold text-white">Ink &amp; Shadow</h4>
            <p class="text-[10px] uppercase tracking-[0.22em] text-gray-400">Sarah Grey</p>
          </div>
        </div>
      </div>
    </section>

    <section class="mt-10 space-y-6">
      <h3 class="text-3xl font-semibold tracking-tight text-white">Your Library</h3>

      <div class="mt-8 flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
        <button class="whitespace-nowrap rounded-full border border-white/10 bg-white/5 px-5 py-2 text-xs uppercase tracking-[0.28em] text-gray-200 transition hover:border-violet-400/40 hover:text-white active:bg-violet-600/10 active:text-violet-300">All</button>
        <button class="whitespace-nowrap rounded-full border border-white/10 bg-white/5 px-5 py-2 text-xs uppercase tracking-[0.28em] text-gray-200 transition hover:border-violet-400/40 hover:text-white">Fiction</button>
        <button class="whitespace-nowrap rounded-full border border-white/10 bg-white/5 px-5 py-2 text-xs uppercase tracking-[0.28em] text-gray-200 transition hover:border-violet-400/40 hover:text-white">Non-fiction</button>
        <button class="whitespace-nowrap rounded-full border border-white/10 bg-white/5 px-5 py-2 text-xs uppercase tracking-[0.28em] text-gray-200 transition hover:border-violet-400/40 hover:text-white">Sci-fi</button>
        <button class="whitespace-nowrap rounded-full border border-white/10 bg-white/5 px-5 py-2 text-xs uppercase tracking-[0.28em] text-gray-200 transition hover:border-violet-400/40 hover:text-white">History</button>
      </div>

      <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        <template v-if="pending">
          <BookSkeleton v-for="index in 10" :key="index" />
        </template>
        <template v-else>
          <BookCard
            v-for="book in library"
            :key="book.id || book.title"
            :book="book"
          />
        </template>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import BookCard from '~/components/BookCard.vue'
import BookSkeleton from '~/components/BookSkeleton.vue'

const { data: books, pending } = await useFetch<any[]>('/api/books')
const library = computed(() => books.value || [])
</script>
