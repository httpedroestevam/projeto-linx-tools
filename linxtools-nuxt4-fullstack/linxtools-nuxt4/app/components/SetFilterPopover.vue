<script setup lang="ts">
interface FilterChoice {
  value: string;
  label: string;
}

const props = defineProps<{
  id: string;
  label: string;
  options: FilterChoice[];
  modelValue: string[] | null;
  open: boolean;
  active: boolean;
  compact?: boolean;
  align?: "left" | "right";
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string[] | null];
  toggle: [];
}>();

const search = ref("");
const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim();
const visibleOptions = computed(() => {
  const query = normalize(search.value);
  return props.options.filter(
    (option) => !query || normalize(option.label).includes(query),
  );
});
const allVisibleSelected = computed(
  () =>
    visibleOptions.value.length > 0 &&
    visibleOptions.value.every(
      (option) =>
        props.modelValue === null ||
        props.modelValue.includes(option.value),
    ),
);
const isSelected = (value: string) =>
  props.modelValue === null || props.modelValue.includes(value);

function emitSelection(values: string[]) {
  emit(
    "update:modelValue",
    values.length === props.options.length ? null : values,
  );
}

function toggleOption(value: string) {
  const selected =
    props.modelValue === null
      ? props.options.map((option) => option.value)
      : [...props.modelValue];
  emitSelection(
    selected.includes(value)
      ? selected.filter((item) => item !== value)
      : [...selected, value],
  );
}

function toggleVisibleOptions() {
  const visibleValues = new Set(
    visibleOptions.value.map((option) => option.value),
  );
  const selected =
    props.modelValue === null
      ? props.options.map((option) => option.value)
      : [...props.modelValue];
  emitSelection(
    allVisibleSelected.value
      ? selected.filter((value) => !visibleValues.has(value))
      : [
          ...selected,
          ...visibleOptions.value
            .map((option) => option.value)
            .filter((value) => !selected.includes(value)),
        ],
  );
}
</script>

<template>
  <div class="relative inline-flex flex-[0_0_auto]">
    <button
      class="relative inline-grid h-[26px] w-[26px] cursor-pointer place-items-center rounded-md border border-transparent bg-transparent p-[5px] text-[#77738a] hover:border-[#d9c9ef] hover:bg-[#f5f0fc] hover:text-[var(--purple-dark)]"
      :class="[
        compact ? 'h-6 w-4 rounded' : '',
        compact ? 'p-0' : '',
        active ? 'text-[var(--purple)]' : '',
        open ? 'border-[#d9c9ef] bg-[#f5f0fc] text-[var(--purple-dark)]' : '',
      ]"
      type="button"
      :aria-label="`Filtrar ${label}`"
      :aria-expanded="open"
      :aria-controls="`${id}-panel`"
      :title="`Filtrar ${label}`"
      @click.stop="emit('toggle')"
    >
      <svg
        :class="compact ? 'h-4 w-4' : 'h-[15px] w-[15px]'"
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M4 5h16l-6.5 7.5V19l-3 1v-7.5L4 5Z" />
      </svg>
      <span
        v-if="active"
        aria-hidden="true"
        class="absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full bg-[var(--purple)]"
      />
    </button>
    <div
      v-if="open"
      :id="`${id}-panel`"
      class="absolute left-0 top-[calc(100%+5px)] z-[30] w-[250px] max-w-[min(250px,80vw)] whitespace-normal rounded-[10px] border border-[var(--border)] bg-white p-3 text-left text-[13px] font-normal text-[var(--ink)] shadow-[0_12px_30px_rgba(38,25,59,0.18)]"
      :class="align === 'right' ? 'left-auto right-0' : ''"
      role="group"
      :aria-label="`Filtro de ${label}`"
      @click.stop
    >
      <label class="mb-[5px] block text-[11px] font-semibold text-[var(--gray)]" :for="`${id}-search`">
        Pesquisar opções
      </label>
      <input
        :id="`${id}-search`"
        v-model="search"
        class="mb-2 h-auto w-full min-w-0 rounded-[7px] border border-[var(--border)] bg-white px-[9px] py-[7px] text-[13px] text-[var(--ink)] opacity-100 placeholder:text-[#9ca3af] placeholder:opacity-40"
        type="search"
        placeholder="Pesquisar..."
      />
      <label class="mb-1 flex min-h-8 cursor-pointer items-center gap-2 rounded-t-none border-b border-[#eeeaf3] px-1 py-[5px] font-semibold hover:bg-[#f8f5fc] [&_input]:m-0 [&_input]:h-[15px] [&_input]:w-[15px] [&_input]:accent-[var(--purple)]">
        <input
          type="checkbox"
          :checked="allVisibleSelected"
          :disabled="!visibleOptions.length"
          @change="toggleVisibleOptions"
        />
        <span>Selecionar tudo</span>
      </label>
      <div class="max-h-[210px] overscroll-contain overflow-y-auto">
        <label
          v-for="option in visibleOptions"
          :key="option.value"
          class="flex min-h-8 cursor-pointer items-center gap-2 rounded-[5px] px-1 py-[5px] hover:bg-[#f8f5fc] [&_span]:[overflow-wrap:anywhere] [&_input]:m-0 [&_input]:h-[15px] [&_input]:w-[15px] [&_input]:flex-[0_0_auto] [&_input]:accent-[var(--purple)]"
        >
          <input
            type="checkbox"
            :checked="isSelected(option.value)"
            @change="toggleOption(option.value)"
          />
          <span>{{ option.label }}</span>
        </label>
        <p v-if="!visibleOptions.length" class="mx-1 my-2 text-[var(--gray)]">
          Nenhuma opção encontrada.
        </p>
      </div>
      <div class="mt-2 flex items-center justify-between gap-2 border-t border-[#eeeaf3] pt-2 text-[11px] text-[var(--gray)]">
        <span>{{ modelValue === null ? options.length : modelValue.length }} selecionada(s)</span>
        <button
          class="cursor-pointer rounded-[5px] border-0 bg-transparent px-1.5 py-1 text-[var(--purple-dark)] hover:bg-[#f5f0fc] disabled:cursor-default disabled:text-[#a5a1ad]"
          type="button"
          :disabled="!active"
          @click="emit('update:modelValue', null)"
        >
          Limpar filtro
        </button>
      </div>
    </div>
  </div>
</template>
