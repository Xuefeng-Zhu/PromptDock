import { useCallback, useEffect, useRef, useState } from 'react';

interface ScrollSpyItem<SectionId extends string> {
  id: SectionId;
}

export function useSettingsScrollSpy<SectionId extends string>(
  items: readonly ScrollSpyItem<SectionId>[],
  initialSection: SectionId,
  offset = 72,
) {
  const [activeSection, setActiveSection] = useState<SectionId>(initialSection);
  const contentScrollRef = useRef<HTMLDivElement | null>(null);
  const sectionRefs = useRef<Partial<Record<SectionId, HTMLElement | null>>>({});

  const scrollToSection = useCallback((id: SectionId) => {
    setActiveSection(id);
    const el = sectionRefs.current[id];
    const container = contentScrollRef.current;
    if (el && container) {
      const containerTop = container.getBoundingClientRect().top;
      const sectionTop = el.getBoundingClientRect().top;
      const targetTop = container.scrollTop + sectionTop - containerTop;

      if (typeof container.scrollTo === 'function') {
        container.scrollTo({ top: targetTop, behavior: 'smooth' });
      } else {
        container.scrollTop = targetTop;
      }
    }
  }, []);

  const setSectionRef = useCallback(
    (id: SectionId) => (el: HTMLElement | null) => {
      sectionRefs.current[id] = el;
    },
    [],
  );

  useEffect(() => {
    const container = contentScrollRef.current;
    if (!container) return;
    const scrollContainer = container;

    function updateActiveSection() {
      const containerTop = scrollContainer.getBoundingClientRect().top;
      let current = initialSection;

      for (const item of items) {
        const section = sectionRefs.current[item.id];
        if (!section) continue;
        const sectionOffset = section.getBoundingClientRect().top - containerTop;
        if (sectionOffset <= offset) {
          current = item.id;
        }
      }

      setActiveSection(current);
    }

    scrollContainer.addEventListener('scroll', updateActiveSection, { passive: true });
    return () => scrollContainer.removeEventListener('scroll', updateActiveSection);
  }, [initialSection, items, offset]);

  return {
    activeSection,
    contentScrollRef,
    scrollToSection,
    setSectionRef,
  };
}
