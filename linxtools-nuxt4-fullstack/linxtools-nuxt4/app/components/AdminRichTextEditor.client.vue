<script setup lang="ts">
import { onBeforeUnmount, watch } from "vue";
import Editor from "@tinymce/tinymce-vue";
import type { Editor as TinyMceEditor } from "tinymce";
import "tinymce/tinymce";
import "tinymce/icons/default";
import "tinymce/themes/silver";
import "tinymce/models/dom";
import "tinymce/plugins/advlist";
import "tinymce/plugins/autolink";
import "tinymce/plugins/charmap";
import "tinymce/plugins/code";
import "tinymce/plugins/codesample";
import "tinymce/plugins/fullscreen";
import "tinymce/plugins/help";
import "tinymce/plugins/image";
import "tinymce/plugins/insertdatetime";
import "tinymce/plugins/link";
import "tinymce/plugins/lists";
import "tinymce/plugins/media";
import "tinymce/plugins/nonbreaking";
import "tinymce/plugins/pagebreak";
import "tinymce/plugins/preview";
import "tinymce/plugins/quickbars";
import "tinymce/plugins/searchreplace";
import "tinymce/plugins/table";
import "tinymce/plugins/visualblocks";
import "tinymce/plugins/wordcount";
import "tinymce/skins/ui/oxide/skin.min.css";

const props = defineProps<{ modelValue: string; id?: string }>();
const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();
let editorInstance: TinyMceEditor | null = null;

async function uploadPendingImages() {
  if (editorInstance) await editorInstance.uploadImages();
}

defineExpose({ uploadPendingImages });
onBeforeUnmount(() => {
  editorInstance = null;
});

const plugins = [
  "advlist",
  "autolink",
  "charmap",
  "code",
  "codesample",
  "fullscreen",
  "help",
  "image",
  "insertdatetime",
  "link",
  "lists",
  "media",
  "nonbreaking",
  "pagebreak",
  "preview",
  "quickbars",
  "searchreplace",
  "table",
  "visualblocks",
  "wordcount",
].join(" ");

const contentStyle = `
  body { color: #292339; font-family: Arial, sans-serif; font-size: 14px; line-height: 1.7; }
  p { margin: 0 0 1em; }
  img, video, iframe { max-width: 100%; }
  table { border-collapse: collapse; max-width: 100%; }
  td, th { border: 1px solid #d8d2e3; padding: 6px 8px; }
  blockquote { border-left: 3px solid #5d2fb1; margin-left: 0; padding-left: 1em; color: #625b70; }
  pre { overflow-x: auto; padding: 12px; background: #f3f0f7; }
`;

function setup(editor: TinyMceEditor) {
  editorInstance = editor;
  let hasCopiedFormatting = false;
  let copiedTextFormats: string[] = [];
  let copiedColor = "";
  let copiedBackground = "";
  let copiedFontFamily = "";
  let copiedFontSize = "";

  editor.ui.registry.addButton("formatpainter", {
    text: "Pincel",
    tooltip: "Copiar e aplicar formatação",
    onAction() {
      if (!hasCopiedFormatting) {
        copiedTextFormats = [
          "bold",
          "italic",
          "underline",
          "strikethrough",
          "superscript",
          "subscript",
        ].filter((format) => editor.formatter.match(format));
        const node = editor.selection.getNode() as HTMLElement;
        const style = node.ownerDocument.defaultView?.getComputedStyle(node);
        copiedColor = style?.color || "";
        copiedBackground = style?.backgroundColor || "";
        copiedFontFamily = style?.fontFamily || "";
        copiedFontSize = style?.fontSize || "";
        hasCopiedFormatting = true;
        editor.notificationManager.open({
          text: "Selecione outro trecho e clique em Pincel para aplicar.",
          type: "info",
          timeout: 2400,
        });
        return;
      }

      editor.execCommand("RemoveFormat");
      for (const format of copiedTextFormats) editor.formatter.apply(format);
      if (copiedColor) editor.execCommand("ForeColor", false, copiedColor);
      if (copiedBackground)
        editor.execCommand("HiliteColor", false, copiedBackground);
      if (copiedFontFamily)
        editor.execCommand("FontName", false, copiedFontFamily);
      if (copiedFontSize)
        editor.execCommand("FontSize", false, copiedFontSize);
      copiedTextFormats = [];
      copiedColor = "";
      copiedBackground = "";
      copiedFontFamily = "";
      copiedFontSize = "";
      hasCopiedFormatting = false;
    },
  });

  editor.ui.registry.addMenuItem("pasteastext", {
    text: "Colar como texto simples",
    onAction: async () => {
      try {
        const text = await navigator.clipboard.readText();
        editor.insertContent(
          editor.dom.encode(text).replace(/\r\n?|\n/g, "<br>"),
        );
      } catch {
        editor.notificationManager.open({
          text: "Não foi possível acessar a área de transferência.",
          type: "error",
        });
      }
    },
  });

  editor.ui.registry.addMenuButton("lineheight", {
    text: "Espaçamento",
    fetch(callback) {
      callback(
        ["1", "1.15", "1.5", "2"]
          .map((value) => ({
            type: "menuitem" as const,
            text: value,
            onAction: () => {
              const blocks = editor.selection.getSelectedBlocks();
              editor.undoManager.transact(() => {
                for (const block of blocks)
                  editor.dom.setStyle(block, "line-height", value);
              });
              editor.nodeChanged();
            },
          })),
      );
    },
  });
}

async function uploadImage(
  blobInfo: { blob: () => Blob; filename: () => string },
  _progress: (percent: number) => void,
): Promise<string> {
  const data = new FormData();
  data.append("file", blobInfo.blob(), blobInfo.filename());
  const result = await $fetch<{ location: string }>(
    "/api/admin/notices/images",
    { method: "POST", body: data },
  );
  return result.location;
}

const init = {
  base_url: "/tinymce",
  language: "pt-BR",
  language_url: "/tinymce/langs/pt-BR.js",
  plugin_base_urls: { help: "/tinymce/plugins/help" },
  skin: false,
  content_css: false,
  height: 480,
  min_height: 360,
  menubar: "file edit insert view format table tools help",
  plugins,
  toolbar:
    "undo redo | blocks fontfamily fontsize | bold italic underline strikethrough superscript subscript | forecolor backcolor formatpainter removeformat | alignleft aligncenter alignright alignjustify | outdent indent | bullist numlist | lineheight | link image media table hr codesample | searchreplace preview code fullscreen",
  toolbar_mode: "sliding",
  statusbar: true,
  elementpath: true,
  branding: false,
  promotion: false,
  resize: true,
  block_formats:
    "Parágrafo=p;Título 1=h1;Título 2=h2;Título 3=h3;Título 4=h4;Título 5=h5;Título 6=h6;Citação=blockquote;Pré-formatado=pre",
  font_family_formats:
    "Arial=arial,helvetica,sans-serif;Georgia=georgia,palatino,serif;Tahoma=tahoma,arial,sans-serif;Times New Roman=times new roman,times,serif;Verdana=verdana,geneva,sans-serif",
  font_size_formats:
    "8pt 9pt 10pt 11pt 12pt 14pt 16pt 18pt 24pt 36pt 48pt",
  style_formats: [
    { title: "Texto normal", block: "p" },
    { title: "Bloco de código", block: "pre", classes: "notice-code-block" },
  ],
  image_caption: true,
  image_advtab: true,
  automatic_uploads: true,
  paste_data_images: false,
  images_upload_handler: uploadImage,
  file_picker_types: "image",
  image_toolbar: "alignleft aligncenter alignright | imageoptions",
  table_default_attributes: { border: "1" },
  table_default_styles: { width: "100%", borderCollapse: "collapse" },
  table_toolbar:
    "tableprops | tableinsertrowbefore tableinsertrowafter tabledeleterow | tableinsertcolbefore tableinsertcolafter tabledeletecol | tablemergecells tablesplitcells",
  content_style: contentStyle,
  relative_urls: false,
  remove_script_host: false,
  convert_urls: false,
  setup,
  menu: {
    file: { title: "Arquivo", items: "newdocument" },
    edit: {
      title: "Editar",
      items: "undo redo | cut copy paste pasteastext | selectall | searchreplace",
    },
    insert: {
      title: "Inserir",
      items:
        "image link media inserttable | charmap | codesample hr pagebreak",
    },
    view: {
      title: "Visualizar",
      items: "preview | visualchars visualblocks | code fullscreen",
    },
    format: {
      title: "Formato",
      items:
        "blocks | bold italic underline strikethrough superscript subscript | formats | removeformat",
    },
    table: {
      title: "Tabela",
      items:
        "inserttable | cell row column | tableprops tabledelete | tablemergecells tablesplitcells",
    },
    tools: { title: "Ferramentas", items: "wordcount" },
    help: { title: "Ajuda", items: "help" },
  },
};

watch(
  () => props.modelValue,
  (value) => {
    if (editorInstance && editorInstance.getContent() !== value)
      editorInstance.setContent(value || "");
  },
);
</script>

<template>
  <div class="admin-rich-text-editor w-full min-w-0 overflow-visible">
    <Editor
      :id="id"
      license-key="gpl"
      :model-value="modelValue"
      :init="init"
      @update:model-value="emit('update:modelValue', $event)"
    />
  </div>
</template>

<style>
.admin-rich-text-editor .tox-tinymce {
  border: 1px solid #e8e4ef;
  border-radius: 10px;
  box-shadow: 0 4px 16px rgb(59 32 113 / 5%);
}
.tox .tox-tbtn--enabled,
.tox .tox-tbtn:hover,
.tox .tox-mbtn--active,
.tox .tox-mbtn:hover {
  background: #f3edfc !important;
  color: #3e197d !important;
}
</style>
