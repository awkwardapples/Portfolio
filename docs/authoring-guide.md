# Authoring guide

How to add and change what the site says, without touching application code. Everything lives in `apps/site/src/content/`, and every change goes live when it reaches `main`.

## Three ways to publish

1. **The browser editor** at `/admin` (Sveltia CMS). Sign in with **Sign In with Token**, using a fine-grained GitHub personal access token for `awkwardapples/Portfolio` with **Contents: Read and write**. Each save is a commit to `main`, which deploys. Good for quick posts from any device.
2. **`pnpm new`**, which creates an entry folder with the right fields and leaves it as a draft:

   ```bash
   pnpm new post --title "A new post" --threads ai,university
   pnpm new work --title "A new project" --kind software --threads software,music
   pnpm new post --title "Photos from a gig" --threads music --from C:/Users/Josh/Pictures/gig
   ```

   Run it without flags to be asked for each value. `--from` brings in every photo, PDF and audio file in that folder.

3. **By hand.** Copy an existing entry folder, rename it, and edit the frontmatter and text.

Preview with `pnpm dev`. The page `http://localhost:4321/dev/content` lists every entry, drafts included, with every gap highlighted. It exists only in development.

## Drafts and placeholders

- An entry with `draft: true` appears in development (marked as a draft) and is left out of the live site. New entries start as drafts; remove the line when the entry is ready.
- When a fact is missing, write `TODO(josh): what is needed`. Development highlights it in place.
- **A placeholder can only stay in a draft.** If a published entry still contains `TODO(josh)`, the build stops and names the file and the field. In the profile, list items (experience, education, photos) can be drafts on their own.
- `pnpm content:todo` lists every placeholder and every draft, which is the to-do list for the site's content.

## Folders and fields

| What               | Folder                                          | Its address           |
| ------------------ | ----------------------------------------------- | --------------------- |
| A post             | `content/posts/2026-10-04-a-new-post/index.mdx` | `/log/a-new-post`     |
| A project or paper | `content/work/a-new-project/index.mdx`          | `/work/a-new-project` |
| Facts about you    | `content/profile/profile.yaml`                  | Used across the site  |

Folder names are lowercase words joined by hyphens; they become the address and should not change once published.

A **post** needs `title`, `date`, `summary` (at most 220 characters) and `threads`. Optional: `project` (the folder name of the work it is about), `tags`, `media`. A post can be only a summary and media; it still gets its own page.

A **work entry** also needs `kind` (research, software, venture, music or writing), `status` (complete, ongoing or archived), `role` (for example "Sole author") and `authorship.type` (sole, lead or contributor; team work is never sole). Optional fields include `subtitle`, `context` (institution, programme, result), `tech`, `tags`, `links`, `documents`, `media`, `references`, `related`, and `featured` with `featuredOrder` for the homepage.

**Threads** say which sides of you an entry belongs to: `ai`, `research`, `software`, `venture`, `music`, `university`, `life`.

## Media

Add items under `media:` in the order they should appear:

```yaml
media:
  - type: image
    src: ./gig.jpg
    alt: What the photo shows, for someone who cannot see it
    caption: Where and when, specifically
  - type: youtube
    id: wWAGaOdlyMw # the 11 characters after watch?v=
    title: Video title
  - type: spotify
    url: https://open.spotify.com/track/...
    title: Track title
  - type: audio
    src: /media/audio/2026-10-04-demo.mp3
    title: Demo
    transcript: Needed if there is speech.
  - type: video
    name: studio-loop # made with pnpm media:video
    title: What the footage shows
    loop: true
```

Every image needs alt text that says what it shows. Photos of other people need their agreement before they go up, and captions only name people who agreed.

Photos: run `pnpm media:images <files> --to <entry folder>` first. It resizes them, fixes their rotation and removes location data. PDFs: run `pnpm media:pdf <file> --to <entry folder>`, then list the document under `documents:`. Both commands print the lines to paste. The details are in [`media-pipeline.md`](media-pipeline.md).

## In the body

Some things in the body of an entry or post turn into richer blocks on their own. Each one has to be **alone on its line**, with a blank line before and after:

| Write                                                      | You get                                                   |
| ---------------------------------------------------------- | --------------------------------------------------------- |
| `https://youtu.be/wWAGaOdlyMw`                             | the video, which loads from YouTube only when played      |
| `[Testing on the Iris data](https://youtu.be/wWAGaOdlyMw)` | the same, with the link text as its title                 |
| `https://open.spotify.com/track/...`                       | the track, which loads Spotify's player only when played  |
| `[The report](/documents/neural-network-iris-report.pdf)`  | the document's card: cover, page count, Open and Download |
| `![What the image shows](./photo.jpg "Where and when")`    | the image as a figure, with the quoted text as caption    |

A link inside a sentence stays an ordinary link. A document card needs the PDF listed under some entry's `documents:`, which is where its details come from.

For more control, these components work in any `.mdx` body without an import:

```mdx
import photo from './photo.jpg';

<Figure src={photo} alt="What the image shows" caption="Where and when" zoom />

<Aside title="A note">Text set apart from the narrative.</Aside>

<YouTube id="wWAGaOdlyMw" title="Testing on the Iris data" start={65} />

<Spotify url="https://open.spotify.com/track/..." title="Track title" />

<Video name="studio-loop" title="What the footage shows" />

<Audio src="/media/audio/demo.mp3" title="Demo" transcript="..." />
```

`zoom` on a `<Figure>` opens the image full size in a viewer. The before-and-after comparison (`<Compare>`) arrives once there are Kerr images that can be published.

## The profile

`content/profile/profile.yaml` holds your name, headline, bios, the "Now" list, links, education, experience and skills. Things still missing are noted in comments starting `# TODO(josh)`. To add one, write the field and delete the comment; for example, once you have the LinkedIn URL:

```yaml
links:
  github: https://github.com/awkwardapples
  linkedin: https://www.linkedin.com/in/...
```

The Mercor entry stays exactly as confirmed: title ending "[Contract]", no client names, no links or images, nothing beyond the confirmed description lines.

## Writing

Plain, first person, sentence case, no marketing words and no emoji (the build checks for some of these). Buttons and links say what happens: "Read the paper", "Download CV (PDF, 140 kB)". Facts about you come from you: if something is not confirmed, it is a placeholder in a draft, not a guess.
