// Type definitions for vue-virtual-scroller
// Project: https://github.com/Akryum/vue-virtual-scroller/
declare module "vue-virtual-scroller" {
  import Vue, { ComponentOptions, type PluginObject } from "vue";

  interface PluginOptions {
    installComponents?: boolean;
    componentsPrefix?: string;
  }

  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  declare const plugin: PluginObject<PluginOptions> & { version: string };

  export class RecycleScroller extends Vue {
    sizes: Array<{ accumulator: number }>;
    // eslint-disable-next-line @typescript-eslint/no-restricted-types
    itemSize: number | null;
    totalSize: number;
    ready: boolean;
    emitUpdate: boolean;
    prerender: number;
    pageMode: boolean;
    buffer: number;
    typeField: string;
    sizeField: string;
    // eslint-disable-next-line @typescript-eslint/no-restricted-types
    minItemSize: number | string | null;
    direction: "horizontal" | "vertical";
    pool: Array<{
      item: unknown;
      position: number;
      nr: {
        id: number;
        index: number;
        key: string;
        type: unknown;
        used: boolean;
      };
    }>;

    getScroll(): { start: number; end: number };

    scrollToItem(index: number): void;

    scrollToPosition(position: number);
  }

  export class DynamicScroller extends RecycleScroller {
    minItemSize: number | string;
    vscrollData: {
      active: boolean;
      sizes: Record<string, number>;
      validSizes: object;
      keyField: string;
      simpleArray: boolean;
    };

    $refs: {
      scroller: RecycleScroller;
    };

    onScrollerResize(): void;

    onScrollerVisible(): void;

    forceUpdate(clear?: boolean): void;

    scrollToItem(index: number): void;

    getItemSize(item: object, index?: number): number;

    scrollToBottom(): void;
  }

  export class DynamicScrollerItem extends Vue {}

  export default plugin;
}
