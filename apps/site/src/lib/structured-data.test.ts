import { describe, expect, it } from 'vitest';

import {
  KNOWS_ABOUT,
  breadcrumbs,
  person,
  post,
  profilePage,
  recording,
  serialize,
  video,
  website,
  work,
} from './structured-data';
import { vocabularyProblems } from './testing/schema-org';

const SITE = 'https://joshlennon.com';

const josh = person({
  site: SITE,
  name: 'Josh Lennon',
  alternateNames: ['Joshua Lennon', 'Joshua Michael Lennon'],
  headline: { role: 'AI Engineer', focus: ['Machine learning', 'Agentic AI', 'NLP'] },
  links: {
    github: 'https://github.com/awkwardapples',
    linkedin: 'TODO(josh): the LinkedIn URL',
    youtube: 'https://www.youtube.com/channel/abc',
  },
  education: [
    { institution: 'University of Manchester', status: 'complete' },
    { institution: 'University of Surrey', status: 'in-progress' },
  ],
});

describe('person (spec S)', () => {
  it('describes Josh from the profile, with the fixed knowsAbout list and no job title', () => {
    expect(josh).toEqual({
      '@type': 'Person',
      '@id': 'https://joshlennon.com/#person',
      name: 'Josh Lennon',
      alternateName: ['Joshua Lennon', 'Joshua Michael Lennon'],
      url: 'https://joshlennon.com/',
      description: 'AI Engineer: Machine learning, Agentic AI and NLP',
      knowsAbout: KNOWS_ABOUT,
      alumniOf: { '@type': 'CollegeOrUniversity', name: 'University of Manchester' },
      affiliation: { '@type': 'CollegeOrUniversity', name: 'University of Surrey' },
      sameAs: ['https://github.com/awkwardapples', 'https://www.youtube.com/channel/abc'],
    });
    expect(josh).not.toHaveProperty('jobTitle');
    expect(josh).not.toHaveProperty('image');
  });

  it('adds the portrait once there is one', () => {
    const withPortrait = person({
      site: SITE,
      name: 'Josh Lennon',
      alternateNames: [],
      headline: { role: 'AI Engineer', focus: [] },
      portraitUrl: 'https://joshlennon.com/_astro/portrait.jpg',
      links: {},
      education: [],
    });
    expect(withPortrait.image).toBe('https://joshlennon.com/_astro/portrait.jpg');
    expect(withPortrait.description).toBe('AI Engineer');
    expect(withPortrait).not.toHaveProperty('alumniOf');
    expect(withPortrait).not.toHaveProperty('sameAs');
  });
});

describe('work', () => {
  const base = {
    site: SITE,
    url: 'https://joshlennon.com/work/kerr-microscopy-dissertation',
    title: 'Extracting magnetic information from Kerr Microscopy images',
    summary: 'An automated image-processing pipeline.',
    tags: ['computer vision', 'image processing'],
  };

  it('is a Thesis for a dissertation, by Josh, with its PDF and institution', () => {
    const node = work({
      ...base,
      kind: 'research',
      date: new Date('2025-08-11'),
      authorship: 'sole',
      context: { institution: 'University of Manchester', programme: 'BSc dissertation' },
      documents: [
        {
          url: 'https://joshlennon.com/documents/kerr-microscopy-dissertation.pdf',
          title: base.title,
          docType: 'dissertation',
        },
      ],
    });
    expect(node).toMatchObject({
      '@type': 'Thesis',
      datePublished: '2025-08-11',
      author: { '@id': 'https://joshlennon.com/#person' },
      inSupportOf: 'BSc dissertation',
      sourceOrganization: { '@type': 'CollegeOrUniversity', name: 'University of Manchester' },
      keywords: 'computer vision, image processing',
      associatedMedia: {
        '@type': 'MediaObject',
        contentUrl: 'https://joshlennon.com/documents/kerr-microscopy-dissertation.pdf',
        encodingFormat: 'application/pdf',
      },
    });
    expect(vocabularyProblems(node)).toEqual([]);
  });

  it('is a ScholarlyArticle for a paper, and a CreativeWork otherwise', () => {
    const paper = work({
      ...base,
      kind: 'research',
      documents: [{ url: 'https://joshlennon.com/documents/p.pdf', title: 'P', docType: 'paper' }],
    });
    expect(paper['@type']).toBe('ScholarlyArticle');
    expect(paper.headline).toBe(base.title);
    const software = work({ ...base, kind: 'software', documents: [] });
    expect(software['@type']).toBe('CreativeWork');
    expect(software).not.toHaveProperty('associatedMedia');
    expect(software).not.toHaveProperty('headline');
  });

  it('names Josh a contributor on shared work and says nothing when authorship is unknown', () => {
    const shared = work({ ...base, kind: 'software', documents: [], authorship: 'contributor' });
    expect(shared.contributor).toEqual({ '@id': 'https://joshlennon.com/#person' });
    expect(shared).not.toHaveProperty('author');
    const unknown = work({ ...base, kind: 'software', documents: [] });
    expect(unknown).not.toHaveProperty('author');
    expect(unknown).not.toHaveProperty('contributor');
  });
});

describe('the other nodes', () => {
  it('adds a VideoObject only once the upload date is known', () => {
    expect(video({ id: 'wWAGaOdlyMw', title: 'Output verification' })).toBeUndefined();
    const node = video({
      id: 'wWAGaOdlyMw',
      title: 'Output verification',
      uploadDate: new Date('2023-05-01'),
    });
    expect(node).toMatchObject({ '@type': 'VideoObject', uploadDate: '2023-05-01' });
    expect(vocabularyProblems(node)).toEqual([]);
  });

  it('builds breadcrumbs with absolute URLs in order', () => {
    const node = breadcrumbs(SITE, [
      { name: 'Home', path: '/' },
      { name: 'Work', path: '/work' },
      { name: 'Neural network from scratch', path: '/work/neural-network-from-scratch' },
    ]);
    expect(node.itemListElement).toEqual([
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://joshlennon.com/' },
      { '@type': 'ListItem', position: 2, name: 'Work', item: 'https://joshlennon.com/work' },
      {
        '@type': 'ListItem',
        position: 3,
        name: 'Neural network from scratch',
        item: 'https://joshlennon.com/work/neural-network-from-scratch',
      },
    ]);
  });

  it('uses only schema.org types and properties, absolute URLs and ISO dates', () => {
    const nodes = [
      josh,
      website(SITE, 'Josh Lennon'),
      profilePage(SITE, 'https://joshlennon.com/about'),
      breadcrumbs(SITE, [{ name: 'Home', path: '/' }]),
      recording(SITE, { title: 'A song', url: 'https://open.spotify.com/track/abc' }),
      post({
        site: SITE,
        url: 'https://joshlennon.com/log/first',
        title: 'First',
        summary: 'A post.',
        date: new Date('2026-10-01'),
      }),
    ];
    expect(nodes.flatMap((node) => vocabularyProblems(node))).toEqual([]);
    expect(vocabularyProblems({ '@type': 'Person', jobTitle: 'x' })).toEqual([
      'graph: Person has no property jobTitle',
    ]);
    expect(vocabularyProblems({ '@type': 'CreativeWork', url: '/work' })).toEqual([
      'graph.url: /work is not an absolute https URL',
    ]);
  });

  it('serializes one graph and escapes < so no value can close the script element', () => {
    const text = serialize([{ '@type': 'CreativeWork', name: '</script><b>' }, undefined]);
    expect(text).not.toContain('<');
    expect(JSON.parse(text)).toEqual({
      '@context': 'https://schema.org',
      '@graph': [{ '@type': 'CreativeWork', name: '</script><b>' }],
    });
  });
});
