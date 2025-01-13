/**
 * Mixin that watches the height of header elements to conditionally apply a left margin to corresponding answer elements.
 *
 * **Usage Requirements:**
 *
 * - **Header Elements**: The elements whose height you want to watch (e.g., question headers) must have a `ref` attribute set to `"headerText"`.
 *   - Example:
 *     ```html
 *     <div ref="headerText" class="header-class">
 *       <!-- Header content -->
 *     </div>
 *     ```
 *
 * - **Answer Elements**: The elements that need the conditional margin applied must use the `getAnswerStyle(index)` method in their `:style` binding.
 *   - Example:
 *     ```html
 *     <div :style="getAnswerStyle(index)" class="answer-class">
 *       <!-- Answer content -->
 *     </div>
 *     ```
 *
 * **Parameters:**
 * - `index` (Number): The index of the current item, typically from a `v-for` loop.
 *
 * **Methods:**
 * - `getAnswerStyle(index)`: Returns the style string to be applied to the answer element based on the height of the corresponding header element.
 *
 * **Description:**
 * This mixin tracks the heights of specified header elements and applies a left margin to the corresponding answer elements if the header's height exceeds a certain threshold (default is 45 pixels). This is useful when you want to adjust the layout dynamically based on content size, such as when headers wrap onto multiple lines.
 */
export const questionHeaderHeightWatcherMixin = {
  data() {
    return {
      headerHeights: [],
    };
  },
  mounted() {
    this.updateHeaderHeights();
    window.addEventListener("resize", this.updateHeaderHeights);
  },
  beforeDestroy() {
    window.removeEventListener("resize", this.updateHeaderHeights);
  },
  methods: {
    updateHeaderHeights() {
      // Ensure that $refs.headerText is an array
      const headerRefs = Array.isArray(this.$refs.headerText)
        ? this.$refs.headerText
        : [this.$refs.headerText];
      this.headerHeights = headerRefs.map((element) => {
        return element ? element.clientHeight : 0;
      });
    },
    getAnswerStyle(index) {
      const height = this.headerHeights[index];
      console.log("Header Height:", height);
      if (height > 45) {
        console.log("adding margin");
        return "margin-left: 40px;";
      }
      return "";
    },
  },
  watch: {
    aiArticleSummaries() {
      this.$nextTick(this.updateHeaderHeights);
    },
  },
};
