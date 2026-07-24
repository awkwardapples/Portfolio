export interface ValueProp {
  heading: string;
  description: string;
}

/**
 * A real customer testimonial (Phase 8). `author` is whatever name/
 * attribution the customer gave permission to use — never fabricated.
 */
export interface Testimonial {
  quote: string;
  author: string;
}

export interface WhyChooseUsContent {
  heading: string;
  subheading?: string;
  valueProps: ValueProp[];
  /**
   * Optional — per the approved placement decision (ui-overhaul-plan.md
   * §9), real testimonials/reviews live inside Why Choose Us rather than
   * a new homepage section. Omitted entirely (not an empty array) when no
   * real testimonials exist yet for a given deployment.
   */
  testimonials?: Testimonial[];
  cta?: {
    label: string;
    href: string;
  };
}
