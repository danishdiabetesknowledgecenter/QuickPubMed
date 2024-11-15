<template>
  <div class="column is-half">
    <div
      class="qpm_accordion"
      :class="{ 'not-expanded': !getIsExpanded }"
    >
      <div
        tabindex="0"
        @click="toggleAccordionState"
        @keypress.enter="toggleAccordionState"
      >
        <slot
          name="header"
          :expanded="getIsExpanded"
          :toggle-accordion-state="toggleAccordionState"
          :close="close"
        >
          <header class="qpm_accordion-header">
            <p class="qpm_accordion-header-title">
              {{ getTitle }}
            </p>
            <a class="qpm_accordion-header-icon">
              <span class="icon">
                <i class="fa fa-angle-up" />
              </span>
            </a>
          </header>
        </slot>
      </div>
      <transition
        name="collapse"
        :css="true"
        @enter="enterContent"
        @before-leave="beforeLeaveContent"
        @after-enter="afterEnterContent"
        @leave="leaveContent"
      >
        <div
          v-show="getIsExpanded"
          ref="body"
          class="qpm_accordion-content"
        >
          <div class="content">
            <slot />
            <transition-group
              v-if="shownModels !== null && shownModels.length !== 0"
              appear
              name="list-fade"
              tag="div"
              class="qpm_box"
              :css="true"
              @before-leave="beforeLeaveListItem"
              @leave="leaveListItem"
              @after-leave="afterLeaveListItem"
              @before-enter="beforeEnterListItem"
              @enter="enterListItem"
              @after-enter="afterEnterListItem"
            >
              <div
                v-for="item in shownModels"
                :key="item.uid"
                ref="listItems"
                class="list-fade-item"
                :name="'transition-item-' + item.uid"
              >
                <slot
                  name="listItem"
                  :model="item"
                />
              </div>
            </transition-group>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script>
export default {
  name: "AccordionMenu",
  props: {
    title: {
      type: String,
      default: "",
      required: false,
    },
    models: {
      type: Array,
      default: () => [],
      required: false,
    },
    openByDefault: {
      type: Boolean,
      default: false,
    },
    onlyUpdateModelWhenVisible: {
      type: Boolean,
      default: false,
    },
    isExpanded: {
      type: [Boolean, undefined],
      default: undefined,
      required: false,
    },
  },
  data() {
    return {
      expanded: this.openByDefault,
      shownModels: [],
      modelsChangesPending: [],
    };
  },
  computed: {
    getTitle() {
      return this.title || (this.expanded ? "close" : "open");
    },
    getIsExpanded() {
      const newState = this.isExpanded ?? this.expanded;
      this.$emit("expanded-changed", newState);
      return newState;
    },
  },
  watch: {
    models(newModelState, oldModelState) {
      const oldIds = oldModelState.map((model) => model.uid);
      const newModels = newModelState
        .map((model) => model.uid)
        .filter((uid) => oldIds.includes(uid));
      this.modelsChangesPending.splice(this.models.length, 0, ...newModels);

      if (this.onlyUpdateModelWhenVisible) {
        this.updateModelsIfOnScreen();
      } else {
        this.shownModels = newModelState;
      }
    },
  },
  mounted() {
    if (this.onlyUpdateModelWhenVisible) {
      window.addEventListener("scroll", this.updateModelsIfOnScreen, {
        passive: true,
      });
      if (this.openByDefault) {
        this.updateModelsIfOnScreen();
      }
    }
  },
  beforeUnmount() {
    if (this.onlyUpdateModelWhenVisible) {
      window.removeEventListener("scroll", this.updateModelsIfOnScreen, {
        passive: true,
      });
    }
  },
  methods: {
    toggleAccordionState() {
      if (this.getIsExpanded) {
        this.close();
      } else {
        this.open();
      }
    },
    close() {
      this.expanded = false;
      this.$emit("close");
    },
    open() {
      this.expanded = true;
      this.$emit("open");

      if (this.onlyUpdateModelWhenVisible) {
        this.updateModelsIfOnScreen();
      }
    },
    calcHeight() {
      const content = this.$refs.body.firstElementChild;
      const height = content.scrollHeight;
      return height;
    },
    setFixedHeight() {
      const body = this.$refs.body;
      body.style.height = `${this.calcHeight()}px`;
    },
    removeFixedHeight() {
      const body = this.$refs.body;
      body.style.height = null;
    },
    subtractElementHeight(el) {
      const body = this.$refs.body;
      const newHeight = body.scrollHeight - el.scrollHeight;
      body.style.height = `${newHeight}px`;
    },
    beforeLeaveListItem() {
      if (!this.expanded) return;
      this.setFixedHeight();
    },
    leaveListItem(el, done) {
      if (!this.expanded) return;
      this.setFixedHeight();
      el.addEventListener("transitionend", done, { once: true });
    },
    afterLeaveListItem() {
      if (!this.expanded) return;
      this.removeFixedHeight();
    },
    beforeEnterListItem() {
      if (!this.expanded) return;
      this.setFixedHeight();
    },
    enterListItem(el, done) {
      if (!this.expanded) return;
      this.setFixedHeight();
      el.addEventListener("transitionend", done, { once: true });
    },
    afterEnterListItem(el) {
      const elUid = el.getAttribute("name");
      this.removePendingModelChange(elUid);
      this.$emit("changed:items", el);

      if (!this.expanded) return;
      this.removeFixedHeight();
    },
    beforeLeaveContent() {
      this.setFixedHeight();
    },
    leaveContent(el, done) {
      this.subtractElementHeight(el);
      el.addEventListener("transitionend", done, { once: true });
    },
    enterContent(el, done) {
      this.setFixedHeight();
      el.addEventListener("transitionend", done, { once: true });
    },
    afterEnterContent() {
      this.removeFixedHeight();
      this.$emit("afterOpen", this);
    },
    afterLeaveContent() {
      this.$emit("afterClose", this);
    },
    isAccordionOnScreen() {
      const subject = this.$el;
      const subjectRect = subject?.getBoundingClientRect();
      const viewHeight =
        window.innerHeight || document.documentElement.clientHeight;

      const isSubjectVisible =
        subjectRect?.top <= viewHeight && subjectRect?.bottom >= 0;

      return isSubjectVisible;
    },
    updateModelsIfOnScreen() {
      if (this.models !== this.shownModels && this.isAccordionOnScreen()) {
        this.$set(this, "shownModels", this.models);
      }
    },
    removePendingModelChange(uid) {
      const index = this.modelsChangesPending.indexOf(uid);
      if (index !== -1) {
        this.modelsChangesPending.splice(index, 1);
      }
    },
  },
};
</script>

<style scoped>
/* Component-specific styles (optional) */
</style>
