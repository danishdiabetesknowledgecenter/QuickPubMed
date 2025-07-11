<template>
  <div>
    <div v-for="(item, n) in subjects" :key="`item-${item.id}-${n}`" class="qpm_subjects">
      <div class="qpm_flex">
        <dropdown-wrapper
          ref="subjectDropdown"
          :is-multiple="true"
          :data="subjectOptions"
          :hide-topics="hideTopics"
          :is-group="true"
          :placeholder="dropdownPlaceholders[n]"
          :operator="getString('orOperator')"
          :taggable="true"
          :selected="item"
          :close-on-input="false"
          :language="language"
          :search-with-a-i="searchWithAI"
          :show-scope-label="advanced"
          :no-result-string="getString('noTopicDropdownContent')"
          :index="n"
          @input="handleUpdateSubjects"
          @updateScope="handleUpdateScope"
          @mounted="handleShouldFocusNextDropdownOnMount"
          @translating="handleTranslating"
        />

        <i
          v-if="subjects.length > 1"
          class="qpm_removeSubject bx bx-x"
          role="button"
          tabindex="0"
          aria-label="Remove subject"
          @click="removeSubject(n)"
          @keydown.enter.prevent="removeSubject(n)"
        />
      </div>
      <p
        v-if="n >= 0 && hasSubjects"
        class="qpm_subjectOperator"
        :style="{ color: n < subjects.length - 1 ? '#000000' : 'darkgrey' }"
      >
        {{ getString("andOperator") }}
      </p>
    </div>
    <div
      v-if="hasSubjects"
      style="margin: 5px 0 20px 0"
      @keydown.enter.capture.passive="focusNextDropdownOnMount = true"
    >
      <button
        v-tooltip="{
          content: getString('hoverAddSubject'),
          offset: 5,
          delay: $helpTextDelay,
        }"
        class="qpm_slim qpm_button"
        @click="addSubject"
      >
        {{ getString("addsubjectlimit") }} {{ getString("addsubject") }}
      </button>
    </div>
  </div>
</template>

<script>
  import DropdownWrapper from "@/components/DropdownWrapper.vue";

  export default {
    name: "SubjectSelection",
    components: {
      DropdownWrapper,
    },
    props: {
      subjects: { type: Array, required: true, default: () => [] },
      hideTopics: { 
        type: Array, 
        default: () => [],
        validator: function(value) {
          console.log('hideTopics validator:', value);
          return Array.isArray(value);
        }
      },
      subjectOptions: { type: Array, required: true, default: () => [] },
      dropdownPlaceholders: { type: Array, required: true, default: () => [] },
      language: { type: String, default: "dk" },
      getString: {
        type: Function,
        required: true,
        default: () => "",
      },
      advanced: Boolean,
      showFilter: Boolean,
      hasSubjects: Boolean,
      searchWithAI: Boolean,
    },
    watch: {
      hideTopics: {
        immediate: true,
        handler(newVal) {
          console.log('hideTopics changed in SubjectSelection:', newVal);
          this.$nextTick(() => {
            if (this.$refs.subjectDropdown) {
              // Force opdatering af alle dropdown komponenter
              this.$refs.subjectDropdown.forEach(dropdown => {
                if (dropdown) {
                  dropdown.updateSortedSubjectOptions();
                  dropdown.$forceUpdate();
                }
              });
            }
          });
        }
      }
    },
    mounted() {
      // Ensures initial state
      this.$nextTick(() => {
        if (this.$refs.subjectDropdown) {
          this.$refs.subjectDropdown.forEach(dropdown => {
            if (dropdown) {
              dropdown.updateSortedSubjectOptions();
            }
          });
        }
      });
    },
    methods: {
      handleUpdateSubjects(value, index) {
        this.$emit("update-subjects", value, index);
      },
      handleUpdateScope(item, state, index) {
        this.$emit("update-scope", item, state, index);
      },
      handleShouldFocusNextDropdownOnMount(payload) {
        this.$emit("should-focus-next-dropdown", payload);
      },
      handleTranslating(isTranslating, index) {
        console.log("handleTranslating | emitting 'update-placeholder' ", isTranslating, index);
        this.$emit("update-placeholder", isTranslating, index);
      },
      addSubject() {
        this.$emit("add-subject");
      },
      removeSubject(index) {
        this.$emit("remove-subject", index);
      },
      toggle() {
        this.$emit("toggle-filter");
      },
    },
  };
</script>
