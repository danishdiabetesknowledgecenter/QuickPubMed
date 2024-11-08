<template>
  <div id="main-content">
    <main-wrapper language="dk" :hide-topics="[]"></main-wrapper>
    <search-gallery language="en" :hide-topics="[]"></search-gallery>
  </div>
</template>

<script>
import MainWrapper from "@/components/MainWrapper.vue";
import SearchGallery from "@/components/SearchGallery.vue";

export default {
  name: "App",
  components: {
    MainWrapper,
    SearchGallery,
  },
  data() {
    return {
      sectionedAbstract: {
        "Section 1":
          "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas venenatis purus eu justo ultricies porttitor. Vivamus bibendum tellus eu auctor mollis. In fermentum at tortor sit amet dictum. In nec bibendum nibh. Aliquam erat volutpat. Aenean est metus, suscipit quis tellus vel, finibus dapibus mauris. Integer convallis aliquam libero, ut vestibulum augue suscipit eu. Sed vehicula laoreet ullamcorper.",
        "Section 2":
          "Duis dignissim nunc odio, faucibus sodales lacus accumsan id. Nunc at tincidunt turpis. Nullam nunc mi, accumsan non justo sit amet, tristique aliquam nisl. Curabitur vitae fermentum elit. In hac habitasse platea dictumst. Pellentesque risus nisl, sagittis in metus quis, sagittis bibendum urna. Cras pellentesque aliquet lacinia. Quisque cursus, mi a congue laoreet, dolor justo elementum nulla, sit amet efficitur nunc mauris facilisis magna. Quisque tempus iaculis nisi, eget condimentum lacus elementum sed.",
      },
    };
  },
  mounted() {},
};
</script>

<style></style>
