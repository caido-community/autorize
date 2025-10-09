import { create } from "mutative";
import { type Config, type JobResult, type Template } from "shared";

import { requireSDK } from "./sdk";

type State = {
  config: Config;
  templates: Template[];
};

type Subscriber = (state: State) => void;

let state: State = {
  config: {
    enabled: false,
    testNoAuth: true,
    mutations: [
      {
        kind: "HeaderRemove",
        header: "test",
      },
    ],
    queue: {
      maxConcurrentRequests: 2,
      requestsPerSecond: 1,
      paused: false,
    },
    ui: {
      showOnlyLengths: true,
    },
    passiveFiltering: {
      httpql: "",
      onlyInScope: false,
    },
  },
  templates: [],
};

const subscribers = new Set<Subscriber>();

export const store = {
  getState(): State {
    return state;
  },

  updateConfig(newConfig: Partial<Config>) {
    state = create(state, (draft) => {
      Object.assign(draft.config, newConfig);
    });
    this.notify();
  },

  addTemplate(template: Template) {
    const sdk = requireSDK();

    state = create(state, (draft) => {
      draft.templates.push(template);
    });

    this.notify();
    sdk.api.send("template:created", template);
  },

  deleteTemplate(templateId: number) {
    const sdk = requireSDK();

    state = create(state, (draft) => {
      draft.templates = draft.templates.filter((t) => t.id !== templateId);
    });

    this.notify();
    sdk.api.send("template:deleted", templateId);
  },

  addTemplateResult(templateId: number, result: JobResult) {
    const sdk = requireSDK();

    state = create(state, (draft) => {
      const template = draft.templates.find((t) => t.id === templateId);
      if (template) {
        template.results.push(result);
        sdk.api.send("template:updated", templateId, template);
      }
    });

    this.notify();
  },

  clearTemplateResults(templateId: number) {
    const sdk = requireSDK();

    state = create(state, (draft) => {
      const template = draft.templates.find((t) => t.id === templateId);
      if (template) {
        template.results = [];
        sdk.api.send("template:updated", templateId, template);
      }
    });

    this.notify();
  },

  subscribe(sub: Subscriber) {
    subscribers.add(sub);
    return () => subscribers.delete(sub);
  },

  notify() {
    for (const sub of subscribers) {
      sub(state);
    }
  },
};
