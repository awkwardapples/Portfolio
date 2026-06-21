import FooterLayout from './Layout';
import type { FooterContent } from './types';

export interface FooterProps {
  content: FooterContent;
}

export const Footer = ({ content }: FooterProps) => {
  return <FooterLayout content={content} />;
};

export default Footer;
