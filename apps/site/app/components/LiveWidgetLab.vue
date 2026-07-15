<template>
  <section id="lab" class="lab-section">
    <div class="section-heading">
      <p class="eyebrow">Live configuration</p>
      <h2>Tune the widget contract before you paste it.</h2>
      <p>
        Change the runtime props, inspect the script tag, then open the same widget instance from the custom trigger.
      </p>
    </div>

    <div class="lab">
      <form class="lab-controls" @submit.prevent>
        <label>
          <span>Library</span>
          <input v-model="library" type="text" autocomplete="off" />
        </label>

        <label>
          <span>Placeholder</span>
          <input v-model="placeholder" type="text" autocomplete="off" />
        </label>

        <div class="control-group">
          <span>Theme</span>
          <div class="segmented">
            <button
              v-for="item in themes"
              :key="item"
              type="button"
              :aria-pressed="theme === item"
              @click="theme = item"
            >
              {{ item }}
            </button>
          </div>
        </div>

        <label>
          <span>Position</span>
          <select v-model="position">
            <option v-for="item in positions" :key="item" :value="item">{{ item }}</option>
          </select>
        </label>

        <div class="control-group">
          <span>Accent</span>
          <div class="swatches">
            <button
              v-for="item in colors"
              :key="item"
              type="button"
              :aria-label="`Use ${item}`"
              :aria-pressed="color === item"
              :style="{ '--swatch': item }"
              @click="color = item"
            />
          </div>
        </div>

        <label class="toggle">
          <input v-model="hideDefaultButton" type="checkbox" />
          <span>Use custom trigger</span>
        </label>

        <button id="context7-lab-trigger" class="lab-trigger" type="button">
          <MessageSquare :size="18" aria-hidden="true" />
          Ask docs
        </button>
      </form>

      <div class="lab-output">
        <CodeBlock id="lab-script" label="/widget.js" :code="scriptCode" />
        <CodeBlock id="lab-vue" label="Vue component" :code="vueCode" />
      </div>
    </div>

    <Context7Widget
      :color="color"
      :custom-trigger="hideDefaultButton ? '#context7-lab-trigger' : undefined"
      :hide-default-button="hideDefaultButton"
      :library="library"
      :placeholder="placeholder"
      :position="position"
      :theme="theme"
      title="Context7 Widget Docs"
      widget-id="site-lab"
      @question="events.question += 1"
      @answer-complete="events.answer += 1"
    />

    <div class="event-strip" aria-live="polite">
      <span>Questions {{ events.question }}</span>
      <span>Completed answers {{ events.answer }}</span>
      <span>Widget id site-lab</span>
    </div>
  </section>
</template>

<script setup lang="ts">
import { MessageSquare } from "lucide-vue-next";
import { Context7Widget, type Context7Position, type Context7Theme } from "@desource/context7-widget-vue";
import { buildContext7WidgetScriptTag } from "@desource/context7-widget";

const themes: Context7Theme[] = ["auto", "light", "dark"];
const positions: Context7Position[] = ["bottom-right", "bottom-left", "top-right", "top-left"];
const colors = ["#10b981", "#f97316", "#3b82f6", "#f43f5e"];

const library = ref("/desource-labs/context7-widget");
const placeholder = ref("Ask integration questions...");
const theme = ref<Context7Theme>("auto");
const position = ref<Context7Position>("bottom-right");
const color = ref(colors[0]);
const hideDefaultButton = ref(true);
const events = reactive({ answer: 0, question: 0 });

const scriptCode = computed(() =>
  buildContext7WidgetScriptTag({
    color: color.value,
    customTrigger: hideDefaultButton.value ? "#context7-lab-trigger" : undefined,
    hideDefaultButton: hideDefaultButton.value,
    library: library.value,
    placeholder: placeholder.value,
    position: position.value,
    theme: theme.value
  })
);

const vueCode = computed(
  () => `<Context7Widget
  library="${library.value}"
  color="${color.value}"
  theme="${theme.value}"
  position="${position.value}"
  ${hideDefaultButton.value ? 'custom-trigger="#context7-lab-trigger"\n  hide-default-button' : ""}
  placeholder="${placeholder.value}"
  @question="trackQuestion"
/>`
);
</script>
