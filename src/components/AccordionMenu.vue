<template>
  <div class="column is-half">
    <div
      class="qpm_accordion"
      :class="{ 'not-expanded': !getIsExpanded, 'qpm_accordion-open': getIsExpanded }"
    >
      <div
        class="qpm_accordion-toggle"
        role="button"
        tabindex="0"
        :aria-expanded="getIsExpanded"
        :aria-controls="accordionBodyId"
        @click="toggleAccordionState"
        @keydown.enter.prevent="toggleAccordionState"
        @keydown.space.prevent="toggleAccordionState"
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
            <span class="qpm_accordion-header-icon">
              <span class="icon">
                <i class="fa fa-angle-up" aria-hidden="true" />
              </span>
            </span>
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
        <div v-show="getIsExpanded" :id="accordionBodyId" ref="body" class="qpm_accordion-content">
          <div class="content">
            <slot />
            <transition-group
              v-if="shownModels && shownModels.length !== 0"
              appear
              name="list-fade"
              tag="ul"
              class="qpm_box qpm_resetList"
              :css="true"
              @before-leave="beforeLeaveListItem"
              @leave="leaveListItem"
              @after-leave="afterLeaveListItem"
              @before-enter="beforeEnterListItem"
              @enter="enterListItem"
              @after-enter="afterEnterListItem"
            >
              <li
                v-for="item in shownModels"
                :key="item.uid"
                ref="listItems"
                class="list-fade-item"
                :name="'transition-item-' + item.uid"
              >
                <slot name="listItem" :model="item" />
              </li>
            </transition-group>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script>
  import { throttle } from "@/utils/componentHelpers";

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
    emits: ["expanded-changed", "close", "open", "changed:items", "afterOpen", "afterClose"],
    data() {
      return {
        expanded: this.openByDefault,
        shownModels: [],
        modelsChangesPending: [],
        onScrollThrottled: null,
        accordionBodyId: `qpm-accordion-body-${Math.random().toString(36).slice(2, 10)}`,
      };
    },
    computed: {
      getTitle() {
        return this.title || (this.expanded ? "close" : "open");
      },
      getIsExpanded() {
        return this.isExpanded ?? this.expanded;
      },
    },
    watch: {
      getIsExpanded: {
        immediate: true,
        handler(newState) {
          this.$emit("expanded-changed", newState);
        },
      },
      models(newModelState, oldModelState) {
        const safeOld = Array.isArray(oldModelState) ? oldModelState : [];
        const safeNew = Array.isArray(newModelState) ? newModelState : [];
        const oldIds = safeOld.map((model) => model.uid);
        const newModels = safeNew.map((model) => model.uid).filter((uid) => oldIds.includes(uid));
        this.modelsChangesPending.splice(safeNew.length, 0, ...newModels);

        if (this.onlyUpdateModelWhenVisible) {
          this.updateModelsIfOnScreen();
        } else {
          this.shownModels = safeNew;
        }
      },
    },
    mounted() {
      if (this.onlyUpdateModelWhenVisible) {
        this.onScrollThrottled = throttle(this.updateModelsIfOnScreen.bind(this), 120);
        window.addEventListener("scroll", this.onScrollThrottled, {
          passive: true,
        });
        if (this.openByDefault) {
          this.updateModelsIfOnScreen();
        }
      }
    },
    beforeUnmount() {
      if (this.onlyUpdateModelWhenVisible && this.onScrollThrottled) {
        window.removeEventListener("scroll", this.onScrollThrottled);
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
        const body = this.$refs.body;
        if (!body?.firstElementChild) return 0;
        const content = body.firstElementChild;
        const height = content.scrollHeight;
        return height;
      },
      setFixedHeight() {
        const body = this.$refs.body;
        if (!body) return;
        body.style.height = `${this.calcHeight()}px`;
      },
      removeFixedHeight() {
        const body = this.$refs.body;
        if (!body) return;
        body.style.height = null;
      },
      subtractElementHeight(el) {
        const body = this.$refs.body;
        if (!body || !el) return;
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
        if (!el) return;
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
        if (!subject || typeof subject.getBoundingClientRect !== "function") return false;
        const subjectRect = subject?.getBoundingClientRect();
        const viewHeight = window.innerHeight || document.documentElement.clientHeight;

        const isSubjectVisible = subjectRect?.top <= viewHeight && subjectRect?.bottom >= 0;

        return isSubjectVisible;
      },
      updateModelsIfOnScreen() {
        const safeModels = Array.isArray(this.models) ? this.models : [];
        if (safeModels !== this.shownModels && this.isAccordionOnScreen()) {
          this.shownModels = safeModels;
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
