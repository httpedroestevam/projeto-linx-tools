<script setup lang="ts">
import type {
  Capability,
  Notice,
  NoticeOption,
  NoticeOptions,
  PortalConfig,
  ProfilePermissions,
  Role,
  User,
} from "../../shared/types";
type Section =
  | "overview"
  | "notices"
  | "videos"
  | "releases"
  | "links"
  | "users"
  | "settings";
type UserTab = "accounts" | "profiles";
type NoticeTab = "records" | "categories" | "priorities";
type NoticeSortColumn =
  | "title"
  | "category"
  | "status"
  | "published_at";
type SortDirection = "asc" | "desc" | null;
type NoticeColumn = "title" | "category" | "status" | "published_at" | "actions";
type OptionSortColumn = "label";
type OptionColumn = OptionSortColumn | "actions";
type SetFilterKey =
  | "notice-title"
  | "notice-category"
  | "notice-status"
  | "notice-publication"
  | "category-name"
  | "priority-name";
interface SetFilterChoice {
  value: string;
  label: string;
}
interface NoticeTableState {
  filters: Record<string, string>;
  appliedFilters: Record<string, string>;
  sortBy: NoticeSortColumn | null;
  sortDirection: SortDirection;
  page: number;
  pageSize: number;
}
const session = useSession();
const current = ref<Section>("overview");
const userTab = ref<UserTab>("accounts");
const noticeTab = ref<NoticeTab>("records");
const ready = ref(false),
  busy = ref(false),
  error = ref(""),
  success = ref(""),
  editing = ref(false),
  showEditor = ref(false);
const records = ref<Record<string, any[]>>({
  notices: [],
  videos: [],
  releases: [],
  links: [],
  users: [],
});
const overview = ref({
  notices: 0,
  notice_drafts: 0,
  videos: 0,
  releases: 0,
  links: 0,
});
const portal = ref<PortalConfig>({
  hero_title: "",
  hero_description: "",
  banner_text: "",
  banner_enabled: false,
});
const profilePermissions = ref<ProfilePermissions>({
  admin: ["notices", "videos", "releases", "links"],
  lideranca: ["notices", "videos"],
  analista: [],
});
const noticeOptions = ref<NoticeOptions>({
  categories: [
    { id: "Geral", label: "Geral" },
    { id: "Procedimento", label: "Procedimento" },
    { id: "Treinamento", label: "Treinamento" },
    { id: "Urgente", label: "Urgente" },
  ],
  priorities: [
    { id: "normal", label: "Normal" },
    { id: "important", label: "Importante" },
    { id: "critical", label: "Crítica" },
  ],
});
const optionDraft = ref("");
const optionEditingId = ref<string | null>(null);
const setFilterSelections = ref<Record<SetFilterKey, string[] | null>>({
  "notice-title": null,
  "notice-category": null,
  "notice-status": null,
  "notice-publication": null,
  "category-name": null,
  "priority-name": null,
});
const openSetFilter = ref<SetFilterKey | null>(null);
const noticeTable = ref<NoticeTableState>({
  filters: {
    title: "",
    category: "",
    status: "",
    published_at: "",
  },
  appliedFilters: {
    title: "",
    category: "",
    status: "",
    published_at: "",
  },
  sortBy: null,
  sortDirection: null,
  page: 1,
  pageSize: 10,
});
const draggingNoticeId = ref<string | null>(null);
const dragOverNoticeId = ref<string | null>(null);
const dragInsertPosition = ref<"before" | "after" | null>(null);
const noticeDragPointer = ref<{
  noticeId: string;
  pointerId: number;
  startX: number;
  startY: number;
  active: boolean;
} | null>(null);
const savingManualOrder = ref(false);
const defaultNoticeColumnWidths: Record<NoticeColumn, number> = {
  title: 290,
  category: 180,
  status: 140,
  published_at: 170,
  actions: 120,
};
const noticeColumnWidths = ref({ ...defaultNoticeColumnWidths });
const optionTable = ref({
  filters: { label: "" },
  appliedFilters: { label: "" },
  sortBy: null as OptionSortColumn | null,
  sortDirection: null as SortDirection,
  page: 1,
  pageSize: 10,
});
const defaultOptionColumnWidths: Record<OptionColumn, number> = {
  label: 360,
  actions: 180,
};
const optionColumnWidths = ref({ ...defaultOptionColumnWidths });
const resizingOptionColumn = ref<{
  column: OptionColumn;
  startX: number;
  startWidth: number;
} | null>(null);
const optionTableWidth = computed(() =>
  Object.values(optionColumnWidths.value).reduce(
    (total, width) => total + width,
    0,
  ),
);
const resizingNoticeColumn = ref<{
  column: NoticeColumn;
  startX: number;
  startWidth: number;
} | null>(null);
const noticeTableWidth = computed(() =>
  Object.values(noticeColumnWidths.value).reduce((total, width) => total + width, 0),
);
let noticeFilterDebounce: ReturnType<typeof setTimeout> | undefined;
let optionFilterDebounce: ReturnType<typeof setTimeout> | undefined;
const form = reactive<Record<string, any>>({});
const isAdmin = computed(() => session.user.value?.role === "admin");
const sections: {
  id: Section;
  label: string;
  icon: string;
  permission?: Capability;
  admin?: boolean;
}[] = [
  { id: "overview", label: "Visão geral", icon: "▣" },
  { id: "notices", label: "Comunicados", icon: "▤", permission: "notices" },
  {
    id: "videos",
    label: "Vídeos e tutoriais",
    icon: "▷",
    permission: "videos",
  },
  { id: "releases", label: "Releases", icon: "⇧", permission: "releases" },
  { id: "links", label: "Links úteis", icon: "↗", permission: "links" },
  { id: "users", label: "Usuários", icon: "♙", admin: true },
  { id: "settings", label: "Configurações", icon: "⚙", admin: true },
];
const permitted = (s: (typeof sections)[number]) =>
  s.admin ? isAdmin.value : s.permission ? session.can(s.permission) : true;
const visibleSections = computed(() => sections.filter(permitted));
const activeLabel = computed(() =>
  current.value === "notices" && noticeTab.value !== "records"
    ? noticeTab.value === "categories"
      ? "Categorias de comunicados"
      : "Prioridades de comunicados"
    : current.value === "users" && userTab.value === "profiles"
      ? "Perfis e permissões"
      : sections.find((s) => s.id === current.value)?.label ||
        "Portal da Operação",
);
const description: Record<Section, string> = {
  overview: "Acompanhe conteúdos e acesse as funções administrativas.",
  notices:
    "Crie comunicados e gerencie as categorias e prioridades disponíveis.",
  videos: "Cadastre treinamentos do YouTube ou Vimeo.",
  releases: "Atualizações dos produtos e alterações de versão.",
  links: "Gerencie links de consulta e materiais externos.",
  users: "Cadastre contas ou ajuste os perfis e permissões padrão.",
  settings: "Personalize a apresentação e os alertas da página inicial.",
};
const roleOptions: { id: Role; label: string }[] = [
  { id: "admin", label: "Administrador" },
  { id: "lideranca", label: "Liderança" },
  { id: "analista", label: "Analista" },
];
const capabilityOptions: { id: Capability; label: string }[] = [
  { id: "notices", label: "Comunicados" },
  { id: "videos", label: "Vídeos e tutoriais" },
  { id: "releases", label: "Releases" },
  { id: "links", label: "Links úteis" },
];
const noticeOptionList = computed(() =>
  noticeTab.value === "categories"
    ? noticeOptions.value.categories
    : noticeOptions.value.priorities,
);
const noticeOptionLabel = computed(() =>
  noticeTab.value === "categories" ? "categoria" : "prioridade",
);
const noticeCategoryFilterOptions = computed<SetFilterChoice[]>(() => {
  const categories = new Set(
    (records.value.notices || []).map((notice) => String(notice.category || "")),
  );
  return [...categories]
    .filter(Boolean)
    .map((value) => ({
      value,
      label:
        noticeOptions.value.categories.find((option) => option.id === value)
          ?.label || value,
    }))
    .sort((a, b) => a.label.localeCompare(b.label, "pt-BR", { sensitivity: "base" }));
});
const noticeStatusFilterOptions = computed<SetFilterChoice[]>(() => {
  const statuses = new Set(
    (records.value.notices || []).map((notice) => stateLabel(notice)),
  );
  return [...statuses]
    .map((value) => ({ value, label: value }))
    .sort((a, b) => a.label.localeCompare(b.label, "pt-BR", { sensitivity: "base" }));
});
const noticeTitleFilterOptions = computed<SetFilterChoice[]>(() => {
  const titles = new Set(
    (records.value.notices || [])
      .map((notice) => String(notice.title || "").trim())
      .filter(Boolean),
  );
  return [...titles]
    .map((value) => ({ value, label: value }))
    .sort((a, b) =>
      a.label.localeCompare(b.label, "pt-BR", {
        sensitivity: "base",
        numeric: true,
      }),
    );
});
const noticePublicationFilterOptions = computed<SetFilterChoice[]>(() => {
  const dates = new Set(
    (records.value.notices || []).map((notice) => {
      const timestamp = notice.published_at
        ? new Date(notice.published_at).getTime()
        : Number.NaN;
      return Number.isNaN(timestamp)
        ? ""
        : new Date(timestamp).toISOString().slice(0, 10);
    }),
  );
  return [...dates]
    .map((value) => ({
      value,
      label: value ? formatNoticeDate(value) : "Sem data",
    }))
    .sort((a, b) =>
      a.value.localeCompare(b.value, "pt-BR", { numeric: true }),
    );
});
const categoryNameFilterOptions = computed<SetFilterChoice[]>(() =>
  noticeOptions.value.categories
    .map((option) => ({ value: option.id, label: option.label }))
    .sort((a, b) => a.label.localeCompare(b.label, "pt-BR", { sensitivity: "base" })),
);
const priorityNameFilterOptions = computed<SetFilterChoice[]>(() =>
  noticeOptions.value.priorities
    .map((option) => ({ value: option.id, label: option.label }))
    .sort((a, b) => a.label.localeCompare(b.label, "pt-BR", { sensitivity: "base" })),
);
const noticeOptionFilterOptions = computed(() =>
  noticeTab.value === "categories"
    ? categoryNameFilterOptions.value
    : priorityNameFilterOptions.value,
);
const noticeOptionFilterKey = computed<SetFilterKey>(() =>
  noticeTab.value === "categories" ? "category-name" : "priority-name",
);
const normalizeNoticeFilter = (value: unknown) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim();
function matchesSetFilter(key: SetFilterKey, value: string) {
  const selected = setFilterSelections.value[key];
  return selected === null || selected.includes(value);
}
function isSetFilterActive(key: SetFilterKey, options: SetFilterChoice[]) {
  const selected = setFilterSelections.value[key];
  return (
    selected !== null &&
    (selected.length !== options.length ||
      options.some((option) => !selected.includes(option.value)))
  );
}
function updateSetFilter(key: SetFilterKey, selected: string[] | null) {
  setFilterSelections.value[key] = selected;
  openSetFilter.value = key;
  if (key === "notice-category" || key === "notice-status")
    noticeTable.value.page = 1;
  else optionTable.value.page = 1;
}
function toggleSetFilter(key: SetFilterKey) {
  openSetFilter.value = openSetFilter.value === key ? null : key;
}
function syncSetFilterValues(
  key: SetFilterKey,
  options: SetFilterChoice[],
  previousOptions: SetFilterChoice[],
) {
  const selected = setFilterSelections.value[key];
  if (selected === null) return;
  const previousValues = new Set(previousOptions.map((option) => option.value));
  const nextValues = options
    .filter(
      (option) => selected.includes(option.value) || !previousValues.has(option.value),
    )
    .map((option) => option.value);
  setFilterSelections.value[key] =
    nextValues.length === options.length ? null : nextValues;
}
watch(noticeCategoryFilterOptions, (options, previousOptions) =>
  syncSetFilterValues("notice-category", options, previousOptions),
);
watch(noticeTitleFilterOptions, (options, previousOptions) =>
  syncSetFilterValues("notice-title", options, previousOptions),
);
watch(noticeStatusFilterOptions, (options, previousOptions) =>
  syncSetFilterValues("notice-status", options, previousOptions),
);
watch(noticePublicationFilterOptions, (options, previousOptions) =>
  syncSetFilterValues("notice-publication", options, previousOptions),
);
watch(categoryNameFilterOptions, (options, previousOptions) =>
  syncSetFilterValues("category-name", options, previousOptions),
);
watch(priorityNameFilterOptions, (options, previousOptions) =>
  syncSetFilterValues("priority-name", options, previousOptions),
);
const filteredSortedNotices = computed(() => {
  const filters = noticeTable.value.appliedFilters;
  const filtered = (records.value.notices || []).filter((notice) => {
    const category =
      noticeOptions.value.categories.find(
        (option) => option.id === notice.category,
      )?.label || notice.category;
    const timestamp = notice.published_at
      ? new Date(notice.published_at).getTime()
      : Number.NaN;
    const noticeDate = Number.isNaN(timestamp)
      ? ""
      : new Date(timestamp).toISOString().slice(0, 10);
    const formattedNoticeDate = Number.isNaN(timestamp)
      ? ""
      : formatDate(notice.published_at);
    return (
      matchesSetFilter("notice-title", String(notice.title || "")) &&
      (!filters.title ||
        normalizeNoticeFilter(`${notice.title || ""} ${notice.body || ""}`).includes(
          normalizeNoticeFilter(filters.title),
        )) &&
      (!filters.category ||
        normalizeNoticeFilter(category).includes(
          normalizeNoticeFilter(filters.category),
        )) &&
      matchesSetFilter("notice-category", notice.category) &&
      (!filters.status ||
        normalizeNoticeFilter(stateLabel(notice)).includes(
          normalizeNoticeFilter(filters.status),
        )) &&
      matchesSetFilter("notice-status", stateLabel(notice)) &&
      matchesSetFilter(
        "notice-publication",
        Number.isNaN(timestamp) ? "" : new Date(timestamp).toISOString().slice(0, 10),
      ) &&
      (!filters.published_at ||
        normalizeNoticeFilter(`${noticeDate} ${formattedNoticeDate}`).includes(
          normalizeNoticeFilter(filters.published_at),
        ))
    );
  });

  const { sortBy, sortDirection } = noticeTable.value;
  if (!sortBy || !sortDirection) return filtered;
  const direction = sortDirection === "asc" ? 1 : -1;
  return filtered.sort((a, b) => {
    const valueFor = (notice: Notice, column: NoticeSortColumn) => {
      if (column === "category")
        return (
          noticeOptions.value.categories.find(
            (option) => option.id === notice.category,
          )?.label || notice.category
        );
      if (column === "status") return stateLabel(notice);
      if (column === "published_at") {
        const timestamp = notice.published_at
          ? new Date(notice.published_at).getTime()
          : Number.NaN;
        return Number.isNaN(timestamp) ? 0 : timestamp;
      }
      return notice.title || "";
    };
    const left = valueFor(a, sortBy);
    const right = valueFor(b, sortBy);
    if (typeof left === "number" && typeof right === "number")
      return (left - right) * direction;
    return String(left).localeCompare(String(right), "pt-BR", {
      sensitivity: "base",
      numeric: true,
    }) * direction;
  });
});
const paginatedNotices = computed(() => {
  const start = (noticeTable.value.page - 1) * noticeTable.value.pageSize;
  return filteredSortedNotices.value.slice(
    start,
    start + noticeTable.value.pageSize,
  );
});
const noticePageCount = computed(() =>
  Math.max(
    1,
    Math.ceil(
      filteredSortedNotices.value.length / noticeTable.value.pageSize,
    ),
  ),
);
watch(
  () => ({ ...noticeTable.value.filters }),
  (filters) => {
    if (noticeFilterDebounce) clearTimeout(noticeFilterDebounce);
    noticeTable.value.page = 1;
    noticeFilterDebounce = setTimeout(() => {
      noticeTable.value.appliedFilters = { ...filters };
    }, 300);
  },
);
watch(noticePageCount, (pageCount) => {
  if (noticeTable.value.page > pageCount) noticeTable.value.page = pageCount;
});
onBeforeUnmount(() => {
  if (noticeFilterDebounce) clearTimeout(noticeFilterDebounce);
});
const filteredSortedNoticeOptions = computed(() => {
  const filters = optionTable.value.appliedFilters;
  return noticeOptionList.value
    .filter(
      (option) =>
        matchesSetFilter(noticeOptionFilterKey.value, option.id) &&
        (!filters.label ||
          normalizeNoticeFilter(option.label).includes(
            normalizeNoticeFilter(filters.label),
          )),
    )
    .sort((a, b) => {
      const { sortBy, sortDirection } = optionTable.value;
      if (!sortBy || !sortDirection) return 0;
      const direction = sortDirection === "asc" ? 1 : -1;
      return a.label.localeCompare(b.label, "pt-BR", {
        sensitivity: "base",
        numeric: true,
      }) * direction;
    });
});
const paginatedNoticeOptions = computed(() => {
  const start = (optionTable.value.page - 1) * optionTable.value.pageSize;
  return filteredSortedNoticeOptions.value.slice(
    start,
    start + optionTable.value.pageSize,
  );
});
const optionPageCount = computed(() =>
  Math.max(
    1,
    Math.ceil(
      filteredSortedNoticeOptions.value.length / optionTable.value.pageSize,
    ),
  ),
);
const hasNoticeOptionFilters = computed(() =>
  Object.values(optionTable.value.filters).some(Boolean) ||
  isSetFilterActive(noticeOptionFilterKey.value, noticeOptionFilterOptions.value),
);
watch(
  () => ({ ...optionTable.value.filters }),
  (filters) => {
    if (optionFilterDebounce) clearTimeout(optionFilterDebounce);
    optionTable.value.page = 1;
    optionFilterDebounce = setTimeout(() => {
      optionTable.value.appliedFilters = { ...filters };
    }, 300);
  },
);
watch(optionPageCount, (pageCount) => {
  if (optionTable.value.page > pageCount)
    optionTable.value.page = pageCount;
});
watch(noticeTab, () => {
  optionTable.value.page = 1;
  openSetFilter.value = null;
});
onBeforeUnmount(() => {
  if (optionFilterDebounce) clearTimeout(optionFilterDebounce);
  document.removeEventListener("pointerdown", closeSetFilterOnOutside);
  document.removeEventListener("keydown", closeSetFilterOnEscape);
});
function sortNoticeOptionsBy(column: OptionSortColumn) {
  if (optionTable.value.sortBy !== column) {
    optionTable.value.sortBy = column;
    optionTable.value.sortDirection = "asc";
  } else if (optionTable.value.sortDirection === "asc") {
    optionTable.value.sortDirection = "desc";
  } else {
    optionTable.value.sortBy = null;
    optionTable.value.sortDirection = null;
  }
}
function closeSetFilterOnOutside(event: PointerEvent) {
  const target = event.target;
  if (
    target instanceof Element &&
    !target.closest(".set-filter-popover")
  )
    openSetFilter.value = null;
}
function closeSetFilterOnEscape(event: KeyboardEvent) {
  if (event.key === "Escape") openSetFilter.value = null;
}
function optionSortIndicator(column: OptionSortColumn) {
  if (optionTable.value.sortBy !== column) return "";
  return optionTable.value.sortDirection === "asc" ? " ↑" : " ↓";
}
function clearNoticeOptionFilters() {
  if (optionFilterDebounce) clearTimeout(optionFilterDebounce);
  optionTable.value.filters = { label: "" };
  optionTable.value.appliedFilters = { label: "" };
  setFilterSelections.value["category-name"] = null;
  setFilterSelections.value["priority-name"] = null;
  optionTable.value.page = 1;
}
function sortNoticesBy(column: NoticeSortColumn) {
  if (noticeTable.value.sortBy !== column) {
    noticeTable.value.sortBy = column;
    noticeTable.value.sortDirection = "asc";
    return;
  }
  if (noticeTable.value.sortDirection === "asc") {
    noticeTable.value.sortDirection = "desc";
  } else {
    noticeTable.value.sortBy = null;
    noticeTable.value.sortDirection = null;
  }
}
function clearNoticeFilters() {
  if (noticeFilterDebounce) clearTimeout(noticeFilterDebounce);
  noticeTable.value.filters = {
    title: "",
    category: "",
    status: "",
    published_at: "",
  };
  noticeTable.value.appliedFilters = { ...noticeTable.value.filters };
  setFilterSelections.value["notice-title"] = null;
  setFilterSelections.value["notice-category"] = null;
  setFilterSelections.value["notice-status"] = null;
  setFilterSelections.value["notice-publication"] = null;
  noticeTable.value.page = 1;
}
function startNoticeDrag(event: PointerEvent, notice: Notice) {
  if (
    event.button !== 0 ||
    !isAdmin.value ||
    noticeTable.value.sortBy ||
    savingManualOrder.value
  ) {
    event.preventDefault();
    return;
  }
  event.preventDefault();
  const handle = event.currentTarget;
  if (!(handle instanceof HTMLElement)) return;
  handle.setPointerCapture(event.pointerId);
  noticeDragPointer.value = {
    noticeId: notice.id,
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    active: false,
  };
}
function moveNoticeDrag(event: PointerEvent) {
  const drag = noticeDragPointer.value;
  if (!drag || drag.pointerId !== event.pointerId || savingManualOrder.value)
    return;
  if (!drag.active) {
    if (Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < 5)
      return;
    drag.active = true;
    draggingNoticeId.value = drag.noticeId;
  }
  const hoveredElement = document.elementFromPoint(event.clientX, event.clientY);
  const row = hoveredElement?.closest<HTMLElement>("[data-notice-row]");
  const targetId = row?.dataset.noticeRow;
  if (!row || !targetId || targetId === drag.noticeId) {
    dragOverNoticeId.value = null;
    dragInsertPosition.value = null;
    return;
  }
  dragOverNoticeId.value = targetId;
  dragInsertPosition.value =
    event.clientY < row.getBoundingClientRect().top + row.offsetHeight / 2
      ? "before"
      : "after";
}
function endNoticeDrag(event: PointerEvent) {
  const drag = noticeDragPointer.value;
  if (!drag || drag.pointerId !== event.pointerId) return;
  const targetId = dragOverNoticeId.value;
  const position = dragInsertPosition.value;
  noticeDragPointer.value = null;
  const handle = event.currentTarget;
  if (
    handle instanceof HTMLElement &&
    handle.hasPointerCapture(event.pointerId)
  )
    handle.releasePointerCapture(event.pointerId);
  if (drag.active && targetId && position)
    void persistNoticeOrder(drag.noticeId, targetId, position);
  else finishNoticeDrag();
}
async function persistNoticeOrder(
  draggedId: string,
  targetId: string,
  position: "before" | "after",
) {
  const previousOrder = [...(records.value.notices || [])].sort(
    (a, b) =>
      a.display_order - b.display_order || String(a.id).localeCompare(String(b.id)),
  );
  const nextOrder = [...previousOrder];
  const fromIndex = nextOrder.findIndex((notice) => notice.id === draggedId);
  const targetIndex = nextOrder.findIndex((notice) => notice.id === targetId);
  if (fromIndex < 0 || targetIndex < 0) {
    finishNoticeDrag();
    return;
  }
  const movedNotice = nextOrder.splice(fromIndex, 1)[0];
  if (!movedNotice) {
    finishNoticeDrag();
    return;
  }
  const insertAt = targetIndex + (position === "after" ? 1 : 0);
  nextOrder.splice(fromIndex < insertAt ? insertAt - 1 : insertAt, 0, movedNotice);
  if (nextOrder.every((notice, index) => notice.id === previousOrder[index]?.id)) {
    finishNoticeDrag();
    return;
  }

  const ordered = nextOrder.map((notice, index) => ({
    ...notice,
    display_order: index + 1,
  }));
  records.value.notices = ordered;
  savingManualOrder.value = true;
  error.value = "";
  success.value = "";
  try {
    await $fetch("/api/admin/notices/order", {
      method: "PATCH",
      body: { notice_ids: ordered.map((notice) => notice.id) },
    });
    success.value = "Ordem dos comunicados salva.";
  } catch (e) {
    records.value.notices = previousOrder;
    error.value = apiMessage(e);
  } finally {
    savingManualOrder.value = false;
    finishNoticeDrag();
  }
}
function finishNoticeDrag() {
  noticeDragPointer.value = null;
  draggingNoticeId.value = null;
  dragOverNoticeId.value = null;
  dragInsertPosition.value = null;
}
const hasNoticeFilters = computed(() =>
  Object.values(noticeTable.value.filters).some((value) => value !== "") ||
  isSetFilterActive("notice-title", noticeTitleFilterOptions.value) ||
  isSetFilterActive("notice-category", noticeCategoryFilterOptions.value) ||
  isSetFilterActive("notice-status", noticeStatusFilterOptions.value) ||
  isSetFilterActive("notice-publication", noticePublicationFilterOptions.value),
);
function noticeSortIndicator(column: NoticeSortColumn) {
  if (noticeTable.value.sortBy !== column) return "";
  return noticeTable.value.sortDirection === "asc" ? " ↑" : " ↓";
}
function noticeAriaSort(
  column: NoticeSortColumn,
): "ascending" | "descending" | "none" {
  if (noticeTable.value.sortBy !== column || !noticeTable.value.sortDirection)
    return "none";
  return noticeTable.value.sortDirection === "asc" ? "ascending" : "descending";
}
function startNoticeColumnResize(event: PointerEvent, column: NoticeColumn) {
  if (event.button !== 0) return;
  event.preventDefault();
  event.stopPropagation();
  const handle = event.currentTarget;
  if (!(handle instanceof HTMLElement)) return;
  handle.setPointerCapture(event.pointerId);
  resizingNoticeColumn.value = {
    column,
    startX: event.clientX,
    startWidth: noticeColumnWidths.value[column],
  };
}
function resizeNoticeColumn(event: PointerEvent) {
  const resizing = resizingNoticeColumn.value;
  if (!resizing) return;
  const minimumWidth: Record<NoticeColumn, number> = {
    title: 160,
    category: 120,
    status: 100,
    published_at: 125,
    actions: 100,
  };
  noticeColumnWidths.value[resizing.column] = Math.max(
    minimumWidth[resizing.column],
    resizing.startWidth + event.clientX - resizing.startX,
  );
}
function finishNoticeColumnResize() {
  resizingNoticeColumn.value = null;
}
function handleNoticeResizeKeydown(
  event: KeyboardEvent,
  column: NoticeColumn,
) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    noticeColumnWidths.value[column] = defaultNoticeColumnWidths[column];
    return;
  }
  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
  event.preventDefault();
  const minimumWidth: Record<NoticeColumn, number> = {
    title: 160,
    category: 120,
    status: 100,
    published_at: 125,
    actions: 100,
  };
  const delta = event.key === "ArrowRight" ? 12 : -12;
  noticeColumnWidths.value[column] = Math.max(
    minimumWidth[column],
    noticeColumnWidths.value[column] + delta,
  );
}
function resetNoticeColumnWidth(column: NoticeColumn) {
  noticeColumnWidths.value[column] = defaultNoticeColumnWidths[column];
}
function startOptionColumnResize(event: PointerEvent, column: OptionColumn) {
  if (event.button !== 0) return;
  event.preventDefault();
  event.stopPropagation();
  const handle = event.currentTarget;
  if (!(handle instanceof HTMLElement)) return;
  handle.setPointerCapture(event.pointerId);
  resizingOptionColumn.value = {
    column,
    startX: event.clientX,
    startWidth: optionColumnWidths.value[column],
  };
}
function resizeOptionColumn(event: PointerEvent) {
  const resizing = resizingOptionColumn.value;
  if (!resizing) return;
  const minimumWidth: Record<OptionColumn, number> = {
    label: 150,
    actions: 150,
  };
  optionColumnWidths.value[resizing.column] = Math.max(
    minimumWidth[resizing.column],
    resizing.startWidth + event.clientX - resizing.startX,
  );
}
function finishOptionColumnResize() {
  resizingOptionColumn.value = null;
}
function handleOptionResizeKeydown(event: KeyboardEvent, column: OptionColumn) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    optionColumnWidths.value[column] = defaultOptionColumnWidths[column];
    return;
  }
  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
  event.preventDefault();
  const minimumWidth: Record<OptionColumn, number> = {
    label: 150,
    actions: 150,
  };
  optionColumnWidths.value[column] = Math.max(
    minimumWidth[column],
    optionColumnWidths.value[column] +
      (event.key === "ArrowRight" ? 12 : -12),
  );
}
function resetOptionColumnWidth(column: OptionColumn) {
  optionColumnWidths.value[column] = defaultOptionColumnWidths[column];
}
const defaults: Record<string, () => Record<string, any>> = {
  notices: () => ({
    title: "",
    body: "",
    category: "Geral",
    priority: "normal",
    status: "draft",
    pinned: false,
    requires_ack: false,
    published_at: "",
    expires_at: "",
  }),
  videos: () => ({
    title: "",
    description: "",
    category: "Treinamento",
    url: "",
  }),
  releases: () => ({
    title: "",
    product: "",
    version: "",
    summary: "",
    url: "",
    status: "draft",
    published_at: new Date().toISOString().slice(0, 10),
  }),
  links: () => ({
    title: "",
    url: "",
    description: "",
    category: "Geral",
    status: "draft",
  }),
  users: () => ({
    name: "",
    email: "",
    password: "",
    role: "analista",
    active: true,
    permissions: [...profilePermissions.value.analista],
  }),
};
const colMap: Record<string, string> = {
  notices: "notices",
  videos: "videos",
  releases: "releases",
  links: "links",
  users: "users",
};
function clearForm() {
  for (const key of Object.keys(form)) delete form[key];
}
function newRecord() {
  clearForm();
  Object.assign(form, defaults[current.value]?.() || {});
  if (current.value === "notices") {
    form.category = noticeOptions.value.categories[0]?.id || "";
    form.priority =
      noticeOptions.value.priorities.find((option) => option.id === "normal")
        ?.id ||
      noticeOptions.value.priorities[0]?.id ||
      "";
  }
  editing.value = false;
  showEditor.value = true;
  success.value = "";
  error.value = "";
}
function applyUserProfileDefaults() {
  if (!editing.value)
    form.permissions = [...profilePermissions.value[form.role as Role]];
}
function editRecord(item: Record<string, any>) {
  clearForm();
  Object.assign(form, JSON.parse(JSON.stringify(item)));
  if (current.value === "videos") form.url = item.external_url || "";
  if (current.value === "users") {
    form.password = "";
    form.active = item.active !== false;
    form.permissions = Array.isArray(item.permissions)
      ? [...item.permissions]
      : item.role === "lideranca"
        ? ["notices", "videos"]
        : [];
  }
  if (current.value === "notices")
    for (const name of ["published_at", "expires_at"])
      form[name] = item[name]
        ? new Date(item[name]).toISOString().slice(0, 16)
        : "";
  editing.value = true;
  showEditor.value = true;
  error.value = "";
  success.value = "";
  window.scrollTo({ top: 0, behavior: "smooth" });
}
function closeEditor() {
  showEditor.value = false;
  error.value = "";
}
async function load() {
  error.value = "";
  try {
    if (current.value === "overview") {
      overview.value = (
        await $fetch<{ overview: typeof overview.value }>("/api/admin/overview")
      ).overview;
      return;
    }
    if (current.value === "notices") {
      noticeOptions.value = (
        await $fetch<{ noticeOptions: NoticeOptions }>(
          "/api/admin/notice-options",
        )
      ).noticeOptions;
      if (noticeTab.value !== "records") return;
    }
    if (current.value === "settings") {
      portal.value = (
        await $fetch<{ portal: PortalConfig }>("/api/portal")
      ).portal;
      return;
    }
    if (current.value === "users") {
      if (!isAdmin.value) {
        error.value =
          "Acesso à gestão de usuários reservado a administradores.";
        return;
      }
      if (userTab.value === "profiles") {
        profilePermissions.value = (
          await $fetch<{ profilePermissions: ProfilePermissions }>(
            "/api/admin/profile-permissions",
          )
        ).profilePermissions;
      } else {
        const [users, profiles] = await Promise.all([
          $fetch<{ users: User[] }>("/api/admin/users"),
          $fetch<{ profilePermissions: ProfilePermissions }>(
            "/api/admin/profile-permissions",
          ),
        ]);
        records.value.users = users.users;
        profilePermissions.value = profiles.profilePermissions;
      }
      return;
    }
    const key = colMap[current.value];
    if (!key) return;
    const response = await $fetch<Record<string, any[]>>(`/api/admin/${key}`);
    records.value[key] = response[key] || [];
  } catch (e) {
    error.value = apiMessage(e);
  }
}
async function choose(tab: Section) {
  if (tab === "users" && !isAdmin.value) {
    error.value = "Acesso à gestão de usuários reservado a administradores.";
    return;
  }
  current.value = tab;
  if (tab === "users") userTab.value = "accounts";
  if (tab === "notices") noticeTab.value = "records";
  closeEditor();
  success.value = "";
  await load();
}
async function chooseNoticeTab(tab: NoticeTab) {
  noticeTab.value = tab;
  optionDraft.value = "";
  optionEditingId.value = null;
  closeEditor();
  success.value = "";
  await load();
}
async function chooseUserTab(tab: UserTab) {
  if (!isAdmin.value) {
    error.value = "Acesso à gestão de usuários reservado a administradores.";
    return;
  }
  userTab.value = tab;
  closeEditor();
  success.value = "";
  await load();
}
onMounted(async () => {
  document.addEventListener("pointerdown", closeSetFilterOnOutside);
  document.addEventListener("keydown", closeSetFilterOnEscape);
  await session.refresh();
  ready.value = true;
  if (session.user.value && visibleSections.value.length) await load();
});
const canOpen = computed(
  () =>
    session.user.value &&
    (session.user.value.role === "admin" ||
      session.user.value.permissions?.length > 0),
);
function payload() {
  const obj = { ...form };
  delete obj.id;
  delete obj.created_at;
  delete obj.updated_at;
  delete obj.archived_at;
  delete obj.author_name;
  delete obj.acknowledged;
  delete obj.acknowledgements;
  delete obj.author_id;
  if (current.value === "notices") {
    for (const key of ["published_at", "expires_at"])
      obj[key] = obj[key] ? new Date(obj[key]).toISOString() : null;
  }
  if (current.value === "users") {
    if (editing.value) {
      delete obj.email;
      if (!obj.password) delete obj.password;
    }
    delete obj.sessions_revoked;
  }
  if (current.value === "videos") {
    for (const key of ["external_url", "embed_url", "provider", "provider_id"])
      delete obj[key];
  }
  return obj;
}
async function save() {
  if (busy.value) return;
  error.value = "";
  success.value = "";
  busy.value = true;
  try {
    const key = colMap[current.value];
    const url = editing.value
      ? `/api/admin/${key}/${form.id}`
      : `/api/admin/${key}`;
    await $fetch(url, {
      method: editing.value ? "PATCH" : "POST",
      body: payload(),
    });
    success.value = editing.value
      ? "Alterações salvas com sucesso."
      : "Registro cadastrado com sucesso.";
    showEditor.value = false;
    await load();
    if (
      current.value === "users" &&
      editing.value &&
      form.id === session.user.value?.id
    )
      await session.refresh();
  } catch (e) {
    error.value = apiMessage(e);
  } finally {
    busy.value = false;
  }
}
async function archive(item: any) {
  if (
    !window.confirm(
      `Confirma ${current.value === "videos" ? "a exclusão" : "o arquivamento"} de “${item.title}”?`,
    )
  )
    return;
  error.value = "";
  success.value = "";
  try {
    await $fetch(`/api/admin/${current.value}/${item.id}`, {
      method: "DELETE",
    });
    success.value = "Registro atualizado.";
    await load();
  } catch (e) {
    error.value = apiMessage(e);
  }
}
async function saveSettings() {
  busy.value = true;
  error.value = "";
  success.value = "";
  try {
    await $fetch("/api/admin/portal", { method: "PATCH", body: portal.value });
    success.value = "Configurações publicadas.";
  } catch (e) {
    error.value = apiMessage(e);
  } finally {
    busy.value = false;
  }
}
async function saveProfilePermissions() {
  busy.value = true;
  error.value = "";
  success.value = "";
  try {
    const response = await $fetch<{ profilePermissions: ProfilePermissions }>(
      "/api/admin/profile-permissions",
      { method: "PATCH", body: profilePermissions.value },
    );
    profilePermissions.value = response.profilePermissions;
    success.value = "Permissões padrão dos perfis salvas.";
  } catch (e) {
    error.value = apiMessage(e);
  } finally {
    busy.value = false;
  }
}
function editNoticeOption(option: NoticeOption) {
  optionEditingId.value = option.id;
  optionDraft.value = option.label;
}
function cancelNoticeOptionEdit() {
  optionEditingId.value = null;
  optionDraft.value = "";
}
async function saveNoticeOption() {
  const label = optionDraft.value.trim();
  if (!label) {
    error.value = `Informe o nome da ${noticeOptionLabel.value}.`;
    return;
  }
  const list = [...noticeOptionList.value];
  if (optionEditingId.value) {
    const index = list.findIndex(
      (option) => option.id === optionEditingId.value,
    );
    if (index < 0) {
      error.value = `A ${noticeOptionLabel.value} não foi encontrada.`;
      return;
    }
    list[index] = { ...list[index]!, label };
  } else {
    list.push({
      id: `${noticeTab.value === "categories" ? "category" : "priority"}-${crypto.randomUUID()}`,
      label,
    });
  }
  await persistNoticeOptionList(list);
}
async function removeNoticeOption(option: NoticeOption) {
  if (noticeOptionList.value.length <= 1) {
    error.value = `Mantenha ao menos uma ${noticeOptionLabel.value}.`;
    return;
  }
  if (
    !window.confirm(
      `Remover "${option.label}"? Comunicados existentes que usam esta opção serão atualizados para a primeira opção disponível.`,
    )
  )
    return;
  await persistNoticeOptionList(
    noticeOptionList.value.filter((item) => item.id !== option.id),
  );
}
async function persistNoticeOptionList(list: NoticeOption[]) {
  busy.value = true;
  error.value = "";
  success.value = "";
  try {
    const next = {
      ...noticeOptions.value,
      [noticeTab.value]: list,
    };
    const response = await $fetch<{ noticeOptions: NoticeOptions }>(
      "/api/admin/notice-options",
      { method: "PATCH", body: next },
    );
    noticeOptions.value = response.noticeOptions;
    cancelNoticeOptionEdit();
    success.value = `${noticeTab.value === "categories" ? "Categorias" : "Prioridades"} salvas.`;
  } catch (e) {
    error.value = apiMessage(e);
  } finally {
    busy.value = false;
  }
}
function stateLabel(row: any) {
  return row.archived_at
    ? "Arquivado"
    : row.status === "draft"
      ? "Rascunho"
      : row.published_at && new Date(row.published_at) > new Date()
        ? "Agendado"
        : "Publicado";
}
function formatNoticeDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  }).format(date);
}
</script>
<template>
  <div class="container page">
    <div v-if="!ready" class="empty">Verificando permissões...</div>
    <div v-else-if="!canOpen" class="panel panel-pad">
      <h1>Portal da Operação</h1>
      <p class="muted" style="font-size: 13px">
        Somente usuários com perfil ativo e permissão editorial podem acessar
        este painel.
      </p>
      <NuxtLink to="/login" class="btn btn-primary"
        >Acessar minha conta</NuxtLink
      >
    </div>
    <div v-else class="operate">
      <aside class="admin-sidebar">
        <p class="side-head">Portal da Operação</p>
        <button
          v-for="item in visibleSections"
          :key="item.id"
          :class="['side-link', { active: current === item.id }]"
          type="button"
          @click="choose(item.id)"
        >
          <span class="ico">{{ item.icon }}</span
          >{{ item.label }}
        </button>
        <div class="side-footer">
          Conectado como<br /><strong>{{ session.user.value?.name }}</strong
          ><br />{{ session.user.value?.role }}
        </div>
      </aside>
      <section class="admin-body">
        <div class="admin-header">
          <div>
            <div class="eyebrow">Painel de gestão</div>
            <h1>{{ activeLabel }}</h1>
            <p>
              {{
                current === "users" && userTab === "profiles"
                  ? "Defina as permissões padrão aplicadas ao cadastrar cada perfil."
                  : description[current]
              }}
            </p>
          </div>
          <button
            v-if="
              defaults[current] &&
              !showEditor &&
              (current !== 'notices' || noticeTab === 'records') &&
              !(current === 'users' && userTab === 'profiles')
            "
            class="btn btn-primary"
            type="button"
            @click="newRecord"
          >
            + Novo {{ current === "users" ? "usuário" : "registro" }}
          </button>
        </div>
        <div v-if="error" role="alert" class="error">{{ error }}</div>
        <div v-if="success" role="status" class="success">✓ {{ success }}</div>
        <div
          v-if="current === 'notices'"
          class="user-subtabs notice-subtabs"
          role="tablist"
          aria-label="Seções de comunicados"
          style="display: flex; gap: 8px; padding-bottom: 20px"
        >
          <button
            v-for="item in [
              { id: 'records', label: 'Comunicados' },
              { id: 'categories', label: 'Categorias' },
              { id: 'priorities', label: 'Prioridades' },
            ]"
            :key="item.id"
            :class="['filter-chip', { active: noticeTab === item.id }]"
            type="button"
            role="tab"
            :aria-selected="noticeTab === item.id"
            @click="chooseNoticeTab(item.id as NoticeTab)"
          >
            {{ item.label }}
          </button>
        </div>
        <template v-if="current === 'overview'"
          ><div class="stats-cards">
            <div
              v-for="s in [
                { key: 'notices', label: 'Comunicados' },
                { key: 'videos', label: 'Vídeos' },
                { key: 'releases', label: 'Releases' },
                { key: 'links', label: 'Links úteis' },
              ]"
              :key="s.key"
              class="metric"
            >
              <strong>{{ overview[s.key as keyof typeof overview] }}</strong
              ><span>{{ s.label }}</span>
            </div>
          </div>
          <div class="panel panel-pad" style="margin-top: 22px">
            <h2 style="font-size: 19px">
              Gerencie a comunicação da sua equipe
            </h2>
            <p class="muted" style="font-size: 13px">
              Utilize o menu lateral para publicar avisos, acompanhar conteúdos
              e gerenciar o acesso dos usuários habilitados.
            </p>
            <span class="pill amber"
              >{{ overview.notice_drafts }} comunicado(s) em rascunho</span
            >
          </div></template
        >
        <template v-else-if="current === 'settings'"
          ><form class="panel panel-pad" @submit.prevent="saveSettings">
            <div class="editor-heading">
              <h2>Personalização da página inicial</h2>
              <span class="pill">Administrador</span>
            </div>
            <div class="form-grid">
              <div class="field full">
                <label for="hero_title">Título de apresentação</label
                ><input
                  id="hero_title"
                  v-model="portal.hero_title"
                  maxlength="110"
                  required
                />
              </div>
              <div class="field full">
                <label for="hero_description">Descrição</label
                ><textarea
                  id="hero_description"
                  v-model="portal.hero_description"
                  maxlength="380"
                  required
                  rows="3"
                />
              </div>
              <div class="field full">
                <label for="banner_text">Banner de aviso</label
                ><textarea
                  id="banner_text"
                  v-model="portal.banner_text"
                  maxlength="230"
                  rows="2"
                />
              </div>
              <div class="full">
                <label class="checkbox-line"
                  ><input v-model="portal.banner_enabled" type="checkbox" />
                  Exibir banner na página inicial</label
                >
              </div>
            </div>
            <div class="form-actions">
              <button class="btn btn-primary" :disabled="busy" type="submit">
                {{ busy ? "Salvando..." : "Publicar configurações" }}
              </button>
            </div>
          </form></template
        >
        <template v-else>
          <section
            v-if="current === 'notices' && noticeTab !== 'records'"
            class="panel panel-pad notice-options-panel"
          >
            <div class="editor-heading">
              <div>
                <h2>
                  {{
                    noticeTab === "categories" ? "Categorias" : "Prioridades"
                  }}
                </h2>
                <p class="form-help">
                  Altere o nome ou remova opções. Comunicados existentes que
                  usam uma opção removida serão atualizados para a primeira
                  opção disponível.
                </p>
              </div>
            </div>
            <form class="notice-option-form" @submit.prevent="saveNoticeOption">
              <div class="field">
                <label for="notice_option_label">
                  {{
                    noticeTab === "categories"
                      ? "Nome da categoria"
                      : "Nome da prioridade"
                  }}
                </label>
                <input
                  id="notice_option_label"
                  v-model="optionDraft"
                  maxlength="50"
                  required
                  :placeholder="
                    noticeTab === 'categories'
                      ? 'Ex.: Operacional'
                      : 'Ex.: Baixa'
                  "
                />
              </div>
              <div class="actions">
                <button class="btn btn-primary" type="submit" :disabled="busy">
                  {{
                    busy
                      ? "Salvando..."
                      : optionEditingId
                        ? "Salvar nome"
                        : "Adicionar"
                  }}
                </button>
                <button
                  v-if="optionEditingId"
                  class="btn btn-secondary"
                  type="button"
                  @click="cancelNoticeOptionEdit"
                >
                  Cancelar
                </button>
              </div>
            </form>
            <div v-if="!noticeOptionList.length" class="empty">
              Nenhuma opção cadastrada.
            </div>
            <div
              v-else-if="!filteredSortedNoticeOptions.length"
              class="empty"
            >
              Nenhuma opção corresponde ao filtro.
            </div>
            <template v-else>
              <div class="record-table option-record-table">
                <table
                  class="records"
                  :style="{
                    width: '100%',
                    tableLayout: 'fixed',
                  }"
                >
                  <colgroup>
                    <col
                      :style="{
                        width: `${(optionColumnWidths.label / optionTableWidth) * 100}%`,
                      }"
                    />
                    <col
                      :style="{
                        width: `${(optionColumnWidths.actions / optionTableWidth) * 100}%`,
                      }"
                    />
                  </colgroup>
                  <thead>
                    <tr>
                      <th
                        :class="{
                          'sorted-column': optionTable.sortBy === 'label',
                          'set-filter-open':
                            openSetFilter === noticeOptionFilterKey,
                        }"
                        :aria-sort="
                          optionTable.sortBy === 'label'
                            ? optionTable.sortDirection === 'asc'
                              ? 'ascending'
                              : 'descending'
                            : 'none'
                        "
                      >
                        <div class="filterable-heading">
                          <button
                            class="sortable-heading"
                            type="button"
                            @click="sortNoticeOptionsBy('label')"
                          >
                            Nome{{ optionSortIndicator("label") }}
                          </button>
                          <SetFilterPopover
                            :id="noticeOptionFilterKey"
                            :label="noticeTab === 'categories' ? 'Categoria' : 'Prioridade'"
                            :options="noticeOptionFilterOptions"
                            :model-value="
                              setFilterSelections[noticeOptionFilterKey]
                            "
                            :open="openSetFilter === noticeOptionFilterKey"
                            :active="
                              isSetFilterActive(
                                noticeOptionFilterKey,
                                noticeOptionFilterOptions,
                              )
                            "
                            @toggle="toggleSetFilter(noticeOptionFilterKey)"
                            @update:model-value="
                              updateSetFilter(noticeOptionFilterKey, $event)
                            "
                          />
                        </div>
                        <span
                          class="notice-column-resizer"
                          role="separator"
                          aria-orientation="vertical"
                          aria-label="Redimensionar coluna Nome"
                          tabindex="0"
                          title="Arraste para redimensionar; duplo clique para restaurar"
                          @pointerdown="
                            startOptionColumnResize($event, 'label')
                          "
                          @pointermove="resizeOptionColumn"
                          @pointerup="finishOptionColumnResize"
                          @pointercancel="finishOptionColumnResize"
                          @dblclick="resetOptionColumnWidth('label')"
                          @keydown="
                            handleOptionResizeKeydown($event, 'label')
                          "
                        />
                      </th>
                      <th style="text-align: right">
                        <span
                          class="notice-column-resizer"
                          role="separator"
                          aria-orientation="vertical"
                          aria-label="Redimensionar coluna Ações"
                          tabindex="0"
                          title="Arraste para redimensionar; duplo clique para restaurar"
                          @pointerdown="
                            startOptionColumnResize($event, 'actions')
                          "
                          @pointermove="resizeOptionColumn"
                          @pointerup="finishOptionColumnResize"
                          @pointercancel="finishOptionColumnResize"
                          @dblclick="resetOptionColumnWidth('actions')"
                          @keydown="
                            handleOptionResizeKeydown($event, 'actions')
                          "
                        />
                      </th>
                    </tr>
                    <tr class="notice-filter-row">
                      <th>
                        <input
                          v-model="optionTable.filters.label"
                          class="notice-table-filter"
                          type="search"
                          aria-label="Filtrar opções pelo nome"
                          placeholder="Filtrar..."
                        />
                      </th>
                      <th>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="option in paginatedNoticeOptions" :key="option.id">
                      <td>{{ option.label }}</td>
                      <td>
                        <div class="actions record-actions">
                          <button
                            class="record-icon-button edit-action"
                            type="button"
                            aria-label="Editar opção"
                            title="Editar"
                            :disabled="busy"
                            @click="editNoticeOption(option)"
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
                              <path
                                d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z"
                              />
                            </svg>
                          </button>
                          <button
                            class="record-icon-button archive-action"
                            type="button"
                            aria-label="Remover opção"
                            title="Remover"
                            :disabled="busy || noticeOptionList.length <= 1"
                            @click="removeNoticeOption(option)"
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
                              <path
                                d="M3 7h18M5 7l1 14h12l1-14M9 7V4h6v3m-5 4v6m4-6v6"
                              />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </template>
            <div class="option-grid-footer">
              <button
                v-if="hasNoticeOptionFilters"
                class="btn btn-secondary btn-small"
                type="button"
                @click="clearNoticeOptionFilters"
              >
                Limpar filtros
              </button>
              <label class="notice-page-size">
                Itens por página
                <select
                  v-model.number="optionTable.pageSize"
                  @change="optionTable.page = 1"
                >
                  <option :value="10">10</option>
                  <option :value="25">25</option>
                  <option :value="50">50</option>
                </select>
              </label>
              <span>
                {{ filteredSortedNoticeOptions.length }} opção(ões) · Página
                {{ optionTable.page }} de {{ optionPageCount }}
              </span>
              <div class="notice-pagination-actions">
                <button
                  class="btn btn-secondary btn-small"
                  type="button"
                  :disabled="optionTable.page <= 1"
                  @click="optionTable.page--"
                >
                  Anterior
                </button>
                <button
                  class="btn btn-secondary btn-small"
                  type="button"
                  :disabled="optionTable.page >= optionPageCount"
                  @click="optionTable.page++"
                >
                  Próxima
                </button>
              </div>
            </div>
          </section>
          <template v-else>
            <div
              v-if="current === 'users'"
              class="user-subtabs"
              role="tablist"
              aria-label="Seção de usuários"
              style="display: flex; gap: 8px; padding-bottom: 20px"
            >
              <button
                :class="['filter-chip', { active: userTab === 'accounts' }]"
                type="button"
                role="tab"
                :aria-selected="userTab === 'accounts'"
                @click="chooseUserTab('accounts')"
              >
                Usuários
              </button>
              <button
                :class="['filter-chip', { active: userTab === 'profiles' }]"
                type="button"
                role="tab"
                :aria-selected="userTab === 'profiles'"
                @click="chooseUserTab('profiles')"
              >
                Perfis e permissões
              </button>
            </div>
            <form
              v-if="current === 'users' && userTab === 'profiles'"
              class="profile-permissions"
              @submit.prevent="saveProfilePermissions"
            >
              <section
                v-for="profile in roleOptions"
                :key="profile.id"
                class="panel panel-pad profile-card"
              >
                <div class="editor-heading">
                  <h2>{{ profile.label }}</h2>
                  <span class="pill">{{
                    profile.id === "admin"
                      ? "Acesso total"
                      : "Permissões padrão"
                  }}</span>
                </div>
                <div class="tag-list">
                  <label
                    v-for="capability in capabilityOptions"
                    :key="capability.id"
                    class="checkbox-line"
                  >
                    <input
                      v-model="profilePermissions[profile.id]"
                      type="checkbox"
                      :value="capability.id"
                      :disabled="profile.id === 'admin'"
                    />
                    {{ capability.label }}
                  </label>
                </div>
                <p v-if="profile.id === 'admin'" class="form-help">
                  Administradores sempre têm acesso a todas as áreas do portal.
                </p>
              </section>
              <div class="form-actions">
                <button class="btn btn-primary" :disabled="busy" type="submit">
                  {{ busy ? "Salvando..." : "Salvar permissões padrão" }}
                </button>
              </div>
            </form>
            <template v-else>
              <div
                v-if="showEditor"
                class="panel panel-pad"
                style="margin-bottom: 22px"
              >
                <div class="editor-heading">
                  <h2>
                    {{ editing ? "Editar" : "Cadastrar" }}
                    {{
                      current === "users"
                        ? "usuário"
                        : current === "notices"
                          ? "comunicado"
                          : current === "videos"
                            ? "vídeo"
                            : current === "releases"
                              ? "release"
                              : "link"
                    }}
                  </h2>
                  <button
                    class="btn btn-secondary btn-small"
                    type="button"
                    @click="closeEditor"
                  >
                    Fechar ✕
                  </button>
                </div>
                <form method="post" @submit.prevent="save" class="form-grid">
                  <template v-if="current === 'users'">
                    <div class="field">
                      <label for="user_name">Nome completo</label
                      ><input
                        id="user_name"
                        v-model.trim="form.name"
                        maxlength="120"
                        required
                        autocomplete="off"
                      />
                    </div>
                    <div class="field">
                      <label for="user_email">Email</label
                      ><input
                        id="user_email"
                        v-model.trim="form.email"
                        type="email"
                        :disabled="editing"
                        :required="!editing"
                        autocomplete="off"
                      />
                    </div>
                    <div class="field">
                      <label for="user_password">{{
                        editing ? "Nova senha (opcional)" : "Senha inicial"
                      }}</label
                      ><input
                        id="user_password"
                        v-model="form.password"
                        type="password"
                        :required="!editing"
                        minlength="12"
                        autocomplete="new-password"
                      /><span class="form-help"
                        >Mínimo de 12 caracteres. Nunca será exibida na
                        URL.</span
                      >
                    </div>
                    <div class="field">
                      <label for="user_role">Perfil</label
                      ><select
                        id="user_role"
                        v-model="form.role"
                        @change="applyUserProfileDefaults"
                      >
                        <option value="analista">Analista</option>
                        <option value="lideranca">Liderança</option>
                        <option value="admin">Administrador</option>
                      </select>
                    </div>
                    <div class="full">
                      <label class="checkbox-line"
                        ><input type="checkbox" v-model="form.active" /> Conta
                        habilitada</label
                      >
                    </div>
                    <div class="full">
                      <div
                        class="label"
                        style="
                          font-size: 12px;
                          font-weight: 800;
                          margin-bottom: 10px;
                        "
                      >
                        Permissões de publicação
                      </div>
                      <div class="tag-list">
                        <label
                          v-for="p in [
                            { id: 'notices', label: 'Comunicados' },
                            { id: 'videos', label: 'Vídeos' },
                            { id: 'releases', label: 'Releases' },
                            { id: 'links', label: 'Links úteis' },
                          ]"
                          :key="p.id"
                          class="checkbox-line"
                          ><input
                            type="checkbox"
                            :value="p.id"
                            v-model="form.permissions"
                          />{{ p.label }}</label
                        >
                      </div>
                    </div>
                  </template>

                  <template v-if="current === 'notices'"
                    ><div class="field full">
                      <label for="notice_title">Título</label
                      ><input
                        id="notice_title"
                        v-model="form.title"
                        maxlength="140"
                        required
                      />
                    </div>
                    <div class="field full">
                      <label for="notice_body">Conteúdo</label
                      ><textarea
                        id="notice_body"
                        v-model="form.body"
                        maxlength="8000"
                        rows="8"
                        required
                      />
                    </div>
                    <div class="field">
                      <label for="notice_category">Categoria</label
                      ><select id="notice_category" v-model="form.category">
                        <option
                          v-for="option in noticeOptions.categories"
                          :key="option.id"
                          :value="option.id"
                        >
                          {{ option.label }}
                        </option>
                      </select>
                    </div>
                    <div class="field">
                      <label for="notice_priority">Prioridade</label
                      ><select id="notice_priority" v-model="form.priority">
                        <option
                          v-for="option in noticeOptions.priorities"
                          :key="option.id"
                          :value="option.id"
                        >
                          {{ option.label }}
                        </option>
                      </select>
                    </div>
                    <div class="field">
                      <label for="notice_status">Status</label
                      ><select id="notice_status" v-model="form.status">
                        <option value="draft">Rascunho</option>
                        <option value="published">Publicar / Agendar</option>
                      </select>
                    </div>
                    <div class="field">
                      <label for="notice_publish">Publicar em (opcional)</label
                      ><input
                        id="notice_publish"
                        type="datetime-local"
                        v-model="form.published_at"
                      />
                    </div>
                    <div class="field">
                      <label for="notice_expire">Expira em (opcional)</label
                      ><input
                        id="notice_expire"
                        type="datetime-local"
                        v-model="form.expires_at"
                      />
                    </div>
                    <div class="full tag-list">
                      <label class="checkbox-line"
                        ><input type="checkbox" v-model="form.pinned" /> Fixar
                        no mural</label
                      ><label class="checkbox-line"
                        ><input type="checkbox" v-model="form.requires_ack" />
                        Exigir ciência de leitura</label
                      >
                    </div></template
                  >
                  <template v-if="current === 'videos'"
                    ><div class="field full">
                      <label for="video_title">Título</label
                      ><input
                        id="video_title"
                        v-model="form.title"
                        maxlength="140"
                        required
                      />
                    </div>
                    <div class="field full">
                      <label for="video_url">URL do YouTube ou Vimeo</label
                      ><input
                        id="video_url"
                        v-model="form.url"
                        type="url"
                        required
                        placeholder="https://www.youtube.com/watch?v=..."
                      />
                    </div>
                    <div class="field">
                      <label for="video_category">Categoria</label
                      ><input
                        id="video_category"
                        v-model="form.category"
                        maxlength="50"
                        required
                      />
                    </div>
                    <div class="field full">
                      <label for="video_desc">Descrição</label
                      ><textarea
                        id="video_desc"
                        v-model="form.description"
                        maxlength="1500"
                        rows="4"
                      /></div
                  ></template>
                  <template v-if="current === 'releases'"
                    ><div class="field full">
                      <label for="release_title">Título</label
                      ><input
                        id="release_title"
                        v-model="form.title"
                        maxlength="140"
                        required
                      />
                    </div>
                    <div class="field">
                      <label for="release_product">Produto</label
                      ><input
                        id="release_product"
                        v-model="form.product"
                        maxlength="90"
                        required
                      />
                    </div>
                    <div class="field">
                      <label for="release_version">Versão</label
                      ><input
                        id="release_version"
                        v-model="form.version"
                        maxlength="60"
                      />
                    </div>
                    <div class="field full">
                      <label for="release_summary">Resumo</label
                      ><textarea
                        id="release_summary"
                        v-model="form.summary"
                        maxlength="1600"
                        rows="5"
                      />
                    </div>
                    <div class="field">
                      <label for="release_url"
                        >Referência HTTPS (opcional)</label
                      ><input id="release_url" v-model="form.url" type="url" />
                    </div>
                    <div class="field">
                      <label for="release_date">Data</label
                      ><input
                        id="release_date"
                        v-model="form.published_at"
                        type="date"
                        required
                      />
                    </div>
                    <div class="field">
                      <label for="release_status">Status</label
                      ><select id="release_status" v-model="form.status">
                        <option value="draft">Rascunho</option>
                        <option value="published">Publicado</option>
                      </select>
                    </div></template
                  >
                  <template v-if="current === 'links'"
                    ><div class="field full">
                      <label for="link_title">Título</label
                      ><input
                        id="link_title"
                        v-model="form.title"
                        maxlength="120"
                        required
                      />
                    </div>
                    <div class="field full">
                      <label for="link_url">URL HTTPS</label
                      ><input
                        id="link_url"
                        v-model="form.url"
                        type="url"
                        required
                      />
                    </div>
                    <div class="field">
                      <label for="link_category">Categoria</label
                      ><input
                        id="link_category"
                        v-model="form.category"
                        maxlength="55"
                      />
                    </div>
                    <div class="field">
                      <label for="link_status">Status</label
                      ><select id="link_status" v-model="form.status">
                        <option value="draft">Rascunho</option>
                        <option value="published">Publicado</option>
                      </select>
                    </div>
                    <div class="field full">
                      <label for="link_description">Descrição</label
                      ><textarea
                        id="link_description"
                        v-model="form.description"
                        maxlength="350"
                        rows="3"
                      /></div
                  ></template>
                  <div class="full form-actions">
                    <button
                      type="submit"
                      class="btn btn-primary"
                      :disabled="busy"
                    >
                      {{ busy ? "Salvando..." : "Salvar alterações" }}</button
                    ><button
                      class="btn btn-secondary"
                      type="button"
                      @click="closeEditor"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
              <div class="panel panel-pad">
                <div class="editor-heading">
                  <h2>Registros cadastrados</h2>
                  <span class="pill"
                    >{{
                      current === "notices"
                        ? filteredSortedNotices.length
                        : records[current]?.length || 0
                    }}
                    registro(s)</span
                  >
                  <button
                    v-if="current === 'notices' && hasNoticeFilters"
                    class="btn btn-secondary btn-small"
                    type="button"
                    @click="clearNoticeFilters"
                  >
                    Limpar filtros
                  </button>
                  <span
                    v-if="current === 'notices' && isAdmin"
                    class="notice-reorder-help"
                    role="status"
                  >
                    {{
                      noticeTable.sortBy
                        ? "Limpe a ordenação temporária para reordenar."
                        : "Arraste pela alça ao lado do título para alterar a ordem."
                    }}
                  </span>
                </div>
                <div v-if="!records[current]?.length" class="empty">
                  Ainda não há registros nesta seção.
                </div>
                <div
                  v-else-if="
                    current === 'notices' && !filteredSortedNotices.length
                  "
                  class="empty"
                >
                  Nenhum comunicado corresponde aos filtros.
                </div>
                <div
                  v-else
                  :class="[
                    'record-table',
                    { 'notice-record-table': current === 'notices' },
                  ]"
                >
                  <table
                    class="records"
                    :style="
                      current === 'notices'
                        ? {
                            width: '100%',
                            tableLayout: 'fixed',
                          }
                        : undefined
                    "
                  >
                    <colgroup v-if="current === 'notices'">
                      <col
                        :style="{
                          width: `${(noticeColumnWidths.title / noticeTableWidth) * 100}%`,
                        }"
                      />
                      <col
                        :style="{
                          width: `${(noticeColumnWidths.category / noticeTableWidth) * 100}%`,
                        }"
                      />
                      <col
                        :style="{
                          width: `${(noticeColumnWidths.status / noticeTableWidth) * 100}%`,
                        }"
                      />
                      <col
                        :style="{
                          width: `${(noticeColumnWidths.published_at / noticeTableWidth) * 100}%`,
                        }"
                      />
                      <col
                        :style="{
                          width: `${(noticeColumnWidths.actions / noticeTableWidth) * 100}%`,
                        }"
                      />
                    </colgroup>
                    <thead>
                      <tr v-if="current === 'notices'">
                        <th
                          :class="{
                            'sorted-column': noticeTable.sortBy === 'title',
                          }"
                          :aria-sort="noticeAriaSort('title')"
                        >
                          <button
                            class="sortable-heading"
                            type="button"
                            @click="sortNoticesBy('title')"
                          >
                            Título{{ noticeSortIndicator("title") }}
                          </button>
                          <span
                            class="notice-column-resizer"
                            role="separator"
                            aria-orientation="vertical"
                            aria-label="Redimensionar coluna Título"
                            tabindex="0"
                            title="Arraste para redimensionar; duplo clique para restaurar"
                            @pointerdown="
                              startNoticeColumnResize($event, 'title')
                            "
                            @pointermove="resizeNoticeColumn"
                            @pointerup="finishNoticeColumnResize"
                            @pointercancel="finishNoticeColumnResize"
                            @dblclick="resetNoticeColumnWidth('title')"
                            @keydown="
                              handleNoticeResizeKeydown($event, 'title')
                            "
                          />
                        </th>
                        <th
                          :class="{
                            'sorted-column': noticeTable.sortBy === 'category',
                          }"
                          :aria-sort="noticeAriaSort('category')"
                        >
                          <button
                            class="sortable-heading"
                            type="button"
                            @click="sortNoticesBy('category')"
                          >
                            Categoria{{ noticeSortIndicator("category") }}
                          </button>
                          <span
                            class="notice-column-resizer"
                            role="separator"
                            aria-orientation="vertical"
                            aria-label="Redimensionar coluna Categoria"
                            tabindex="0"
                            title="Arraste para redimensionar; duplo clique para restaurar"
                            @pointerdown="
                              startNoticeColumnResize($event, 'category')
                            "
                            @pointermove="resizeNoticeColumn"
                            @pointerup="finishNoticeColumnResize"
                            @pointercancel="finishNoticeColumnResize"
                            @dblclick="resetNoticeColumnWidth('category')"
                            @keydown="
                              handleNoticeResizeKeydown($event, 'category')
                            "
                          />
                        </th>
                        <th
                          :class="{
                            'sorted-column': noticeTable.sortBy === 'status',
                          }"
                          :aria-sort="noticeAriaSort('status')"
                        >
                          <button
                            class="sortable-heading"
                            type="button"
                            @click="sortNoticesBy('status')"
                          >
                            Status{{ noticeSortIndicator("status") }}
                          </button>
                          <span
                            class="notice-column-resizer"
                            role="separator"
                            aria-orientation="vertical"
                            aria-label="Redimensionar coluna Status"
                            tabindex="0"
                            title="Arraste para redimensionar; duplo clique para restaurar"
                            @pointerdown="
                              startNoticeColumnResize($event, 'status')
                            "
                            @pointermove="resizeNoticeColumn"
                            @pointerup="finishNoticeColumnResize"
                            @pointercancel="finishNoticeColumnResize"
                            @dblclick="resetNoticeColumnWidth('status')"
                            @keydown="
                              handleNoticeResizeKeydown($event, 'status')
                            "
                          />
                        </th>
                        <th
                          :class="{
                            'sorted-column':
                              noticeTable.sortBy === 'published_at',
                          }"
                          :aria-sort="noticeAriaSort('published_at')"
                        >
                          <button
                            class="sortable-heading"
                            type="button"
                            @click="sortNoticesBy('published_at')"
                          >
                            Publicação{{
                              noticeSortIndicator("published_at")
                            }}
                          </button>
                          <span
                            class="notice-column-resizer"
                            role="separator"
                            aria-orientation="vertical"
                            aria-label="Redimensionar coluna Publicação"
                            tabindex="0"
                            title="Arraste para redimensionar; duplo clique para restaurar"
                            @pointerdown="
                              startNoticeColumnResize($event, 'published_at')
                            "
                            @pointermove="resizeNoticeColumn"
                            @pointerup="finishNoticeColumnResize"
                            @pointercancel="finishNoticeColumnResize"
                            @dblclick="resetNoticeColumnWidth('published_at')"
                            @keydown="
                              handleNoticeResizeKeydown($event, 'published_at')
                            "
                          />
                        </th>
                        <th style="text-align: right">
                          <span
                            class="notice-column-resizer"
                            role="separator"
                            aria-orientation="vertical"
                            aria-label="Redimensionar coluna Ações"
                            tabindex="0"
                            title="Arraste para redimensionar; duplo clique para restaurar"
                            @pointerdown="
                              startNoticeColumnResize($event, 'actions')
                            "
                            @pointermove="resizeNoticeColumn"
                            @pointerup="finishNoticeColumnResize"
                            @pointercancel="finishNoticeColumnResize"
                            @dblclick="resetNoticeColumnWidth('actions')"
                            @keydown="
                              handleNoticeResizeKeydown($event, 'actions')
                            "
                          />
                        </th>
                      </tr>
                      <tr
                        v-if="current === 'notices'"
                        class="notice-filter-row"
                      >
                        <th
                          :class="{
                            'set-filter-open': openSetFilter === 'notice-title',
                          }"
                        >
                          <div class="notice-filter-control">
                          <input
                            v-model="noticeTable.filters.title"
                            class="notice-table-filter"
                            type="search"
                            aria-label="Filtrar comunicados por título ou conteúdo"
                            placeholder="Filtrar..."
                          />
                            <SetFilterPopover
                              id="notice-title"
                              label="Título"
                              compact
                              :options="noticeTitleFilterOptions"
                              :model-value="
                                setFilterSelections['notice-title']
                              "
                              :open="openSetFilter === 'notice-title'"
                              :active="
                                isSetFilterActive(
                                  'notice-title',
                                  noticeTitleFilterOptions,
                                )
                              "
                              @toggle="toggleSetFilter('notice-title')"
                              @update:model-value="
                                updateSetFilter('notice-title', $event)
                              "
                            />
                          </div>
                        </th>
                        <th
                          :class="{
                            'set-filter-open':
                              openSetFilter === 'notice-category',
                          }"
                        >
                          <div class="notice-filter-control">
                          <input
                            v-model="noticeTable.filters.category"
                            class="notice-table-filter"
                            type="search"
                            aria-label="Filtrar categoria"
                            placeholder="Filtrar..."
                          />
                            <SetFilterPopover
                              id="notice-category"
                              label="Categoria"
                              compact
                              :options="noticeCategoryFilterOptions"
                              :model-value="
                                setFilterSelections['notice-category']
                              "
                              :open="openSetFilter === 'notice-category'"
                              :active="
                                isSetFilterActive(
                                  'notice-category',
                                  noticeCategoryFilterOptions,
                                )
                              "
                              @toggle="toggleSetFilter('notice-category')"
                              @update:model-value="
                                updateSetFilter('notice-category', $event)
                              "
                            />
                          </div>
                        </th>
                        <th
                          :class="{
                            'set-filter-open':
                              openSetFilter === 'notice-status',
                          }"
                        >
                          <div class="notice-filter-control">
                          <input
                            v-model="noticeTable.filters.status"
                            class="notice-table-filter"
                            type="search"
                            aria-label="Filtrar status"
                            placeholder="Filtrar..."
                          />
                            <SetFilterPopover
                              id="notice-status"
                              label="Status"
                              align="right"
                              compact
                              :options="noticeStatusFilterOptions"
                              :model-value="
                                setFilterSelections['notice-status']
                              "
                              :open="openSetFilter === 'notice-status'"
                              :active="
                                isSetFilterActive(
                                  'notice-status',
                                  noticeStatusFilterOptions,
                                )
                              "
                              @toggle="toggleSetFilter('notice-status')"
                              @update:model-value="
                                updateSetFilter('notice-status', $event)
                              "
                            />
                          </div>
                        </th>
                        <th
                          :class="{
                            'set-filter-open':
                              openSetFilter === 'notice-publication',
                          }"
                        >
                          <div class="notice-filter-control">
                          <input
                            v-model="noticeTable.filters.published_at"
                            class="notice-table-filter"
                            type="search"
                            aria-label="Filtrar data de publicação"
                            placeholder="Filtrar..."
                          />
                            <SetFilterPopover
                              id="notice-publication"
                              label="Publicação"
                              align="right"
                              compact
                              :options="noticePublicationFilterOptions"
                              :model-value="
                                setFilterSelections['notice-publication']
                              "
                              :open="openSetFilter === 'notice-publication'"
                              :active="
                                isSetFilterActive(
                                  'notice-publication',
                                  noticePublicationFilterOptions,
                                )
                              "
                              @toggle="toggleSetFilter('notice-publication')"
                              @update:model-value="
                                updateSetFilter('notice-publication', $event)
                              "
                            />
                          </div>
                        </th>
                        <th>
                        </th>
                      </tr>
                      <tr v-if="current !== 'notices'">
                        <th>{{ current === "users" ? "Nome" : "Título" }}</th>
                        <th>
                          {{
                            current === "users"
                              ? "Perfil"
                              : "Categoria / Produto"
                          }}
                        </th>
                        <th>Status</th>
                        <th style="text-align: right">Ações</th>
                      </tr>
                    </thead>
                    <TransitionGroup name="notice-row-transition" tag="tbody">
                      <tr
                        v-for="item in current === 'notices'
                          ? paginatedNotices
                          : records[current]"
                        :key="item.id"
                        :class="{
                          'notice-row-dragging': draggingNoticeId === item.id,
                          'notice-row-drop-before':
                            dragOverNoticeId === item.id &&
                            dragInsertPosition === 'before',
                          'notice-row-drop-after':
                            dragOverNoticeId === item.id &&
                            dragInsertPosition === 'after',
                        }"
                        :data-notice-row="
                          current === 'notices' ? item.id : undefined
                        "
                      >
                        <template v-if="current === 'notices'">
                          <td class="notice-title-cell">
                            <button
                              v-if="current === 'notices' && isAdmin"
                              class="notice-drag-handle"
                              type="button"
                              :disabled="
                                savingManualOrder || Boolean(noticeTable.sortBy)
                              "
                              :aria-label="`Arrastar comunicado ${item.title}`"
                              :title="
                                noticeTable.sortBy
                                  ? 'Limpe a ordenação temporária para arrastar'
                                  : 'Clique e segure para alterar a posição'
                              "
                              @pointerdown="startNoticeDrag($event, item)"
                              @pointermove="moveNoticeDrag"
                              @pointerup="endNoticeDrag"
                              @pointercancel="finishNoticeDrag"
                              @lostpointercapture="finishNoticeDrag"
                            >
                              <svg
                                aria-hidden="true"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                              >
                                <circle cx="8" cy="5" r="1.5" />
                                <circle cx="16" cy="5" r="1.5" />
                                <circle cx="8" cy="12" r="1.5" />
                                <circle cx="16" cy="12" r="1.5" />
                                <circle cx="8" cy="19" r="1.5" />
                                <circle cx="16" cy="19" r="1.5" />
                              </svg>
                            </button>
                            <span>{{ item.title }}</span>
                          </td>
                          <td>
                            {{
                              noticeOptions.categories.find(
                                (option) => option.id === item.category,
                              )?.label || item.category
                            }}
                          </td>
                          <td>
                            <span class="pill muted">{{ stateLabel(item) }}</span>
                          </td>
                          <td>{{ formatNoticeDate(item.published_at) }}</td>
                        </template>
                        <template v-else>
                          <td>
                            {{ item.name || item.title }}
                            <div class="form-help">
                              {{ item.email || item.version || "" }}
                            </div>
                          </td>
                          <td>
                            {{
                              item.role ||
                              item.category ||
                              item.product ||
                              "—"
                            }}
                          </td>
                          <td>
                            <span class="pill muted">{{
                              current === "users"
                                ? item.active === false
                                  ? "Bloqueado"
                                  : "Habilitado"
                                : current === "videos"
                                  ? "Publicado"
                                  : stateLabel(item)
                            }}</span>
                          </td>
                        </template>
                        <td>
                          <div class="actions record-actions">
                            <button
                              class="record-icon-button edit-action"
                              type="button"
                              aria-label="Editar registro"
                              title="Editar"
                              :disabled="savingManualOrder"
                              @click="editRecord(item)"
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
                                <path
                                  d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z"
                                />
                              </svg>
                            </button>
                            <button
                              v-if="current !== 'users'"
                              class="record-icon-button archive-action"
                              :class="{ 'delete-action': current === 'videos' }"
                              type="button"
                              :aria-label="
                                current === 'videos'
                                  ? 'Excluir registro'
                                  : 'Arquivar registro'
                              "
                              :title="
                                current === 'videos' ? 'Excluir' : 'Arquivar'
                              "
                              :disabled="savingManualOrder"
                              @click="archive(item)"
                            >
                              <svg
                                v-if="current !== 'videos'"
                                aria-hidden="true"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="1.8"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                              >
                                <path
                                  d="M3 7h18M5 7l1 14h12l1-14M9 7V4h6v3m-5 4v6m4-6v6"
                                />
                              </svg>
                              <svg
                                v-else
                                aria-hidden="true"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="1.8"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                              >
                                <path
                                  d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6"
                                />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    </TransitionGroup>
                  </table>
                </div>
                <div
                  v-if="current === 'notices'"
                  class="notice-pagination"
                >
                  <label class="notice-page-size">
                    Itens por página
                    <select
                      v-model.number="noticeTable.pageSize"
                      @change="noticeTable.page = 1"
                    >
                      <option :value="10">10</option>
                      <option :value="25">25</option>
                      <option :value="50">50</option>
                    </select>
                  </label>
                  <span>
                    Página {{ noticeTable.page }} de {{ noticePageCount }}
                  </span>
                  <div class="notice-pagination-actions">
                    <button
                      class="btn btn-secondary btn-small"
                      type="button"
                      :disabled="noticeTable.page <= 1"
                      @click="noticeTable.page--"
                    >
                      Anterior
                    </button>
                    <button
                      class="btn btn-secondary btn-small"
                      type="button"
                      :disabled="noticeTable.page >= noticePageCount"
                      @click="noticeTable.page++"
                    >
                      Próxima
                    </button>
                  </div>
                </div>
              </div>
            </template>
          </template>
        </template>
      </section>
    </div>
  </div>
</template>

<style scoped>
.profile-card + .profile-card {
  margin-top: 18px;
}
.notice-options-panel {
  margin-bottom: 22px;
  font-size: 13px;
}
.notice-subtabs .filter-chip {
  font-size: 13px;
}
.notice-options-panel .field label,
.notice-options-panel .btn {
  font-size: 13px;
}
.notice-option-form {
  display: flex;
  align-items: end;
  gap: 14px;
  margin: 18px 0;
  width: 100%;
}
.notice-option-form .field {
  flex: 1;
}
.notice-option-form .actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
.sortable-heading {
  display: block;
  width: 100%;
  height: 24px;
  margin: 0 auto;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  line-height: 24px;
  text-align: center;
  white-space: nowrap;
}
.sortable-heading:hover {
  color: var(--purple);
}
.sortable-heading:disabled {
  cursor: default;
}
.filterable-heading {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
}
.notice-record-table th.set-filter-open,
.option-record-table th.set-filter-open {
  z-index: 20;
}
.notice-record-table th[aria-sort="ascending"],
.notice-record-table th[aria-sort="descending"] {
  background: #f3edfc;
  color: var(--purple-dark);
}
.option-record-table th[aria-sort="ascending"],
.option-record-table th[aria-sort="descending"] {
  background: #e9e0f3;
  color: var(--purple-dark);
}
.notice-record-table {
  overflow-x: clip;
  width: 100%;
}
.notice-record-table .records {
  width: 100%;
}
.notice-record-table thead tr:first-child th,
.option-record-table thead tr:first-child th,
.notice-record-table thead tr.notice-filter-row th {
  box-sizing: border-box;
  height: 36px;
  padding: 6px 12px;
  vertical-align: middle;
}
.notice-record-table thead {
  background: #f3f0f7;
}
.notice-record-table thead tr:first-child th {
  background: #f3f0f7;
  color: var(--ink);
  line-height: 24px;
}
.notice-record-table thead tr.notice-filter-row th {
  background: #f8f6fb;
  border-top: 1px solid var(--border);
  line-height: normal;
}
.notice-record-table thead tr:first-child th[aria-sort="ascending"],
.notice-record-table thead tr:first-child th[aria-sort="descending"] {
  background: #e9e0f3;
  color: var(--purple-dark);
}
.option-record-table thead {
  background: #f3f0f7;
}
.option-record-table thead tr:first-child th {
  background: #f3f0f7;
  color: var(--ink);
  line-height: 24px;
}
.option-record-table thead tr.notice-filter-row th {
  background: #f8f6fb;
  border-top: 1px solid var(--border);
  line-height: normal;
}
.option-record-table thead tr:first-child th[aria-sort="ascending"],
.option-record-table thead tr:first-child th[aria-sort="descending"] {
  background: #e9e0f3;
  color: var(--purple-dark);
}
.notice-filter-control {
  display: flex;
  width: 100%;
  min-width: 0;
  height: 24px;
  align-items: center;
  gap: 12px;
  box-sizing: border-box;
}
.notice-filter-control .notice-table-filter {
  flex: 1 1 0;
  width: 100%;
  min-width: 0;
  height: 24px;
  margin: 0;
  padding: 3px 8px;
  box-sizing: border-box;
}
.notice-filter-control .set-filter-popover {
  flex: 0 0 16px;
  width: 16px;
  height: 24px;
}
.notice-record-table tbody td:first-child {
  overflow-wrap: anywhere;
}
.notice-record-table .notice-title-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}
.notice-record-table .notice-title-cell > span {
  min-width: 0;
  overflow-wrap: anywhere;
}
.notice-drag-handle {
  display: inline-grid;
  flex: 0 0 24px;
  width: 24px;
  height: 30px;
  padding: 3px;
  place-items: center;
  border: 0;
  border-radius: 5px;
  background: transparent;
  color: #806a98;
  cursor: grab;
  touch-action: none;
}
.notice-drag-handle svg {
  width: 18px;
  height: 18px;
}
.notice-drag-handle:hover:not(:disabled) {
  background: #f3edfc;
  color: var(--purple-dark);
}
.notice-drag-handle:active {
  cursor: grabbing;
}
.notice-drag-handle:disabled {
  cursor: not-allowed;
}
.notice-reorder-help {
  color: var(--muted);
  font-size: 12px;
}
.notice-row-transition-move {
  transition: transform 180ms ease;
}
.notice-record-table tr.notice-row-dragging {
  opacity: 0.5;
  background: #f3edfc;
  cursor: grabbing;
}
.notice-record-table tr.notice-row-dragging .notice-drag-handle {
  cursor: grabbing;
}
.notice-record-table tr.notice-row-drop-before > td {
  border-top: 2px solid var(--purple);
}
.notice-record-table tr.notice-row-drop-after > td {
  border-bottom: 2px solid var(--purple);
}
.option-record-table {
  overflow-x: clip;
  width: 100%;
}
.option-record-table .records {
  width: 100%;
}
.option-record-table tbody td:first-child {
  overflow-wrap: anywhere;
}
.option-record-table tbody tr {
  height: 64px;
}
.option-record-table tbody td {
  vertical-align: bottom;
}
.option-record-table tbody td:last-child {
  text-align: right;
}
.option-record-table .record-actions {
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  min-height: 34px;
}
.option-grid-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
  margin-top: 16px;
  font-size: 13px;
}
.notice-record-table td:last-child,
.option-record-table td:last-child {
  vertical-align: bottom;
}
.notice-record-table .record-actions,
.option-record-table .record-actions {
  align-items: flex-end;
  justify-content: flex-end;
}
.notice-record-table thead tr:first-child th,
.option-record-table thead tr:first-child th {
  position: relative;
}
.notice-column-resizer {
  position: absolute;
  z-index: 2;
  top: 0;
  right: -5px;
  width: 10px;
  height: 100%;
  cursor: col-resize;
  touch-action: none;
  user-select: none;
}
.notice-column-resizer::after {
  position: absolute;
  top: 20%;
  right: 4px;
  width: 2px;
  height: 60%;
  border-radius: 2px;
  background: transparent;
  content: "";
}
.notice-column-resizer:hover::after,
.notice-column-resizer:focus-visible::after {
  background: var(--purple);
}
.notice-column-resizer:focus-visible {
  outline: none;
}
.notice-filter-row th {
  box-sizing: border-box;
  height: 36px;
  padding: 6px 12px;
  vertical-align: middle;
}
.notice-table-filter {
  display: block;
  width: 100%;
  min-width: 0;
  margin-top: 8px;
  padding: 7px 8px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: #fff;
  color: var(--ink);
  font: inherit;
  font-size: 13px;
  opacity: 1;
}
.notice-table-filter::placeholder {
  color: #9ca3af;
  opacity: 0.4;
}
.notice-pagination {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
  margin-top: 16px;
  font-size: 13px;
}
.notice-page-size {
  display: flex;
  align-items: center;
  gap: 8px;
}
.notice-page-size select {
  padding: 6px 8px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: #fff;
  color: var(--ink);
}
.notice-pagination-actions {
  display: flex;
  gap: 8px;
}
.record-actions {
  justify-content: flex-end;
  gap: 8px;
}
.record-icon-button {
  display: inline-grid;
  width: 34px;
  height: 34px;
  padding: 7px;
  place-items: center;
  border: 1px solid var(--border);
  border-radius: 9px;
  background: #fff;
  color: #5d3d8c;
  transition:
    color 0.15s,
    background 0.15s,
    border-color 0.15s;
}
.record-icon-button svg {
  width: 18px;
  height: 18px;
}
.record-icon-button:hover {
  border-color: #cdb9ed;
  background: #f5f0fc;
}
.record-icon-button.archive-action,
.record-icon-button.delete-action {
  color: #b73f35;
}
.record-icon-button.archive-action:hover,
.record-icon-button.delete-action:hover {
  border-color: #f0c9c3;
  background: #fff0ed;
}
.record-icon-button:focus-visible {
  outline: 3px solid #9157de55;
  outline-offset: 2px;
}
@media (max-width: 600px) {
  .notice-option-form {
    align-items: stretch;
    flex-direction: column;
  }
  .option-grid-footer {
    align-items: flex-end;
    flex-direction: column;
  }
  .notice-pagination {
    align-items: flex-end;
    flex-direction: column;
  }
}
</style>
