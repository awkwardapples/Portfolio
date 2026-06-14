import { describe, it, expect } from 'vitest';
import type { ProjectsContent, ProjectItem } from '../types';

describe('ProjectsContent', () => {
  it('requires heading and a projects array', () => {
    const content: ProjectsContent = {
      heading: 'Our Recent Work',
      projects: [],
    };
    expect(content.heading).toBe('Our Recent Work');
    expect(Array.isArray(content.projects)).toBe(true);
  });

  it('each project requires id, name, imageUrl, and imageAlt', () => {
    const project: ProjectItem = {
      id: 'p1',
      name: 'Garden fence installation',
      imageUrl: '/images/fence-1.jpg',
      imageAlt: 'Wooden garden fence',
    };
    expect(project.id).toBe('p1');
    expect(project.imageUrl).toBe('/images/fence-1.jpg');
    expect(project.imageAlt.length).toBeGreaterThan(0);
  });

  it('project description is optional', () => {
    const withDesc: ProjectItem = {
      id: 'p1',
      name: 'Garden fence',
      imageUrl: '/images/fence-1.jpg',
      imageAlt: 'Fence',
      description: 'A solid garden fence.',
    };
    const withoutDesc: ProjectItem = {
      id: 'p2',
      name: 'Decking',
      imageUrl: '/images/deck-1.jpg',
      imageAlt: 'Deck',
    };
    expect(withDesc.description).toBe('A solid garden fence.');
    expect(withoutDesc.description).toBeUndefined();
  });
});
