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
          @translating="handleUpdatePlaceholder"
        />
        <i v-if="subjects.length > 1" class="qpm_removeSubject bx bx-x" @click="removeSubject(n)" />
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
        class="qpm_slim multiselect__input"
        style="width: 120px; padding: 4px 12px 4px 11px !important; height: 38px"
        @click="addSubject"
      >
        {{ getString("addsubjectlimit") }} {{ getString("addsubject") }}
      </button>
    </div>
    <div v-if="advanced && !showFilter && hasSubjects" style="margin-bottom: 15px">
      <!-- Button for adding limit -->
      <button
        v-tooltip="{
          content: getString('hoverLimitButton'),
          offset: 5,
          delay: $helpTextDelay,
        }"
        class="qpm_slim multiselect__input"
        style="padding: 4px 12px 4px 11px !important; height: 38px"
        type="button"
        :class="{ qpm_shown: showFilter }"
        @click="toggle"
      >
        {{ getString("addsubjectlimit") }} {{ getString("addlimit") }}
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
      subjects: Array,
      hideTopics: Array,
      subjectOptions: Array,
      dropdownPlaceholders: Array,
      language: String,
      advanced: Boolean,
      showFilter: Boolean,
      hasSubjects: Boolean,
      searchWithAI: Boolean,
      getString: {
        type: Function,
        required: true,
        default: () => "",
      },
    },
    methods: {
      handleUpdateSubjects(payload) {
        this.$emit("update-subjects", payload);
      },
      handleUpdateScope(payload) {
        this.$emit("update-scope", payload);
      },
      handleShouldFocusNextDropdownOnMount(payload) {
        this.$emit("should-focus-next-dropdown", payload);
      },
      handleUpdatePlaceholder(payload) {
        this.$emit("update-placeholder", payload);
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
