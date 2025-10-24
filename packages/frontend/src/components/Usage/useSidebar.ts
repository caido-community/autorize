import { ref } from "vue";

type Section = {
  id: string;
  title: string;
};

export const useSidebar = () => {
  const sections: Section[] = [
    { id: "what-is-autorize", title: "What is Autorize?" },
    { id: "how-it-works", title: "How It Works" },
    { id: "request-sources", title: "Sending Requests" },
    { id: "access-states", title: "Access States" },
    { id: "mutations", title: "Mutations System" },
    { id: "filtering", title: "Filtering Requests" },
    { id: "detection", title: "Custom Detection" },
    { id: "queue-settings", title: "Queue Settings" },
    { id: "general-settings", title: "General Settings" },
    { id: "ui-settings", title: "UI Settings" },
  ];

  const activeSection = ref<string>(sections[0]?.id ?? "");

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element !== null) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return {
    sections,
    activeSection,
    scrollToSection,
  };
};
