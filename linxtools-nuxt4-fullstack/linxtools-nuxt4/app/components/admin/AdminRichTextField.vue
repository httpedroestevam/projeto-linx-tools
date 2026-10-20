<script setup lang="ts">
import { defineAsyncComponent, ref } from "vue";

const props = withDefaults(
  defineProps<{
    id: string;
    label: string;
    fallbackRows?: number;
    required?: boolean;
    helpText?: string;
  }>(),
  { fallbackRows: 4, required: false, helpText: "" },
);
const model = defineModel<string>({ required: true });
const editor = defineAsyncComponent(
  () => import("../AdminRichTextEditor.client.vue"),
);
const editorRef = ref<{
  uploadPendingImages: () => Promise<void>;
} | null>(null);

async function uploadPendingImages() {
  await editorRef.value?.uploadPendingImages();
}

defineExpose({ uploadPendingImages });
</script>

<template>
  <div class="field full">
    <label :for="props.id">{{ props.label }}</label>
    <ClientOnly>
      <component
        :is="editor"
        :id="props.id"
        ref="editorRef"
        v-model="model"
      />
      <template #fallback>
        <textarea
          :id="props.id"
          v-model="model"
          :rows="props.fallbackRows"
          :required="props.required"
          :aria-label="props.label"
        />
      </template>
    </ClientOnly>
    <p v-if="props.helpText" class="form-help">{{ props.helpText }}</p>
  </div>
</template>
