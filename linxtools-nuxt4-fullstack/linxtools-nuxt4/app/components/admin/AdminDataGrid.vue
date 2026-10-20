<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";

type AdminDataGridRow = Record<string, unknown>;

interface AdminDataGridColumn {
  key: string;
  label: string;
  filter?: "text" | "set" | false;
  sortable?: boolean;
  sortType?: "text" | "number" | "date";
  width?: number;
  value?: (row: AdminDataGridRow) => unknown;
  filterValue?: (row: AdminDataGridRow) => unknown;
  sortValue?: (row: AdminDataGridRow) => unknown;
}

const props = defineProps<{
  rows: AdminDataGridRow[];
  columns: AdminDataGridColumn[];
  storageKey: string;
  reorderable?: boolean;
  manualOrderToggle?: boolean;
}>();
const emit = defineEmits<{
  reorder: [ids: string[]];
  "filtered-count": [count: number];
}>();
const filters = ref<Record<string, string>>({});
const selections = ref<Record<string, string[] | null>>({});
const sortBy = ref<string | null>(null);
const sortDirection = ref<"asc" | "desc" | null>(null);
const page = ref(1);
const pageSize = ref(10);
const widths = ref<Record<string, number>>({});
const availableSetOptions = ref<Record<string, string[]>>({});
const openFilter = ref<string | null>(null);
const optionSearch = ref("");
const resizing = ref<{ key: string; startX: number; startWidth: number } | null>(
  null,
);
const manualOrderMode = ref(false);
const draggingId = ref<string | null>(null);
const dropId = ref<string | null>(null);
const dropPosition = ref<"before" | "after">("after");

const columnWidth = (column: AdminDataGridColumn) =>
  widths.value[column.key] ?? column.width ?? 180;
const valueOf = (row: AdminDataGridRow, column: AdminDataGridColumn) =>
  column.value ? column.value(row) : row[column.key];
const filterValueOf = (row: AdminDataGridRow, column: AdminDataGridColumn) =>
  column.filterValue ? column.filterValue(row) : valueOf(row, column);
const asText = (value: unknown) => (value == null ? "" : String(value));
const normalize = (value: unknown) =>
  asText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");
const optionsFor = (column: AdminDataGridColumn) =>
  [...new Set(props.rows.map((row) => asText(valueOf(row, column))))].sort(
    (a, b) => a.localeCompare(b, "pt-BR", { sensitivity: "base" }),
  );
const visibleOptions = (column: AdminDataGridColumn) =>
  optionsFor(column).filter((value) =>
    normalize(value).includes(normalize(optionSearch.value)),
  );
const selected = (column: AdminDataGridColumn, value: string) => {
  const selectedValues = selections.value[column.key];
  return selectedValues === null || selectedValues === undefined
    ? true
    : selectedValues.includes(value);
};
const allVisibleSelected = (column: AdminDataGridColumn) =>
  visibleOptions(column).every((value) => selected(column, value));
const filteredRows = computed(() =>
  props.rows.filter((row) =>
    props.columns.every((column) => {
      const text = normalize(filterValueOf(row, column));
      if (filters.value[column.key] && !text.includes(normalize(filters.value[column.key])))
        return false;
      if (
        column.filter === "set" &&
        !selected(column, asText(valueOf(row, column)))
      )
        return false;
      return true;
    }),
  ),
);
const sortedRows = computed(() => {
  if (!sortBy.value || !sortDirection.value) return filteredRows.value;
  const column = props.columns.find((item) => item.key === sortBy.value);
  if (!column) return filteredRows.value;
  const multiplier = sortDirection.value === "asc" ? 1 : -1;
  return [...filteredRows.value].sort((left, right) => {
    const a = column.sortValue ? column.sortValue(left) : valueOf(left, column);
    const b = column.sortValue ? column.sortValue(right) : valueOf(right, column);
    if (column.sortType === "number") return (Number(a) - Number(b)) * multiplier;
    if (column.sortType === "date")
      return (Date.parse(asText(a)) - Date.parse(asText(b))) * multiplier;
    return asText(a).localeCompare(asText(b), "pt-BR", {
      numeric: true,
      sensitivity: "base",
    }) * multiplier;
  });
});
const pageCount = computed(() =>
  Math.max(1, Math.ceil(sortedRows.value.length / pageSize.value)),
);
const pageRows = computed(() =>
  sortedRows.value.slice((page.value - 1) * pageSize.value, page.value * pageSize.value),
);
const totalWidth = computed(() =>
  props.columns.reduce((total, column) => total + columnWidth(column), 112) +
  (props.reorderable ? 36 : 0),
);
const hasActiveFilters = computed(() =>
  props.columns.some(
    (column) =>
      Boolean(filters.value[column.key]) ||
      (selections.value[column.key] !== null &&
        selections.value[column.key] !== undefined &&
        selections.value[column.key]!.length < optionsFor(column).length),
  ),
);
const reorderAllowed = computed(
  () => Boolean(props.reorderable) && !sortBy.value && !hasActiveFilters.value,
);
const manualOrderToggleVisible = computed(
  () => Boolean(props.reorderable) && props.manualOrderToggle !== false,
);
const firstRowNumber = computed(() =>
  sortedRows.value.length ? (page.value - 1) * pageSize.value + 1 : 0,
);
const lastRowNumber = computed(() =>
  Math.min(page.value * pageSize.value, sortedRows.value.length),
);

function sort(column: AdminDataGridColumn) {
  if (column.sortable === false) return;
  if (sortBy.value !== column.key) {
    sortBy.value = column.key;
    sortDirection.value = "asc";
  } else if (sortDirection.value === "asc") {
    sortDirection.value = "desc";
  } else if (sortDirection.value === "desc") {
    sortBy.value = null;
    sortDirection.value = null;
  } else {
    sortDirection.value = "asc";
  }
  page.value = 1;
}
function toggleFilter(column: AdminDataGridColumn) {
  optionSearch.value = "";
  openFilter.value = openFilter.value === column.key ? null : column.key;
}
function toggleValue(column: AdminDataGridColumn, value: string, checked: boolean) {
  const current = new Set(
    selections.value[column.key] ?? optionsFor(column),
  );
  if (checked) current.add(value);
  else current.delete(value);
  selections.value[column.key] = [...current];
  page.value = 1;
}
function toggleVisibleOptions(column: AdminDataGridColumn) {
  const visible = visibleOptions(column);
  const current = new Set(selections.value[column.key] ?? optionsFor(column));
  const shouldSelect = !visible.every((value) => current.has(value));
  for (const value of visible) {
    if (shouldSelect) current.add(value);
    else current.delete(value);
  }
  selections.value[column.key] = [...current];
  page.value = 1;
}
function clearFilter(column: AdminDataGridColumn) {
  filters.value[column.key] = "";
  selections.value[column.key] = null;
  page.value = 1;
}
function clearAllFilters() {
  filters.value = {};
  selections.value = {};
  page.value = 1;
}
function toggleManualOrder() {
  if (manualOrderMode.value) {
    manualOrderMode.value = false;
    pageSize.value = 10;
    page.value = 1;
    return;
  }
  if (!reorderAllowed.value) return;
  manualOrderMode.value = !manualOrderMode.value;
  pageSize.value = manualOrderMode.value ? Math.max(10, props.rows.length) : 10;
  page.value = 1;
}
function startRowDrag(event: DragEvent, row: AdminDataGridRow) {
  if (!manualOrderMode.value || !reorderAllowed.value) {
    event.preventDefault();
    return;
  }
  draggingId.value = String(row.id);
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", draggingId.value);
  }
}
function rowDragStartHandler(row: AdminDataGridRow) {
  return (event: DragEvent) => startRowDrag(event, row);
}
function moveRow(target: AdminDataGridRow) {
  if (!draggingId.value || !reorderAllowed.value) return;
  const sourceIndex = props.rows.findIndex(
    (row) => String(row.id) === draggingId.value,
  );
  const targetIndex = props.rows.findIndex(
    (row) => String(row.id) === String(target.id),
  );
  if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) {
    draggingId.value = null;
    dropId.value = null;
    return;
  }
  const rows = [...props.rows];
  const [moved] = rows.splice(sourceIndex, 1);
  const currentTargetIndex = rows.findIndex(
    (row) => String(row.id) === String(target.id),
  );
  if (currentTargetIndex < 0 || !moved) return;
  rows.splice(
    currentTargetIndex + (dropPosition.value === "after" ? 1 : 0),
    0,
    moved,
  );
  if (
    rows.every((row, index) => String(row.id) === String(props.rows[index]?.id))
  ) {
    finishRowDrag();
    return;
  }
  emit("reorder", rows.map((row) => String(row.id)));
  finishRowDrag();
}
function finishRowDrag() {
  draggingId.value = null;
  dropId.value = null;
  dropPosition.value = "after";
}
function handleRowDragOver(event: DragEvent, row: AdminDataGridRow) {
  if (!manualOrderMode.value || !reorderAllowed.value) return;
  dropId.value = String(row.id);
  const target = event.currentTarget;
  dropPosition.value =
    target instanceof HTMLElement &&
    event.clientY < target.getBoundingClientRect().top + target.offsetHeight / 2
      ? "before"
      : "after";
}
function resetWidths() {
  widths.value = Object.fromEntries(
    props.columns.map((column) => [column.key, column.width ?? 180]),
  );
  persistWidths();
}
function persistWidths() {
  try {
    localStorage.setItem(
      `admin-grid:${props.storageKey}`,
      JSON.stringify(widths.value),
    );
  } catch (cause) {
    console.warn("Não foi possível salvar as larguras da tabela.", cause);
  }
}
function startResize(event: PointerEvent, column: AdminDataGridColumn) {
  event.preventDefault();
  resizing.value = {
    key: column.key,
    startX: event.clientX,
    startWidth: columnWidth(column),
  };
  window.addEventListener("pointermove", resizeColumn);
  window.addEventListener("pointerup", finishResize, { once: true });
  window.addEventListener("pointercancel", finishResize, { once: true });
}
function resizeColumn(event: PointerEvent) {
  if (!resizing.value) return;
  widths.value[resizing.value.key] = Math.max(
    90,
    resizing.value.startWidth + event.clientX - resizing.value.startX,
  );
}
function finishResize() {
  if (!resizing.value) return;
  resizing.value = null;
  window.removeEventListener("pointermove", resizeColumn);
  persistWidths();
}
function closeFilterOnOutside(event: PointerEvent) {
  if (
    openFilter.value &&
    !(event.target as HTMLElement).closest(".admin-grid-filter")
  )
    openFilter.value = null;
}
function closeFilterOnEscape(event: KeyboardEvent) {
  if (event.key === "Escape") openFilter.value = null;
}

watch(
  () => [props.rows, props.columns],
  () => {
    for (const column of props.columns) {
      if (column.filter === "set") {
        const available = new Set(optionsFor(column));
        const previous = availableSetOptions.value[column.key] ?? [];
        if (selections.value[column.key]) {
          const hadAllPrevious = previous.every((value) =>
            selections.value[column.key]!.includes(value),
          );
          selections.value[column.key] = selections.value[column.key]!.filter(
            (value) => available.has(value),
          );
          if (hadAllPrevious) {
            for (const value of available)
              if (!previous.includes(value))
                selections.value[column.key]!.push(value);
          }
        }
        availableSetOptions.value[column.key] = [...available];
      }
      widths.value[column.key] ??= column.width ?? 180;
    }
    page.value = Math.min(page.value, pageCount.value);
  },
  { deep: true },
);
watch(
  () => [props.reorderable, props.manualOrderToggle] as const,
  ([reorderable, manualToggle]) => {
    if (reorderable && manualToggle === false) manualOrderMode.value = true;
  },
  { immediate: true },
);
watch(
  () => filteredRows.value.length,
  (count) => emit("filtered-count", count),
  { immediate: true },
);
watch([filters, selections, pageSize], () => (page.value = 1), { deep: true });
onMounted(() => {
  try {
    const saved = localStorage.getItem(`admin-grid:${props.storageKey}`);
    if (saved) {
      const parsed = JSON.parse(saved) as Record<string, unknown>;
      for (const column of props.columns) {
        const width = parsed[column.key];
        if (typeof width === "number" && Number.isFinite(width))
          widths.value[column.key] = Math.max(90, width);
      }
    }
  } catch (cause) {
    console.warn("Não foi possível carregar as larguras da tabela.", cause);
  }
  document.addEventListener("pointerdown", closeFilterOnOutside);
  document.addEventListener("keydown", closeFilterOnEscape);
  emit("filtered-count", filteredRows.value.length);
});
onBeforeUnmount(() => {
  document.removeEventListener("pointerdown", closeFilterOnOutside);
  document.removeEventListener("keydown", closeFilterOnEscape);
  window.removeEventListener("pointermove", resizeColumn);
});
</script>

<template>
  <div class="min-w-0 text-[13px] text-[#393347] [&_tbody_tr:hover]:bg-[#faf9fc] [&_th]:box-border [&_td]:box-border [&_th]:[overflow-wrap:anywhere] [&_td]:[overflow-wrap:anywhere] [&_th]:border-b [&_td]:border-b [&_th]:border-r [&_td]:border-r [&_th]:border-[#ebe7f1] [&_td]:border-[#ebe7f1] [&_th]:px-3 [&_td]:px-3 [&_th]:py-2 [&_td]:py-2 [&_th]:text-left [&_td]:text-left [&_th:last-child]:border-r-0 [&_td:last-child]:border-r-0">
    <div class="overflow-x-auto rounded-[10px] border border-[#e8e4ef]">
      <table class="table-fixed border-separate border-spacing-0 text-[13px] text-[#393347]" :style="{ width: `${totalWidth}px` }">
        <colgroup>
          <col v-if="reorderable" class="w-9" />
          <col v-for="column in columns" :key="column.key" :style="{ width: `${columnWidth(column)}px` }" />
          <col class="w-28" />
        </colgroup>
        <thead>
          <tr>
            <th v-if="reorderable" class="relative h-9 bg-[#f3eff9] px-3 py-0 text-xs font-semibold text-[#453663]" aria-label="Reordenação manual" />
            <th v-for="column in columns" :key="column.key" class="relative h-9 bg-[#f3eff9] px-3 py-0 text-xs font-semibold text-[#453663]">
              <button
                class="flex h-[35px] w-full cursor-pointer items-center justify-center gap-[5px] border-0 bg-transparent p-0 font-[inherit] text-inherit"
                type="button"
                :disabled="column.sortable === false"
                :aria-label="`Ordenar por ${column.label}`"
                :aria-sort="sortBy === column.key ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'"
                @click="sort(column)"
              >
                {{ column.label }}
                <span v-if="sortBy === column.key">{{ sortDirection === "asc" ? "▲" : "▼" }}</span>
              </button>
              <span
                class="absolute -right-[3px] top-0 z-[2] h-full w-2 cursor-col-resize touch-none"
                role="separator"
                aria-orientation="vertical"
                :aria-label="`Redimensionar coluna ${column.label}`"
                title="Arraste para redimensionar; duplo clique para restaurar"
                @pointerdown="startResize($event, column)"
                @dblclick="widths[column.key] = column.width ?? 180; persistWidths()"
              />
            </th>
            <th class="relative h-9 bg-[#f3eff9] px-3 py-0 text-xs font-semibold text-[#453663]">Ações</th>
          </tr>
          <tr>
            <th v-if="reorderable" class="relative h-9 bg-[#f8f6fb] px-3 py-0 text-xs font-semibold text-[#453663]" />
            <th v-for="column in columns" :key="column.key" class="relative h-9 bg-[#f8f6fb] px-3 py-0 text-xs font-semibold text-[#453663]">
              <div class="admin-grid-filter relative flex h-[35px] items-center gap-2">
                <input
                  v-if="column.filter !== false"
                  v-model="filters[column.key]"
                  class="box-border h-6 w-full min-w-0 rounded-[5px] border border-[#ded8e8] bg-white px-[5px] py-0.5 text-[11px] text-[#292339] placeholder:text-[#9ca3af] placeholder:opacity-[.45]"
                  type="search"
                  :aria-label="`Filtrar ${column.label}`"
                  :placeholder="`Filtrar ${column.label.toLocaleLowerCase('pt-BR')}...`"
                />
                <button
                  v-if="column.filter === 'set'"
                  type="button"
                  class="grid h-6 w-5 flex-[0_0_20px] cursor-pointer place-items-center rounded border-0 bg-transparent p-0 text-[#766b89]"
                  :class="{ 'bg-[#ebe3f7] text-[#5d2fb1]': Boolean(filters[column.key]) || (selections[column.key] !== null && selections[column.key] !== undefined && selections[column.key]!.length < optionsFor(column).length) }"
                  :aria-label="`Selecionar valores de ${column.label}`"
                  :aria-expanded="openFilter === column.key"
                  @click.stop="toggleFilter(column)"
                >
                  <svg class="h-4 w-4" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 5h16l-6.5 7.5v5l-3 1.5v-6.5z" />
                  </svg>
                </button>
                <div v-if="openFilter === column.key" class="absolute right-0 top-[calc(100%+4px)] z-20 max-h-[280px] w-[220px] overflow-y-auto rounded-[9px] border border-[#e5deee] bg-white p-[10px] text-xs text-[#393347] shadow-[0_8px_24px_rgb(31_22_48_/_16%)]" @pointerdown.stop>
                  <input class="mb-1.5 box-border h-6 w-full min-w-0 rounded-[5px] border border-[#ded8e8] bg-white px-[5px] py-0.5 text-[11px] text-[#292339] placeholder:text-[#9ca3af] placeholder:opacity-[.45]" v-model="optionSearch" type="search" placeholder="Pesquisar opções..." aria-label="Pesquisar opções" />
                  <label class="flex min-h-[30px] items-center gap-2 [overflow-wrap:anywhere] [&_input]:m-0">
                    <input type="checkbox" :checked="allVisibleSelected(column)" @change="toggleVisibleOptions(column)" />
                    Selecionar tudo
                  </label>
                  <label v-for="value in visibleOptions(column)" :key="value" class="flex min-h-[30px] items-center gap-2 [overflow-wrap:anywhere] [&_input]:m-0">
                    <input type="checkbox" :checked="selected(column, value)" @change="toggleValue(column, value, ($event.target as HTMLInputElement).checked)" />
                    <span>{{ value || "Sem valor" }}</span>
                  </label>
                  <button class="mt-1.5 w-full cursor-pointer rounded-[5px] border border-[#e5deee] bg-[#faf9fc] p-1.5 text-[#5d2fb1]" type="button" @click="clearFilter(column); openFilter = null">Limpar filtro</button>
                </div>
              </div>
            </th>
            <th />
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in pageRows"
            :key="String(row.id)"
            :data-admin-grid-row="String(row.id)"
            :data-notice-row="manualOrderToggle === false ? String(row.id) : undefined"
            :class="{
              'opacity-[.45]': draggingId === String(row.id),
              '[&>td]:shadow-[inset_0_2px_#7544bd]': dropId === String(row.id) && dropPosition === 'before',
              '[&>td]:shadow-[inset_0_-2px_#7544bd]': dropId === String(row.id) && dropPosition === 'after',
            }"
            @dragover.prevent="handleRowDragOver($event, row)"
            @drop.prevent="moveRow(row)"
          >
            <td
              v-if="reorderable"
              class="!p-[2px] !text-center touch-none"
            >
              <slot
                name="drag-handle"
                :row="row"
                :can-reorder="reorderAllowed"
                :draggable="manualOrderMode && reorderAllowed"
                :on-drag-start="rowDragStartHandler(row)"
                :on-drag-end="finishRowDrag"
              >
              <button
                type="button"
                class="h-7 w-7 cursor-grab touch-none rounded-[5px] border-0 bg-transparent text-[#776d87] active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-[.45]"
                :disabled="!manualOrderMode || !reorderAllowed"
                :draggable="manualOrderMode && reorderAllowed"
                :aria-label="`Arrastar ${String(row.title || row.name || 'registro')}`"
                :title="manualOrderMode ? 'Arraste para mudar a ordem' : 'Ative a ordenação manual para arrastar'"
                @dragstart="startRowDrag($event, row)"
                @dragend="finishRowDrag"
              >⋮⋮</button>
              </slot>
            </td>
            <td v-for="column in columns" :key="column.key">
              <slot :name="`cell-${column.key}`" :row="row" :value="valueOf(row, column)">
                {{ valueOf(row, column) ?? "—" }}
              </slot>
            </td>
            <td class="whitespace-nowrap"><slot name="actions" :row="row" /></td>
          </tr>
          <tr v-if="!pageRows.length">
            <td :colspan="columns.length + 1 + (reorderable ? 1 : 0)" class="p-6 text-center text-[#777181]">Nenhum registro corresponde aos filtros.</td>
          </tr>
        </tbody>
      </table>
    </div>
    <footer class="flex min-h-12 flex-wrap items-center justify-between gap-2.5 px-0.5 pt-2.5 text-xs text-[#6e687a] max-[620px]:justify-start">
      <label class="flex items-center gap-2">
        Itens por página
        <select class="min-h-[30px] rounded-md border border-[#e4dfeb] bg-white px-2 py-1 text-[#493a65]" v-model.number="pageSize" aria-label="Itens por página" :disabled="manualOrderMode">
          <option :value="10">10</option>
          <option :value="25">25</option>
          <option :value="50">50</option>
        </select>
      </label>
      <span>{{ firstRowNumber }}–{{ lastRowNumber }} de {{ sortedRows.length }}</span>
      <button
        v-if="hasActiveFilters"
        class="min-h-[30px] cursor-pointer rounded-md border border-[#e4dfeb] bg-white px-2 py-1 text-[#493a65] disabled:cursor-not-allowed disabled:opacity-[.45]"
        type="button"
        @click="clearAllFilters"
      >Limpar filtros</button>
      <div class="flex items-center gap-2">
        <button class="min-h-[30px] cursor-pointer rounded-md border border-[#e4dfeb] bg-white px-2 py-1 text-[#493a65] disabled:cursor-not-allowed disabled:opacity-[.45]" type="button" :disabled="page <= 1" @click="page--">Anterior</button>
        <span>Página {{ page }} de {{ pageCount }}</span>
        <button class="min-h-[30px] cursor-pointer rounded-md border border-[#e4dfeb] bg-white px-2 py-1 text-[#493a65] disabled:cursor-not-allowed disabled:opacity-[.45]" type="button" :disabled="page >= pageCount" @click="page++">Próxima</button>
      </div>
      <button
        v-if="manualOrderToggleVisible"
        class="min-h-[30px] cursor-pointer rounded-md border border-[#e4dfeb] bg-white px-2 py-1 text-[#493a65] disabled:cursor-not-allowed disabled:opacity-[.45]"
        type="button"
        :disabled="!manualOrderMode && !reorderAllowed"
        :title="reorderAllowed ? 'Permitir arrastar as linhas' : 'Limpe filtros e ordenação para reordenar'"
        @click="toggleManualOrder"
      >{{ manualOrderMode ? "Concluir ordenação" : "Ordenar manualmente" }}</button>
      <button class="min-h-[30px] cursor-pointer rounded-md border border-[#e4dfeb] bg-white px-2 py-1 text-[#493a65] disabled:cursor-not-allowed disabled:opacity-[.45]" type="button" @click="resetWidths">Restaurar larguras</button>
    </footer>
  </div>
</template>
