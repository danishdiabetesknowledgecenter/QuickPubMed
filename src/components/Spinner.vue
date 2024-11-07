<template>
  <div
    v-if="loading || condition"
    class="qpm_loading d-flex flex-column align-items-center justify-items-center"
  >
    <p v-if="waitText" style="margin-bottom: 15px">{{ waitText }}</p>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      class="qpm_gear"
      :width="size"
      :height="size"
      viewBox="0 0 126 126"
      alt=""
      role="presentation"
      aria-labelledby="titlelogo"
    >
      <circle
        cx="63"
        cy="63"
        r="63"
        class="circle5"
        fill="transparent"
      ></circle>
      <path
        class="path11"
        d="M70.7 62.2c-.4-4.2-4.2-7.3-8.4-6.9-4.7.5-8 5.1-6.6 9.9.9 2.9 3.5 5.1 6.6 5.4 4.9.5 8.9-3.7 8.4-8.4z"
        fill="#009ce8"
      ></path>
      <path
        class="path13"
        d="M30.6 50.2c-5.8-2.6-11.9-3.6-17.9-3.1-1.2 3.6-1.9 7.5-2.3 11.4 5.1-1 10.5-.6 15.6 1.7 12.9 5.8 18.6 21 12.8 33.9-1.9 4.3-4.9 7.8-8.5 10.3 3 2.4 6.3 4.5 9.9 6.1 3.6-3.3 6.5-7.3 8.6-11.9 8.5-18.4.3-40.1-18.2-48.4z"
        fill="#009ce8"
      ></path>
      <path
        class="path15"
        d="M50.9 99.5c-2.1 4.6-5 8.7-8.5 12 2.9 1.2 6 2.2 9.1 2.9 2.7-4 4.7-8.5 5.7-13.6 1.7-8.7.2-17.4-3.7-24.6 1.6 7.6.8 15.7-2.6 23.3z"
        fill="#009ce8"
      ></path>
      <path
        class="path17"
        d="M25.3 62.1c-4.9-2.2-10.1-2.6-14.9-1.5v.5c-.1 3.1.1 6.2.5 9.1 4.7-2.2 10.1-2.9 15.6-1.8 3.8.8 7.2 2.3 10.1 4.5-2.3-4.5-6.2-8.4-11.3-10.8z"
        fill="#009ce8"
      ></path>
      <path
        class="path19"
        d="M90.3 41.3c5.2-3.7 9.1-8.6 11.6-13.9-2.6-2.9-5.5-5.4-8.7-7.6-1.6 4.9-4.8 9.4-9.3 12.7-11.5 8.3-27.5 5.6-35.8-5.8-2.7-3.8-4.3-8.1-4.7-12.5-3.6 1.5-7.1 3.3-10.2 5.5 1 4.7 3 9.2 6 13.4 11.8 16.3 34.7 20 51.1 8.2z"
        fill="#009ce8"
      ></path>
      <path
        class="path21"
        d="M33.1 39.1C39.8 45 48 48 56.3 48.2c-7.3-2.5-13.9-7.2-18.8-14-2.9-4.1-5-8.6-6.2-13.3-2.6 1.9-4.9 4.1-7.1 6.5 2.1 4.3 5 8.3 8.9 11.7z"
        fill="#009ce8"
      ></path>
      <path
        class="path23"
        d="M82.6 30.7c4.3-3.1 7.3-7.4 8.7-12.2-2.7-1.7-5.6-3.2-8.6-4.5-.5 5.2-2.5 10.2-6.2 14.4-2.6 2.9-5.6 5.1-8.9 6.5 5.1.4 10.5-1 15-4.2z"
        fill="#009ce8"
      ></path>
      <path
        class="path25"
        d="M100.9 57.3c-20.1 2-34.8 20-32.8 40.1.6 6.3 2.9 12.1 6.3 17 3.8-.9 7.5-2.1 11-3.8-3.4-3.9-5.7-8.8-6.3-14.4C77.7 82.1 88 69.5 102 68.1c4.7-.5 9.2.4 13.2 2.2.3-1.9.4-3.8.5-5.7.1-2 0-3.9-.1-5.9-4.6-1.3-9.6-1.9-14.7-1.4z"
        fill="#009ce8"
      ></path>
      <path
        class="path27"
        d="M79.2 64.5c5.8-5.1 13.2-8.5 21.5-9.3 5-.5 10 0 14.6 1.3-.4-3.2-1.1-6.4-2-9.4-4.8-.4-9.8.2-14.6 1.8-8.4 2.9-15.2 8.5-19.5 15.6z"
        fill="#009ce8"
      ></path>
      <path
        class="path29"
        d="M86.2 91.8c-1.2-3.7-1.6-7.4-1.2-11-2.9 4.4-4.3 9.7-3.8 15.3.5 5.3 2.8 10 6.2 13.6 2.9-1.5 5.6-3.3 8.1-5.3-4.2-3-7.6-7.3-9.3-12.6z"
        fill="#009ce8"
      ></path>
    </svg>
    <p v-if="waitDurationDisclaimer">{{ waitDurationDisclaimer }}</p>
  </div>
</template>

<script>
export default {
  name: "Spinner",
  props: {
    loading: {
      type: Boolean,
      default: false,
    },
    loadingComponent: {
      type: Boolean,
      default: false,
    },
    loadingAbstract: {
      type: Boolean,
      default: false,
    },
    waitText: {
      type: String,
      default: "",
    },
    waitDurationDisclaimer: {
      type: String,
      default: "",
    },
    size: {
      type: Number,
      default: 50,
    },
  },
  computed: {
    condition() {
      return this.loadingAbstract || this.loadingComponent;
    },
  },
};
</script>

<style scoped>
/* Component-specific styles (optional) */
</style>
