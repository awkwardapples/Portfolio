import { useState } from 'react';
import FAQLayout from './Layout';
import type { FAQContent } from './types';

export interface FAQProps {
  content: FAQContent;
  id?: string;
  extraClassName?: string;
}

export const FAQ = ({ content, id, extraClassName }: FAQProps) => {
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());

  const handleToggle = (itemId: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  return (
    <FAQLayout
      heading={content.heading}
      subheading={content.subheading}
      items={content.items}
      openItemIds={openIds}
      onToggleItem={handleToggle}
      cta={content.cta}
      sectionId={id}
      extraClassName={extraClassName}
    />
  );
};

export default FAQ;
