<template>
  <div id="main-content">
    <main-wrapper
      language="dk"
      :hide-topics="[]"
    />
    <search-gallery
      language="en"
      :hide-topics="[]"
    />
    <div
      id="qpm_vappX"
      class="qpm_vapp"
    >
      <specific-articles ids="36360447" />
    </div>
  </div>
</template>

<script>
import MainWrapper from "@/components/MainWrapper.vue";
import SearchGallery from "@/components/SearchGallery.vue";
import SpecificArticles from "@/components/SpecificArticles.vue";

export default {
  name: "App",
  components: {
    MainWrapper,
    SearchGallery,
    SpecificArticles,
  },
};
</script>

<style></style>
