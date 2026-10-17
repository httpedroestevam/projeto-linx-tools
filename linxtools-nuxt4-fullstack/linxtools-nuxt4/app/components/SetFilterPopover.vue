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
  <div class="set-filter-popover">
    <button
      class="set-filter-trigger"
      :class="{
        'filter-active': active,
        'filter-open': open,
        'set-filter-trigger-compact': compact,
      }"
      type="button"
      :aria-label="`Filtrar ${label}`"
      :aria-expanded="open"
      :aria-controls="`${id}-panel`"
      :title="`Filtrar ${label}`"
      @click.stop="emit('toggle')"
    >
      <svg
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
    </button>
    <div
      v-if="open"
      :id="`${id}-panel`"
      class="set-filter-panel"
      :class="{ 'set-filter-panel-right': align === 'right' }"
      role="group"
      :aria-label="`Filtro de ${label}`"
      @click.stop
    >
      <label class="set-filter-search-label" :for="`${id}-search`">
        Pesquisar opções
      </label>
      <input
        :id="`${id}-search`"
        v-model="search"
        class="set-filter-search"
        type="search"
        placeholder="Pesquisar..."
      />
      <label class="set-filter-choice set-filter-select-all">
        <input
          type="checkbox"
          :checked="allVisibleSelected"
          :disabled="!visibleOptions.length"
          @change="toggleVisibleOptions"
        />
        <span>Selecionar tudo</span>
      </label>
      <div class="set-filter-options">
        <label
          v-for="option in visibleOptions"
          :key="option.value"
          class="set-filter-choice"
        >
          <input
            type="checkbox"
            :checked="isSelected(option.value)"
            @change="toggleOption(option.value)"
          />
          <span>{{ option.label }}</span>
        </label>
        <p v-if="!visibleOptions.length" class="set-filter-empty">
          Nenhuma opção encontrada.
        </p>
      </div>
      <div class="set-filter-footer">
        <span>{{ modelValue === null ? options.length : modelValue.length }} selecionada(s)</span>
        <button
          class="set-filter-clear"
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

<style scoped>
.set-filter-popover {
  position: relative;
  display: inline-flex;
  flex: 0 0 auto;
}
.set-filter-trigger {
  display: inline-grid;
  width: 26px;
  height: 26px;
  padding: 5px;
  place-items: center;
  border: 1px solid transparent;
  border-radius: 6px;
  background: transparent;
  color: #77738a;
  cursor: pointer;
}
.set-filter-trigger-compact {
  width: 16px;
  height: 24px;
  padding: 0;
  border-radius: 4px;
}
.set-filter-trigger svg {
  width: 15px;
  height: 15px;
}
.set-filter-trigger-compact svg {
  width: 16px;
  height: 16px;
}
.set-filter-trigger:hover,
.set-filter-trigger.filter-open {
  border-color: #d9c9ef;
  background: #f5f0fc;
  color: var(--purple-dark);
}
.set-filter-trigger.filter-active {
  color: var(--purple);
}
.set-filter-trigger.filter-active::after {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--purple);
  content: "";
}
.set-filter-panel {
  position: absolute;
  z-index: 30;
  top: calc(100% + 5px);
  left: 0;
  width: 250px;
  max-width: min(250px, 80vw);
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 12px 30px rgba(38, 25, 59, 0.18);
  color: var(--ink);
  font-size: 13px;
  font-weight: 400;
  text-align: left;
  white-space: normal;
}
.set-filter-panel-right {
  right: 0;
  left: auto;
}
.set-filter-search-label {
  display: block;
  margin-bottom: 5px;
  color: var(--gray);
  font-size: 11px;
  font-weight: 600;
}
.set-filter-search {
  width: 100%;
  min-width: 0;
  margin-bottom: 8px;
  padding: 7px 9px;
  border: 1px solid var(--border);
  border-radius: 7px;
  background: #fff;
  color: var(--ink);
  font: inherit;
  opacity: 1;
}
.set-filter-search::placeholder {
  color: #9ca3af;
  opacity: 0.4;
}
.set-filter-options {
  max-height: 210px;
  overflow-y: auto;
  overscroll-behavior: contain;
}
.set-filter-choice {
  display: flex;
  min-height: 32px;
  align-items: center;
  gap: 8px;
  padding: 5px 4px;
  border-radius: 5px;
  cursor: pointer;
}
.set-filter-choice:hover {
  background: #f8f5fc;
}
.set-filter-choice input {
  flex: 0 0 auto;
  width: 15px;
  height: 15px;
  margin: 0;
  accent-color: var(--purple);
}
.set-filter-choice span {
  overflow-wrap: anywhere;
}
.set-filter-select-all {
  margin-bottom: 4px;
  border-bottom: 1px solid #eeeaf3;
  border-radius: 0;
  font-weight: 600;
}
.set-filter-empty {
  margin: 8px 4px;
  color: var(--gray);
}
.set-filter-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #eeeaf3;
  color: var(--gray);
  font-size: 11px;
}
.set-filter-clear {
  padding: 4px 6px;
  border: 0;
  border-radius: 5px;
  background: transparent;
  color: var(--purple-dark);
  font: inherit;
  cursor: pointer;
}
.set-filter-clear:hover:not(:disabled) {
  background: #f5f0fc;
}
.set-filter-clear:disabled {
  color: #a5a1ad;
  cursor: default;
}
</style>
